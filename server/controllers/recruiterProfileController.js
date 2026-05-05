const User = require("../models/User");
const bcrypt = require("bcryptjs");
const createLog = require("../utils/createLog");

// GET RECRUITER PROFILE
exports.getRecruiterProfile = async (req, res) => {
  try {
    const recruiter = await User.findById(req.userId).select("-password");

    if (!recruiter || recruiter.role !== "recruiter") {
      return res.status(404).json({
        message: "Recruiter not found."
      });
    }

    res.json(recruiter);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch recruiter profile."
    });
  }
};

// UPDATE RECRUITER NAME + EMAIL
exports.updateRecruiterProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required."
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required."
      });
    }

    const recruiter = await User.findById(req.userId);

    if (!recruiter || recruiter.role !== "recruiter") {
      return res.status(404).json({
        message: "Recruiter not found."
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: recruiter._id }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists."
      });
    }

    recruiter.name = name.trim();
    recruiter.email = normalizedEmail;

    await recruiter.save();

    await createLog(
      req.userId,
      "update",
      `Updated recruiter profile details`
    );

    res.json({
      message: "Profile updated successfully.",
      recruiter: {
        _id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        role: recruiter.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update profile."
    });
  }
};

// CHANGE RECRUITER PASSWORD
exports.changeRecruiterPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required."
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters long."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match."
      });
    }

    const recruiter = await User.findById(req.userId);

    if (!recruiter || recruiter.role !== "recruiter") {
      return res.status(404).json({
        message: "Recruiter not found."
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, recruiter.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    recruiter.password = hashedPassword;

    await recruiter.save();

    await createLog(
      req.userId,
      "update",
      `Changed recruiter account password`
    );

    res.json({
      message: "Password changed successfully."
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to change password."
    });
  }
};