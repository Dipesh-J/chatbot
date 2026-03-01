import { getSessionCharts } from '../services/dashboard.service.js';

export async function getCharts(req, res, next) {
  try {
    const charts = await getSessionCharts(req.params.id);
    res.json({ charts });
  } catch (error) {
    next(error);
  }
}
