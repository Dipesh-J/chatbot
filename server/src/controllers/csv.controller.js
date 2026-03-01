import { processCSV } from '../services/csv.service.js';
import FinancialData from '../models/FinancialData.js';

export async function uploadCSV(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await processCSV(req.file.path, req.file.originalname, req.user._id);
    res.status(201).json({
      id: result._id,
      fileName: result.fileName,
      rowCount: result.rowCount,
      columns: result.columns,
      summary: result.summary,
      status: result.status,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDatasets(req, res, next) {
  try {
    const datasets = await FinancialData.find({ userId: req.user._id })
      .select('-rows')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ datasets });
  } catch (error) {
    next(error);
  }
}

export async function getDataset(req, res, next) {
  try {
    const dataset = await FinancialData.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
    res.json({ dataset });
  } catch (error) {
    next(error);
  }
}

export async function deleteDataset(req, res, next) {
  try {
    const dataset = await FinancialData.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
    res.json({ message: 'Dataset deleted' });
  } catch (error) {
    next(error);
  }
}
