import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function RecruiterRegister() {

   const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
   
  const [recruiters, setRecruiters] = useState([]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this User?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/recruiter/delete/${id}`);
        fetchRecruiters();

      } catch (err) {
        console.log(err);
      }
    }
  };

  // Load recruiters
  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/recruiters`
      );
      setRecruiters(res.data);
    } catch (err) {
      console.error(err);
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
  };

 

  const handleSubmit = async (e) => {
    e.preventDefault();
   
    if (!form.email.endsWith("@gmail.com")) {     //email validation
      alert("Email must end with @gmail.com");
      return;
    } 

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;    //password validation
    if (!passwordRegex.test(form.password)) {
      alert("Password must be at least 8 characters and include uppercase, lowercase, and a number");
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/recruiter/registration`,
        form
      );

      alert(res.data.msg);

      setForm({
        name: "",
        email: "",
        password: ""
      });
     
      fetchRecruiters(); //refresh list

    } catch (err) {
      alert(err.response?.data?.msg || "Error");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recruiter Registration</h2>

      {/* FORM */}
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
          pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$"
          title="Email must be a valid Gmail address"
          style={styles.input}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
          title="Password must be at least 8 characters, include uppercase, lowercase and a number"
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Register
        </button>

         <button
          type="button"
          style={styles.backbutton}
          onClick={() => navigate("/admin/dashboard")}
        >
          Back to Dashboard
        </button>
      </form>

      {/* TABLE */}
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
          {recruiters.length > 0 ? (
            recruiters.map((rec, index) => (
              <tr key={rec._id} style={styles.tr}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{rec.name}</td>
                <td style={styles.td}>{rec.email}</td>
                <td  style={styles.td}>
                  <button
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#fff1f0",
                                  color: "#e74c3c",
                                  border: "none",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontWeight: 600
                                }}
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

// 🎨 Styles
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
  backbutton: {
    padding: "10px 20px",
    background: "#db3434",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
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
  }
};