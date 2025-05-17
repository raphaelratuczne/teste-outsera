import { calculateProducerWinIntervals } from '../services/producerService.js';

export const getProducerWinIntervalsController = async (req, res) => {
  try {
    const intervals = await calculateProducerWinIntervals();
    res.status(200).json(intervals);
  } catch (error) {
    console.error(
      'Erro no controller getProducerWinIntervalsController:',
      error
    );
    res.status(500).json({
      error: 'Erro interno do servidor ao calcular intervalos de prêmios.',
    });
  }
};
