import { getMovies } from '../database.js';

export const getMoviesController = async (req, res) => {
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
    const movies = await getMovies(filters); // Para uma lógica mais complexa, poderia chamar um movieService.js
    res.status(200).json(movies);
  } catch (error) {
    console.error('Erro no controller getMoviesController:', error);
    res
      .status(500)
      .json({ error: 'Erro interno do servidor ao buscar filmes.' });
  }
};
