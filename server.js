import express from 'express';
import { getMoviesController } from './controllers/movieController.js';
import { getProducerWinIntervalsController } from './controllers/producerController.js';
import { initDb } from './database.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Rotas
app.get('/movies', getMoviesController);
app.get('/producers/win-intervals', getProducerWinIntervalsController);

// Inicializar o banco de dados e carregar os dados do CSV, depois iniciar o servidor
// Guardamos a promessa da inicialização para que os testes possam esperar por ela.
// Também guardamos a instância do servidor para poder fechá-la.
let serverInstance;
const startPromise = initDb()
  .then(() => {
    serverInstance = app.listen(PORT, () => {
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

const closeServer = () => {
  return new Promise((resolve, reject) => {
    if (serverInstance) {
      serverInstance.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    } else {
      resolve(); // Servidor não iniciado ou já fechado
    }
  });
};
export { app, closeServer, startPromise };
