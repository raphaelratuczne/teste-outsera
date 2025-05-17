import { getMovies } from '../database.js';
import { parseProducers } from '../utils/producerParser.js';

export const calculateProducerWinIntervals = async () => {
  // 1. Buscar todos os filmes vencedores, ordenados por ano
  const winningMovies = await getMovies({ winner: true });

  if (!winningMovies || winningMovies.length === 0) {
    return { min: [], max: [] }; // Nenhum filme vencedor encontrado
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
      // Adicionar o ano apenas se ainda não estiver na lista
      // Como os filmes já vêm ordenados por ano, a lista de anos para cada produtor também estará ordenada.
      if (!yearsWon.includes(movie.year)) {
        yearsWon.push(movie.year);
      }
    }
  }

  // 3. Calcular todos os intervalos entre vitórias consecutivas
  const allIntervals = [];
  for (const [producer, years] of producerWins.entries()) {
    // Produtor precisa ter ganho pelo menos duas vezes para ter um intervalo
    // Os anos já devem estar ordenados.
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
    return { min: [], max: [] }; // Nenhum produtor ganhou duas ou mais vezes
  }

  // 4. Encontrar os valores de intervalo mínimo e máximo
  let minIntervalValue = Infinity;
  let maxIntervalValue = -Infinity;

  for (const item of allIntervals) {
    minIntervalValue = Math.min(minIntervalValue, item.interval);
    maxIntervalValue = Math.max(maxIntervalValue, item.interval);
  }

  // 5. Coletar os produtores que se encaixam nos intervalos mínimo e máximo
  const result = {
    min: allIntervals.filter((item) => item.interval === minIntervalValue),
    max: allIntervals.filter((item) => item.interval === maxIntervalValue),
  };

  return result;
};
