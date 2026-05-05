import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../api/axiosConfig";

function UpdateInterview() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    candidateId: "",
    jobId: "",
    date: "",
    time: "",
    venue: "",
    status: "Upcoming",
    resultStatus: "Pending"
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!id) return;

    const fetchInterview = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`/interview/${id}`);

        setFormData({
          ...res.data,
          date: res.data.date ? res.data.date.slice(0, 10) : "",
          time: res.data.time || "",
          venue: res.data.venue || "",
          status: res.data.status || "Upcoming",
          resultStatus: res.data.resultStatus || "Pending"
        });
      } catch (err) {
        console.log("Fetch interview error:", err);
        alert(err.response?.data?.message || "Failed to load interview");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedFormData = {
      ...formData,
      [name]: value
    };

    // auto adjust resultStatus when status changes
    if (name === "status") {
      if (value === "Upcoming" || value === "Cancelled") {
        updatedFormData.resultStatus = "Pending";
      }
    }

    setFormData(updatedFormData);

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      resultStatus: name === "status" ? "" : prev.resultStatus
    }));
  };

  const validate = () => {
    const tempErrors = {};

    if (!formData.date) {
      tempErrors.date = "Date is required";
    } else {
      const today = new Date();
      const selectedDate = new Date(formData.date);
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

     // if (selectedDate < today) {
     //   tempErrors.date = "Date must be today or future";
     // }
    }

    if (!formData.time || !formData.time.trim()) {
      tempErrors.time = "Time is required";
    } else if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(formData.time.trim())) {
      tempErrors.time = "Time must be HH:MM";
    } else if (formData.date) {
      const now = new Date();
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);

     // if (selectedDateTime <= now) {
     //   tempErrors.time = "Time must be future";
     // }
    }

    if (!formData.venue || !formData.venue.trim()) {
      tempErrors.venue = "Venue is required";
    }

    if (
      formData.status === "Upcoming" &&
      formData.resultStatus !== "Pending"
    ) {
      tempErrors.resultStatus =
        "Upcoming interview must have Pending result";
    }

    if (
      formData.status === "Cancelled" &&
      formData.resultStatus !== "Pending"
    ) {
      tempErrors.resultStatus =
        "Cancelled interview must have Pending result";
    }

    if (
      formData.status === "Completed" &&
      formData.resultStatus === "Pending"
    ) {
      tempErrors.resultStatus =
        "Completed interview must have Pass or Fail result";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.put(`/interview/${id}`, {
        candidateId:
          typeof formData.candidateId === "object"
            ? formData.candidateId._id
            : formData.candidateId,

        jobId:
          typeof formData.jobId === "object"
            ? formData.jobId._id
            : formData.jobId,

        date: formData.date,
        time: formData.time,
        venue: formData.venue.trim(),
        status: formData.status,
        resultStatus: formData.resultStatus
      });

      alert("Interview updated successfully");
      navigate("/dashboard");
    } catch (err) {
      console.log("Update interview error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to update interview");
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={{ textAlign: "center" }}>Loading interview...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Update Interview</h2>

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            name="candidateId"
            value={formData.candidateId?.userId?.name || ""}
            readOnly
          />

          <input
            style={styles.input}
            name="jobId"
            value={formData.jobId?.title || ""}
            readOnly
          />

          <input
            style={styles.input}
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
          />
          {errors.date && <div style={styles.error}>{errors.date}</div>}

          <input
            style={styles.input}
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
          />
          {errors.time && <div style={styles.error}>{errors.time}</div>}

          <input
            style={styles.input}
            type="text"
            name="venue"
            placeholder="Venue"
            onChange={handleChange}
            value={formData.venue}
          />
          {errors.venue && <div style={styles.error}>{errors.venue}</div>}

          <select
            style={styles.input}
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            style={styles.input}
            name="resultStatus"
            value={formData.resultStatus}
            onChange={handleChange}
          >
            <option value="Pending">Pending</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
          {errors.resultStatus && (
            <div style={styles.error}>{errors.resultStatus}</div>
          )}

          <button style={styles.saveBtn} type="submit">
            Update Interview
          </button>

          <button
            type="button"
            style={styles.closeBtn}
            onClick={() => navigate("/dashboard")}
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f7f9",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  },
  card: {
    width: "420px",
    maxWidth: "95%",
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#1f2937"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "6px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "14px"
  },
  error: {
    color: "red",
    fontSize: "12px",
    marginBottom: "10px"
  },
  saveBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px"
  },
  closeBtn: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  }
};

export default UpdateInterview;