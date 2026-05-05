import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

// Navbar Component
const Navbar = () => (
  <nav style={styles.navbar}>
    {/* <h2 style={styles.logo}>Admin Dashboard</h2> */}
    <div style={styles.navLinks}>
      <Link to="/admin/dashboard" style={styles.navLink}>Dashboard</Link>
      <Link to="/logs" style={styles.navLink}>Logs</Link>
    </div>
  </nav>
);

function Dashboard() {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/logs/all`);
      setLogs(res.data);
    } catch (error) {
      console.log("Error fetching data:", error);
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
                    <td style={styles.td}><StatusBadge action={item.action} /></td>
                    <td style={styles.td}>{new Date(item.createdAt).toLocaleString()}</td>
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
  if (action === "update") { color = "#3498db"; bg = "#ebf5ff"; }
  else if (action === "delete") { color = "#e74c3c"; bg = "#fff1f0"; }

  return (
    <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", backgroundColor: bg, color }}>
      {action}
    </span>
  );
};

// Essential styles only
const styles = {
  container: { fontFamily: "'Segoe UI', sans-serif", padding: "20px", backgroundColor: "#f4f7f9", minHeight: "100vh" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", backgroundColor: "#fff", borderRadius: "8px", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  logo: { fontWeight: "700", color: "#3498db" },
  navLinks: { display: "flex", gap: "15px" },
  navLink: { textDecoration: "none", color: "#2c3e50", fontWeight: "600" },
  logoutButton: { padding: "6px 12px", border: "none", borderRadius: "6px", backgroundColor: "#e74c3c", color: "#fff", cursor: "pointer" },
  content: { backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  sectionTitle: { marginBottom: "15px", fontSize: "18px", fontWeight: "600" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px", borderBottom: "1px solid #ddd", fontWeight: "600" },
  td: { padding: "10px", borderBottom: "1px solid #eee" }
};

export default Dashboard;