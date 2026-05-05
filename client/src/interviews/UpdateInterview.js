import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function UpdateInterview() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    candidateId: "",
    jobId: "",
    date: "",
    time: "",
    venue: "",
    status: "",
    resultStatus: "",
  });

  const [errors, setErrors] = useState({});
  //Back button function
  const handleBack = () => {
    navigate(-1); // go to previous page
    // or use navigate("/") if you want dashboard
  };

  // Fetch interview
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/interview/${id}`
        );
        setFormData(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchInterview();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // date future Validation
  const validate = () => {
    const tempErrors = {};

    if (!formData.date) tempErrors.date = "Date is required";
    else {
      const today = new Date();
      const selectedDate = new Date(formData.date);

      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        tempErrors.date = "Date must be today or future";
      }
    }

    if (!formData.time.trim()) tempErrors.time = "Time is required";
    else if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(formData.time.trim()))
      tempErrors.time = "Time must be HH:MM";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/interview/${id}`,
        formData
      );
      alert("Interview updated successfully");
      navigate("/interviews");
    } catch (err) {
      console.log(err);
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
    backgroundColor: "#28a745",
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
      <h2 style={{ textAlign: "center" }}>Update Interview</h2>

      <form onSubmit={handleSubmit}>
        {/* Candidate ID */}
        <input
          style={input}
          name="candidateId"
          value={formData.candidateId?.userId?.name}
          readOnly
        />

        {/* Job Title */}
        <input
          style={input}
          name="jobId"
          value={formData.jobId?.title}
          readOnly
        />

        {/* Date */}
        <input
          style={input}
          type="date"
          name="date"
          value={formData.date?.slice(0, 10)}
          onChange={handleChange}
        />
        {errors.date && <div style={errorStyle}>{errors.date}</div>}

        {/* Time */}
        <input
          style={input}
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
        />
        {errors.time && <div style={errorStyle}>{errors.time}</div>}

        {/* venue  */}
        <input
          style={input}
          type="text"
          name="venue"
          placeholder="Venue"
          onChange={handleChange}
          value={formData.venue}
        />
        {errors.venue && <div style={errorStyle}>{errors.venue}</div>}

        {/* Status */}
        <select
          style={input}
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select style={input} name="resultStatus" value={formData.resultStatus} onChange={handleChange}>
          <option value="Pending">Pending</option>
          <option value="Pass">Pass</option>
          <option value="Fail">Fail</option>
        </select>


        <button style={button} type="submit">
          Update Interview
        </button>

        {/* 🔹 Back Button */}
        <button type="button" onClick={handleBack} style={backBtn}>
          Back to Dashboard
        </button>

      </form>
    </div>
  );
}

export default UpdateInterview;