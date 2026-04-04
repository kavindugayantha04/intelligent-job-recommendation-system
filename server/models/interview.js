const mongoose = require('mongoose');

// databade details(format)

const interviewSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CandidateProfile",
    required: true
  }, 
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },    
  date: { type: Date, required: true },          
  time: { type: String, required: true },                        
  status: { type: String, default: "Upcoming" },                 
  venue: { type: String, default: "Online" },
  resultStatus: {
    type: String, default: "Pending"
  }
},
  { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);