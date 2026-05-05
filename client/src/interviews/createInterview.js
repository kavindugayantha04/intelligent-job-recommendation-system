import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


function CreateInterview() {

  const [jobs, setJobs] = useState([]);
  const [candidates, setcandidates] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/getalljobs`
        );
        setJobs(res.data);
      } catch (err) {
        console.log(err);
      }
    };

        const fetchCandidates = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/getall/candidates`
        );
        setcandidates(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchJobs();
    fetchCandidates();
  }, []);


  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    candidateId: "",
    jobId: "",
    date: "",
    time: "",
    venue: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validate = () => {
    const tempErrors = {};

    // // Candidate ID
    if (!formData.candidateId) {
      tempErrors.candidateId = "Candidate ID is required";
    }
   
    // Date future validation
    if (!formData.date) {
      tempErrors.date = "Date is required";
    } else {
      const today = new Date();
      const selectedDate = new Date(formData.date);

      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        tempErrors.date = "Date must be today or future";
      }
    }

    // Time validation (future time if today)
    if (!formData.time) {
      tempErrors.time = "Time is required";
    } else {
      const now = new Date();
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);

      if (selectedDateTime <= now) {
        tempErrors.time = "Time must be future";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/interview/create`,
        formData
      );
      navigate("/interviews");
    } catch (error) {
      console.log(error);
    }
  };

  // Styles
  const container = {
    width: "420px",
    margin: "60px auto",
    padding: "25px",
    background: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  };

  const input = {
    width: "100%",
    padding: "10px",
    marginBottom: "6px",
    border: "1px solid #ccc",
    borderRadius: "6px"
  };

  const errorStyle = {
    color: "red",
    fontSize: "12px",
    marginBottom: "10px"
  };

  const button = {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer"
  };

  const backBtn = {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  };

  return (
    <div style={container}>
      <h2 style={{ textAlign: "center" }}>Create Interview</h2>

      <form onSubmit={handleSubmit}>

        <select
          style={input}
          name="candidateId"
          onChange={handleChange}
          value={formData.candidateId}
        >
          <option value="">Select Candidate</option>

          {candidates.map((candidate) => (
            <option key={candidate._id} value={candidate._id}>
              {candidate.userId?.name}
            </option>
          ))}
        </select>

        


        <select
          style={input}
          name="jobId"
          onChange={handleChange}
          value={formData.jobId}
        >
          <option value="">Select Job</option>

          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.title}
            </option>
          ))}
        </select>

        {errors.jobId && <div style={errorStyle}>{errors.jobId}</div>}

        <input
          style={input}
          type="date"
          name="date"
          onChange={handleChange}
          value={formData.date}
        />
        {errors.date && <div style={errorStyle}>{errors.date}</div>}

        <input
          style={input}
          type="time"
          name="time"
          onChange={handleChange}
          value={formData.time}
        />
        {errors.time && <div style={errorStyle}>{errors.time}</div>}

        <input
          style={input}
          type="text"
          name="venue"
          placeholder="Venue"
          onChange={handleChange}
          value={formData.venue}
        />
        {errors.venue && <div style={errorStyle}>{errors.venue}</div>}

        <button style={button} type="submit">
          Create Interview
        </button>

        {/* Back Button */}
        <button
          type="button"
          style={backBtn}
          onClick={() => navigate("/interviews")}
        >
          Back to Dashboard
        </button>

      </form>
    </div>
  );
}

export default CreateInterview;