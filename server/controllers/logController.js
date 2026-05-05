const Log = require("../models/log");

// GET ALL LOGS
exports.getAllLogs = async (req, res) => {
  try {
    const allLogs = await Log.find().sort({ createdAt: -1 });
    res.json(allLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};