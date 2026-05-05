const Recruiter = require("../models/user");
const bcrypt = require("bcryptjs");

//Register Recruiter
exports.registerRecruiter = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check existing
    const existing = await Recruiter.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const recruiter = new Recruiter({
      name,
      email,
      password: hashedPassword,
      role: "recruiter"
    });

    await recruiter.save();

    res.status(201).json({ msg: "Recruiter registered successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//Get All Recruiters (Admin)
exports.getRecruiters = async (req, res) => {
  try {
    const recruiters = await Recruiter.find({ role: "recruiter" });
    res.json(recruiters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



//Delete Recruiter
exports.deleteRecruiter = async (req, res) => {
  try {
    await Recruiter.findByIdAndDelete(req.params.id);
    res.json({ msg: "Recruiter deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};