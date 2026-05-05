const Log = require('../models/log'); // Capitalized to match constructor

// VIEW all Interviews
exports.getAllLogs = async (req, res) => {
  try {
    const AllLog = await Log.find().sort({ createdAt: -1 });
    res.json(AllLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
