const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const logsController = require('../controllers/LogsController');
const RecruiterController = require('../controllers/RecruiterController');


// CREATE Interview
router.post('/interview/create', interviewController.createInterview);

// VIEW all Interviews
router.get('/interview/all', interviewController.getAllInterviews);
router.get('/logs/all', logsController.getAllLogs);

// GET single Interview by ID (to prefill update form)
router.get('/interview/:id', interviewController.getInterviewById);

// UPDATE Interview by ID
router.put('/interview/:id', interviewController.updateInterview);

// DELETE Interview by ID
router.delete('/interview/:id', interviewController.deleteInterview);

router.get("/getalljobs", interviewController.getAllJobs);
router.get("/getall/candidates", interviewController.getAllCandidates);


module.exports = router;


