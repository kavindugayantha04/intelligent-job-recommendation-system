const ChatLog = require('../models/ChatLog');
const FAQ = require('../models/FAQ');

exports.getAllLogs = async (req, res) => {
  try {
    const { limit = 50, page = 1, resolved } = req.query;
    let query = {};
    if (resolved !== undefined) query.resolved = resolved === 'true';
    const logs = await ChatLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await ChatLog.countDocuments(query);
    res.json({ success: true, data: logs, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getLogBySession = async (req, res) => {
  try {
    const log = await ChatLog.findOne({ sessionId: req.params.sessionId });
    if (!log) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalSessions = await ChatLog.countDocuments();
    const resolvedSessions = await ChatLog.countDocuments({ resolved: true });
    const totalMessages = await ChatLog.aggregate([
      { $group: { _id: null, total: { $sum: '$totalMessages' } } }
    ]);
    const avgRating = await ChatLog.aggregate([
      { $match: { rating: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);
    const topFAQs = await FAQ.find({ hitCount: { $gt: 0 } })
      .sort({ hitCount: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalSessions,
        resolvedSessions,
        unresolvedSessions: totalSessions - resolvedSessions,
        totalMessages: totalMessages[0]?.total || 0,
        averageRating: avgRating[0]?.avg?.toFixed(1) || 'N/A',
        topFAQs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteLog = async (req, res) => {
  try {
    const log = await ChatLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ success: false, error: 'Log not found' });
    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
