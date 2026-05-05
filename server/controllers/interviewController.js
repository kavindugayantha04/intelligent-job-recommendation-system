const Interview = require("../models/Interview");
const Job = require("../models/Job");
const CandidateProfile = require("../models/CandidateProfile");
const createLog = require("../utils/createLog");

// GET ALL JOBS
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL CANDIDATES
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await CandidateProfile.find()
      .populate("userId")
      .sort({ createdAt: -1 });

    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE INTERVIEW
exports.createInterview = async (req, res) => {
  try {
    const { candidateId, jobId, date, time, venue } = req.body;

    if (!candidateId || !jobId || !date || !time || !venue?.trim()) {
      return res.status(400).json({
        message: "All required fields must be provided."
      });
    }

    const candidate = await CandidateProfile.findById(candidateId).populate(
      "userId",
      "name email"
    );

    if (!candidate) {
      return res.status(404).json({
        message: "Candidate profile not found."
      });
    }

    const job = await Job.findById(jobId).select("title");

    if (!job) {
      return res.status(404).json({
        message: "Job not found."
      });
    }

    const blockingInterview = await Interview.findOne({
      candidateId,
      jobId,
      status: { $in: ["Upcoming", "Completed"] }
    });

    if (blockingInterview) {
      if (blockingInterview.status === "Upcoming") {
        return res.status(400).json({
          message: "An interview is already scheduled for this candidate for this job."
        });
      }

      if (blockingInterview.status === "Completed") {
        return res.status(400).json({
          message: "This candidate has already completed an interview for this job."
        });
      }
    }

    const interview = new Interview({
      candidateId,
      jobId,
      date,
      time,
      venue: venue.trim()
    });

    await interview.save();

    const candidateName = candidate?.userId?.name || "Unknown Candidate";
    const jobTitle = job?.title || "Unknown Job";

    await createLog(
      req.userId,
      "create",
      `Created interview for ${candidateName} for job "${jobTitle}" on ${date} at ${time}`
    );

    res.status(201).json({
      message: "Interview created successfully",
      interview
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL INTERVIEWS
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

// GET MY SCHEDULED INTERVIEWS COUNT
exports.getMyScheduledInterviewCount = async (req, res) => {
  try {
    const candidateProfile = await CandidateProfile.findOne({
      userId: req.userId
    });

    if (!candidateProfile) {
      return res.json({
        scheduledCount: 0
      });
    }

    const scheduledCount = await Interview.countDocuments({
      candidateId: candidateProfile._id,
      status: "Upcoming"
    });

    res.json({
      scheduledCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE INTERVIEW
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

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE INTERVIEW
exports.updateInterview = async (req, res) => {
  try {
    const updated = await Interview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("jobId", "title")
      .populate({
        path: "candidateId",
        populate: {
          path: "userId",
          select: "name email"
        }
      });

    if (!updated) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const candidateName =
      updated?.candidateId?.userId?.name || "Unknown Candidate";
    const jobTitle = updated?.jobId?.title || "Unknown Job";

    await createLog(
      req.userId,
      "update",
      `Updated interview for ${candidateName} for job "${jobTitle}" with status "${updated.status}" and result "${updated.resultStatus}"`
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE INTERVIEW
exports.deleteInterview = async (req, res) => {
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

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const candidateName =
      interview?.candidateId?.userId?.name || "Unknown Candidate";
    const jobTitle = interview?.jobId?.title || "Unknown Job";

    await Interview.findByIdAndDelete(req.params.id);

    await createLog(
      req.userId,
      "delete",
      `Deleted interview for ${candidateName} for job "${jobTitle}"`
    );

    res.json({ message: "Interview deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};