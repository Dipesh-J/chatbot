import { getSessionCharts, shareDashboardToSlack } from '../services/dashboard.service.js';

export async function getCharts(req, res, next) {
  try {
    const charts = await getSessionCharts(req.params.id);
    res.json({ charts });
  } catch (error) {
    next(error);
  }
}

export async function shareSlack(req, res, next) {
  try {
    const { image, channel } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    const result = await shareDashboardToSlack(
      req.params.id,
      image,
      channel,
      req.user._id.toString()
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}
