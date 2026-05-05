const Job = require("../models/Job");
const createLog = require("../utils/createLog");

/* =========================
   HELPER FUNCTION
========================= */
const isExpired = (deadline) => {
  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jobDeadline = new Date(deadline);
  jobDeadline.setHours(0, 0, 0, 0);

  return jobDeadline < today;
};

/* =========================
   CREATE JOB
========================= */
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      category,
      mandatorySkills,
      preferredSkills,
      experienceLevel,
      workType,
      salaryMin,
      salaryMax,
      deadline,
      description
    } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        message: "Job title must be at least 3 characters long."
      });
    }

    if (!category) {
      return res.status(400).json({
        message: "Category is required."
      });
    }

    if (!experienceLevel) {
      return res.status(400).json({
        message: "Experience level is required."
      });
    }

    if (!workType) {
      return res.status(400).json({
        message: "Work type is required."
      });
    }

    if (!deadline) {
      return res.status(400).json({
        message: "Deadline is required."
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDeadline = new Date(deadline);
    selectedDeadline.setHours(0, 0, 0, 0);

    if (selectedDeadline < today) {
      return res.status(400).json({
        message: "Deadline cannot be in the past."
      });
    }

    if (
      salaryMin === undefined ||
      salaryMax === undefined ||
      Number(salaryMin) < 0 ||
      Number(salaryMax) < 0
    ) {
      return res.status(400).json({
        message: "Salary values must be valid positive numbers."
      });
    }

    if (Number(salaryMin) > Number(salaryMax)) {
      return res.status(400).json({
        message: "Minimum salary cannot be greater than maximum salary."
      });
    }

    if (!mandatorySkills || mandatorySkills.length === 0) {
      return res.status(400).json({
        message: "At least one mandatory skill is required."
      });
    }

    if (!description || description.trim().length < 20) {
      return res.status(400).json({
        message: "Job description must be at least 20 characters long."
      });
    }

    const job = new Job({
      title: title.trim(),
      category,
      mandatorySkills,
      preferredSkills,
      experienceLevel,
      workType,
      salaryMin,
      salaryMax,
      deadline,
      description: description.trim()
    });

    await job.save();

    await createLog(req.userId, "create", `Created job "${job.title}"`);

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to create job."
    });
  }
};

/* =========================
   GET ALL JOBS
========================= */
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch jobs."
    });
  }
};

/* =========================
   CLOSE JOB
========================= */
exports.closeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found."
      });
    }

    if (job.status === "Closed") {
      return res.status(400).json({
        message: "This job is already closed."
      });
    }

    job.status = "Closed";
    await job.save();

    await createLog(req.userId, "update", `Closed job "${job.title}"`);

    res.json(job);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to close job."
    });
  }
};

/* =========================
   UPDATE JOB
========================= */
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found."
      });
    }

    if (job.status === "Closed" || isExpired(job.deadline)) {
      return res.status(400).json({
        message: "Closed or expired jobs cannot be edited."
      });
    }

    const {
      title,
      category,
      mandatorySkills,
      preferredSkills,
      experienceLevel,
      workType,
      salaryMin,
      salaryMax,
      deadline,
      description
    } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        message: "Job title must be at least 3 characters long."
      });
    }

    if (!category) {
      return res.status(400).json({
        message: "Category is required."
      });
    }

    if (!experienceLevel) {
      return res.status(400).json({
        message: "Experience level is required."
      });
    }

    if (!workType) {
      return res.status(400).json({
        message: "Work type is required."
      });
    }

    if (!deadline) {
      return res.status(400).json({
        message: "Deadline is required."
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDeadline = new Date(deadline);
    selectedDeadline.setHours(0, 0, 0, 0);

    if (selectedDeadline < today) {
      return res.status(400).json({
        message: "Deadline cannot be in the past."
      });
    }

    if (
      salaryMin === undefined ||
      salaryMax === undefined ||
      Number(salaryMin) < 0 ||
      Number(salaryMax) < 0
    ) {
      return res.status(400).json({
        message: "Salary values must be valid positive numbers."
      });
    }

    if (Number(salaryMin) > Number(salaryMax)) {
      return res.status(400).json({
        message: "Minimum salary cannot be greater than maximum salary."
      });
    }

    if (!mandatorySkills || mandatorySkills.length === 0) {
      return res.status(400).json({
        message: "At least one mandatory skill is required."
      });
    }

    if (!description || description.trim().length < 20) {
      return res.status(400).json({
        message: "Job description must be at least 20 characters long."
      });
    }

    job.title = title.trim();
    job.category = category;
    job.mandatorySkills = mandatorySkills;
    job.preferredSkills = preferredSkills;
    job.experienceLevel = experienceLevel;
    job.workType = workType;
    job.salaryMin = salaryMin;
    job.salaryMax = salaryMax;
    job.deadline = deadline;
    job.description = description.trim();

    await job.save();

    await createLog(req.userId, "update", `Updated job "${job.title}"`);

    res.json(job);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update job."
    });
  }
};

/* =========================
   DELETE JOB
========================= */
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found."
      });
    }

    const jobTitle = job.title;

    await Job.findByIdAndDelete(req.params.id);

    await createLog(req.userId, "delete", `Deleted job "${jobTitle}"`);

    res.json({
      message: "Deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete job."
    });
  }
};