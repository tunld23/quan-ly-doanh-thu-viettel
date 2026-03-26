import { adjustmentService } from "../services/adjustmentService.js";

export const getAdjustments = async (req, res) => {
  try {
    const data = await adjustmentService.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAdjustment = async (req, res) => {
  try {
    const result = await adjustmentService.create(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAvailableStaff = async (req, res) => {
  try {
    const data = await adjustmentService.getAvailableStaff(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAdjustment = async (req, res) => {
  try {
    const result = await adjustmentService.delete(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
