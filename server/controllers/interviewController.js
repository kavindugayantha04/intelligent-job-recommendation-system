const Interview = require('../models/Interview');
const Job = require('../models/Job');
const candidate = require('../models/CandidateProfile');
const Log = require('../models/log');
const User = require('../models/user');

// get All Jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get All Candidates
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await candidate.find().populate("userId").sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE Interview
exports.createInterview = async (req, res) => {
  try {
    const description = `Create new interview for ${req.body.candidateId} on ${req.body.date} at ${req.body.time}`;

    const interview = new Interview(req.body);
    await interview.save();

    // Create log entry
    const logEntry = new Log({
      userId: 1, // Replace with req.user.id if you have auth
      action: "create",
      description,
      date: new Date()
    });
    await logEntry.save();

    res.status(201).json({
      message: "Interview created successfully",
      interview
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VIEW all Interviews
exports.getAllInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate("jobId", "title")
      .populate({
        path: "candidateId",
        populate: {
          path: "userId",
          select: "name email"
        }
      })
      .sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single Interview by ID
exports.getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate("jobId", "title")
      .populate({
        path: "candidateId",
        populate: {
          path: "userId",
          select: "name email"
        }
      });
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE Interview by ID
exports.updateInterview = async (req, res) => {
  try {
    const updated = await Interview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    );

    if (!updated) return res.status(404).json({ message: "Interview not found" });

    // Optional: Log update
    const logEntry = new Log({
      userId: 1,
      action: "update",
      description: `Updated interview ${req.params.id}`,
      date: new Date()
    });
    await logEntry.save();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE Interview by ID
exports.deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndDelete(req.params.id);

    if (!interview) return res.status(404).json({ message: "Interview not found" });

    // Optional: Log deletion
    const logEntry = new Log({
      userId: 1,
      action: "delete",
      description: `Deleted interview ${req.params.id}`,
      date: new Date()
    });
    await logEntry.save();

    res.json({ message: "Interview deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};