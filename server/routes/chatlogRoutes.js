const express = require('express');
const router = express.Router();
const { getAllLogs, getLogBySession, getStats, deleteLog } = require('../controllers/chatlogController');

router.get('/', getAllLogs);
router.get('/stats', getStats);
router.get('/:sessionId', getLogBySession);
router.delete('/:id', deleteLog);

module.exports = router;
