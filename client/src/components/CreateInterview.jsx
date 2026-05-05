import React, { useEffect, useState } from "react";
import { createInterviewApi } from "../api/interviewApi";

function CreateInterview({
  isOpen,
  onClose,
  onSuccess,
  initialCandidateId = "",
  initialJobId = "",
  candidateName = "",
  jobTitle = "",
}) {
  const [formData, setFormData] = useState({
    candidateId: "",
    jobId: "",
    date: "",
    time: "",
    venue: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        candidateId: initialCandidateId,
        jobId: initialJobId,
        date: "",
        time: "",
        venue: "",
      });
      setErrors({});
    }
  }, [isOpen, initialCandidateId, initialJobId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }));
  };

  const validate = () => {
    const tempErrors = {};

    if (!formData.candidateId) {
      tempErrors.candidateId = "Candidate is required";
    }

    if (!formData.jobId) {
      tempErrors.jobId = "Job is required";
    }

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

    if (!formData.time || !formData.time.trim()) {
      tempErrors.time = "Time is required";
    } else {
      const now = new Date();
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);

      if (selectedDateTime <= now) {
        tempErrors.time = "Time must be future";
      }
    }

    if (!formData.venue.trim()) {
      tempErrors.venue = "Venue is required";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createInterviewApi(formData);
      alert("Interview created successfully");

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create interview");
    }
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  };

  const modalStyle = {
    width: "450px",
    maxWidth: "95%",
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  };

  const input = {
    width: "100%",
    padding: "10px",
    marginBottom: "6px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  };

  const errorStyle = {
    color: "red",
    fontSize: "12px",
    marginBottom: "10px",
  };

  const button = {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
  };

  const closeBtn = {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={modalStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Schedule Interview
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            style={input}
            type="text"
            value={candidateName}
            readOnly
            placeholder="Candidate"
          />
          {errors.candidateId && <div style={errorStyle}>{errors.candidateId}</div>}

          <input
            style={input}
            type="text"
            value={jobTitle}
            readOnly
            placeholder="Job"
          />
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

          <button type="button" style={closeBtn} onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateInterview;