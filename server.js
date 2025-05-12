import express from 'express';
import { getMovies, initDb } from './database.js';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/movies', async (req, res) => {
  const { year, winner } = req.query;
  const filters = {};

  if (year) {
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1000 || yearNum > 3000) {
      return res.status(400).json({
        error: 'Parâmetro "year" deve ser um número válido entre 1000 e 3000.',
      });
    }
    filters.year = yearNum;
  }

  if (winner !== undefined) {
    const winnerStr = String(winner).toLowerCase();
    if (winnerStr !== 'true' && winnerStr !== 'false') {
      return res
        .status(400)
        .json({ error: 'Parâmetro "winner" deve ser "true" ou "false".' });
    }
    filters.winner = winnerStr === 'true';
  }

  try {
    const movies = await getMovies(filters);
    res.status(200).json(movies);
  } catch (error) {
    console.error('Erro no endpoint /movies:', error);
    res
      .status(500)
      .json({ error: 'Erro interno do servidor ao buscar filmes.' });
  }
});

function parseProducers(producersString) {
  if (
    !producersString ||
    typeof producersString !== 'string' ||
    producersString.trim() === ''
  ) {
    return [];
  }
  const names = producersString
    .replace(/,\s*and\s+/gi, ',') // "A, and B" -> "A,B"
    .replace(/\s+and\s+/gi, ',') // "A and B"  -> "A,B"
    .split(',');

  return names.map((name) => name.trim()).filter((name) => name.length > 0);
}

// Endpoint para intervalos de prêmios dos produtores
app.get('/producers/win-intervals', async (req, res) => {
  try {
    // 1. Buscar todos os filmes vencedores, ordenados por ano (getMovies já faz isso por padrão)
    const winningMovies = await getMovies({ winner: true });

    if (!winningMovies || winningMovies.length === 0) {
      return res.status(200).json({ min: [], max: [] }); // Nenhum filme vencedor encontrado
    }

    // 2. Mapear vitórias por produtor: Map<producerName, year[]>
    const producerWins = new Map();
    for (const movie of winningMovies) {
      if (!movie.producers || movie.producers.trim() === '') {
        continue; // Pular filmes sem produtores listados
      }

      const producerNames = parseProducers(movie.producers);
      for (const name of producerNames) {
        if (!producerWins.has(name)) {
          producerWins.set(name, []);
        }
        const yearsWon = producerWins.get(name);
        // Adicionar o ano apenas se ainda não estiver na lista (para o caso de múltiplas vitórias no mesmo ano, contamos como uma vitória naquele ano)
        // Como os filmes já vêm ordenados por ano, a lista de anos para cada produtor também estará ordenada.
        if (!yearsWon.includes(movie.year)) {
          yearsWon.push(movie.year);
        }
      }
    }

    // 3. Calcular todos os intervalos entre vitórias consecutivas
    // Estrutura: { producer: string, interval: number, previousWin: number, followingWin: number }
    const allIntervals = [];
    for (const [producer, years] of producerWins.entries()) {
      // Produtor precisa ter ganho pelo menos duas vezes para ter um intervalo
      // Os anos já devem estar ordenados devido à ordem de busca dos filmes
      if (years.length >= 2) {
        for (let i = 0; i < years.length - 1; i++) {
          const previousWin = years[i];
          const followingWin = years[i + 1];
          const interval = followingWin - previousWin;
          allIntervals.push({
            producer: producer,
            interval: interval,
            previousWin: previousWin,
            followingWin: followingWin,
          });
        }
      }
    }

    if (allIntervals.length === 0) {
      // Nenhum produtor ganhou duas ou mais vezes
      return res.status(200).json({ min: [], max: [] });
    }

    // 4. Encontrar os valores de intervalo mínimo e máximo
    let minIntervalValue = Infinity;
    let maxIntervalValue = -Infinity; // ou 0 se intervalos não puderem ser negativos

    for (const item of allIntervals) {
      if (item.interval < minIntervalValue) {
        minIntervalValue = item.interval;
      }
      if (item.interval > maxIntervalValue) {
        maxIntervalValue = item.interval;
      }
    }

    // 5. Coletar os produtores que se encaixam nos intervalos mínimo e máximo
    const result = {
      min: [],
      max: [],
    };

    for (const item of allIntervals) {
      if (item.interval === minIntervalValue) {
        result.min.push(item);
      }
      if (item.interval === maxIntervalValue) {
        result.max.push(item);
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Erro no endpoint /producers/win-intervals:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao calcular intervalos de prêmios.',
    });
  }
});

// Inicializar o banco de dados e carregar os dados do CSV, depois iniciar o servidor
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Acesse os filmes em: http://localhost:${PORT}/movies`);
      console.log(
        `Acesse os intervalos de prêmios dos produtores em: http://localhost:${PORT}/producers/win-intervals`
      );
    });
  })
  .catch((err) => {
    console.error('Falha ao inicializar a aplicação:', err);
    process.exit(1);
  });
