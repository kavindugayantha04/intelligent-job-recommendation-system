import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRecruiters,
  registerRecruiter,
  deleteRecruiter
} from "../api/recruiterApi";

export default function RecruiterRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await getRecruiters();
      console.log("Recruiters API response:", res.data);

      if (Array.isArray(res.data)) {
        setRecruiters(res.data);
      } else if (Array.isArray(res.data?.recruiters)) {
        setRecruiters(res.data.recruiters);
      } else {
        setRecruiters([]);
        setErrorMessage("Recruiter list response is not in the correct format.");
      }
    } catch (err) {
      console.error("Fetch recruiters error:", err.response?.data || err.message);
      setRecruiters([]);
      setErrorMessage(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Failed to load recruiters."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleDelete = async (id) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!window.confirm("Are you sure you want to delete this recruiter?")) {
      return;
    }

    try {
      const res = await deleteRecruiter(id);

      setSuccessMessage(res.data.msg || "Recruiter deleted successfully");

      setForm({
        name: "",
        email: "",
        password: ""
      });

      fetchRecruiters();
    } catch (err) {
      console.error("Delete recruiter error:", err.response?.data || err.message);
      setErrorMessage(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          err.message ||
          "Delete failed"
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (recruiters.length > 0) {
      setErrorMessage("Only one recruiter account is allowed.");
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (!form.email.trim().toLowerCase().endsWith("@gmail.com")) {
      setErrorMessage("Email must end with @gmail.com");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setErrorMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    try {
      const res = await registerRecruiter({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      setSuccessMessage(res.data.msg || "Recruiter created successfully");

      setForm({
        name: "",
        email: "",
        password: ""
      });

      fetchRecruiters();
    } catch (err) {
      console.error("Recruiter registration error:", err.response?.data || err.message);

      setErrorMessage(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          err.message ||
          "Something went wrong"
      );
    }
  };

  const recruiterAlreadyExists = recruiters.length > 0;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recruiter Registration</h2>

      {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
      {successMessage && <p style={styles.successText}>{successMessage}</p>}

      {loading ? (
        <p style={styles.infoText}>Loading recruiters...</p>
      ) : recruiterAlreadyExists ? (
        <div style={styles.warningBox}>
          <p style={styles.warningText}>
            A recruiter account already exists. Only one recruiter is allowed in
            the system.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>
      )}

      <div style={styles.backWrapper}>
        <button
          type="button"
          style={styles.backbutton}
          onClick={() => navigate("/admin-dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      <h3 style={styles.subtitle}>All Recruiters</h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(recruiters) && recruiters.length > 0 ? (
            recruiters.map((rec, index) => (
              <tr key={rec._id} style={styles.tr}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{rec.name}</td>
                <td style={styles.td}>{rec.email}</td>
                <td style={styles.td}>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDelete(rec._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={styles.empty}>
                No recruiters found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    fontFamily: "Arial"
  },
  title: {
    textAlign: "center",
    marginBottom: "20px"
  },
  subtitle: {
    marginTop: "40px"
  },
  form: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "20px"
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    width: "200px"
  },
  button: {
    padding: "10px 20px",
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  backWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "10px",
    marginBottom: "10px"
  },
  backbutton: {
    padding: "10px 20px",
    background: "#db3434",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  warningBox: {
    background: "#fff3cd",
    border: "1px solid #ffe69c",
    color: "#856404",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
    textAlign: "center"
  },
  warningText: {
    margin: 0,
    fontWeight: "bold"
  },
  infoText: {
    textAlign: "center"
  },
  errorText: {
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: "15px",
    fontWeight: "bold"
  },
  successText: {
    color: "#2ecc71",
    textAlign: "center",
    marginBottom: "15px",
    fontWeight: "bold"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px"
  },
  th: {
    background: "#2c3e50",
    color: "#fff",
    padding: "10px"
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "center"
  },
  tr: {
    background: "#f9f9f9"
  },
  empty: {
    textAlign: "center",
    padding: "20px"
  },
  deleteButton: {
    padding: "6px 12px",
    backgroundColor: "#fff1f0",
    color: "#e74c3c",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600
  }
};