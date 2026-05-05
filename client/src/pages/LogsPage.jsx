import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api/axiosConfig";

// Navbar Component
const Navbar = () => (
  <nav style={styles.navbar}>
    <div style={styles.navLinks}>
      <Link to="/admin-dashboard" style={styles.navLink}>
        Dashboard
      </Link>
      <Link to="/logs" style={styles.navLink}>
        Logs
      </Link>
    </div>
  </nav>
);

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchLogs = async () => {
    try {
      setErrorMessage("");
      const res = await axios.get("/logs/all");

      if (Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        setLogs([]);
        setErrorMessage("Invalid logs response format.");
      }
    } catch (error) {
      console.log("Error fetching data:", error);
      setLogs([]);
      setErrorMessage(
        error.response?.data?.message || "Failed to load logs."
      );
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.content}>
        <h2 style={styles.sectionTitle}>Logs</h2>

        {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}

        {logs.length === 0 ? (
          <p style={{ textAlign: "center", padding: "20px" }}>No logs found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User ID</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item._id}>
                    <td style={styles.td}>{item.userId}</td>
                    <td style={styles.td}>
                      <StatusBadge action={item.action} />
                    </td>
                    <td style={styles.td}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td style={styles.td}>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Badge Component
const StatusBadge = ({ action }) => {
  let color = "#27ae60";
  let bg = "#c1ffd3";

  if (action === "update") {
    color = "#3498db";
    bg = "#ebf5ff";
  } else if (action === "delete") {
    color = "#e74c3c";
    bg = "#fff1f0";
  } else if (action === "login") {
    color = "#8e44ad";
    bg = "#f3e8ff";
  }

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        backgroundColor: bg,
        color
      }}
    >
      {action}
    </span>
  );
};

const styles = {
  container: {
    fontFamily: "'Segoe UI', sans-serif",
    padding: "20px",
    backgroundColor: "#f4f7f9",
    minHeight: "100vh"
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  navLinks: {
    display: "flex",
    gap: "15px"
  },
  navLink: {
    textDecoration: "none",
    color: "#2c3e50",
    fontWeight: "600"
  },
  content: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
  },
  sectionTitle: {
    marginBottom: "15px",
    fontSize: "18px",
    fontWeight: "600"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "10px",
    borderBottom: "1px solid #ddd",
    fontWeight: "600"
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #eee"
  },
  errorText: {
    color: "#e74c3c",
    marginBottom: "15px",
    fontWeight: "600"
  }
};

export default LogsPage;