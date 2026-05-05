import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import "../styles/sidebar.css"; // adjust path if different

// Chart.js imports - Switched to Doughnut for better status visualization
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

function Dashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);

  const fetchInterviews = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/interview/all`);
      setInterviews(res.data);
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const upcomingInterviews = interviews.filter((i) => i.status?.toLowerCase() === "upcoming").length;
  const completedInterviews = interviews.filter((i) => i.status?.toLowerCase() === "completed").length;
  const cancelledInterviews = interviews.filter((i) => i.status?.toLowerCase() === "cancelled").length;

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this interview?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/interview/${id}`);
        setInterviews(interviews.filter((i) => i._id !== id));
      } catch (err) {
        console.log(err);
      }
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hoursStr, minutes] = time.split(":");
    let hours = parseInt(hoursStr);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const chartData = {
    labels: ["Upcoming", "Completed", "Cancelled"],
    datasets: [
      {
        data: [upcomingInterviews, completedInterviews, cancelledInterviews],
        backgroundColor: ["#f39c12", "#27ae60", "#e74c3c"],
        hoverOffset: 10,
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { usePointStyle: true, padding: 20 } },
    },
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content">
        <header className="header">
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Interview Dashboard</h1>
            <p style={{ marginTop: 5, color: "#7f8c8d" }}>Manage your recruitment pipeline efficiently</p>
          </div>
          <Link to="/create/interview" style={{ textDecoration: "none" }}>
            <button style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#3498db",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.3s"
            }}>
              + Create New Interview
            </button>
          </Link>
        </header>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 350px",
          gap: "30px",
          alignItems: "start"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px"
            }}>
              <StatCard title="Upcoming" count={upcomingInterviews} color="#f39c12" icon={<FaClock color="#f39c12" size={24} />} />
              <StatCard title="Completed" count={completedInterviews} color="#27ae60" icon={<FaCheckCircle color="#27ae60" size={24} />} />
              <StatCard title="Cancelled" count={cancelledInterviews} color="#ff5d1d" icon={<FaTimesCircle color="#ff5d1d" size={24} />} />
            </div>

            <div style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "25px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
            }}>
              <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "20px" }}>Interview Schedule</h2>
              {interviews.length === 0 ? (
                <p style={{ textAlign: "center", padding: "20px" }}>No interviews found.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "12px", textAlign: "left", color: "#7f8c8d", borderBottom: "1px solid #eee", fontWeight: 600 }}>Candidate</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#7f8c8d", borderBottom: "1px solid #eee", fontWeight: 600 }}>Job Role</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#7f8c8d", borderBottom: "1px solid #eee", fontWeight: 600 }}>Date & Time</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#7f8c8d", borderBottom: "1px solid #eee", fontWeight: 600 }}>Venue</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#7f8c8d", borderBottom: "1px solid #eee", fontWeight: 600 }}>Result</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#7f8c8d", borderBottom: "1px solid #eee", fontWeight: 600 }}>Status</th>
                        <th style={{ padding: "12px", textAlign: "left", color: "#7f8c8d", borderBottom: "1px solid #eee", fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((item) => (
                        <tr key={item._id} style={{ transition: "transform 0.2s", cursor: "default" }}>

                          <td style={{ padding: "15px 12px", backgroundColor: "#fff" }}>
                            <span style={{ fontSize: 12, color: "#95a5a6", backgroundColor: "#f8f9fa", padding: "4px 8px", borderRadius: 4 }}>
                              {item.candidateId?.userId?.name}
                            </span>
                          </td>

                          <td style={{ padding: "15px 12px", backgroundColor: "#fff" }}>
                            <strong>{item.jobId?.title}</strong>
                          </td>

                          <td style={{ padding: "15px 12px", backgroundColor: "#fff" }}>
                            <small style={{ color: "#7f8c8d" }}>
                              {new Date(item.date).toLocaleDateString()} <br />
                              {formatTime(item.time)}
                            </small>
                          </td>


                          <td style={{ padding: "15px 12px", backgroundColor: "#fff" }}>
                           {item.venue}
                          </td>

                          <td style={{ padding: "15px 12px", backgroundColor: "#fff" }}>
                           {item.resultStatus}
                          </td>

                          <td style={{ padding: "15px 12px", backgroundColor: "#fff" }}>
                            <StatusBadge status={item.status} />
                          </td>



                          <td style={{ padding: "15px 12px", backgroundColor: "#fff" }}>
                            <div style={{ display: "flex", gap: 8 }}>

                              <button
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#ebf5ff",
                                  color: "#3498db",
                                  border: "none",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontWeight: 600
                                }}
                                onClick={() => navigate(`/update/interview/${item._id}`)}
                              >
                                Edit
                              </button>

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
                                onClick={() => handleDelete(item._id)}
                              >
                                Delete
                              </button>

                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div style={{ position: "sticky", top: 40 }}>
            <div style={{
              backgroundColor: "#fff",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ textAlign: "center", marginBottom: 20 }}>Status Overview</h3>
              <div style={{ height: 250 }}>
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Stats
const StatCard = ({ title, count, color, icon }) => (
  <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <p style={{ margin: 0, color: "#7f8c8d", fontSize: 14, fontWeight: 600 }}>{title}</p>
        <p style={{ marginTop: 5, fontSize: 24, fontWeight: "bold", color }}>{count}</p>
      </div>
      <span style={{ fontSize: "2rem" }}>{icon}</span>
    </div>
  </div>
);

// Helper Component for Badges
const StatusBadge = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case "Upcoming": return { backgroundColor: "#fff7e6", color: "#f39c12" };
      case "Cancelled": return { backgroundColor: "#fff1f0", color: "#e74c3c" };
      default: return { backgroundColor: "#f6ffed", color: "#27ae60" };
    }
  };
  return (
    <span style={{ padding: "6px 12px", borderRadius: "20px", fontSize: 12, fontWeight: 600, ...getStyle() }}>{status}</span>
  );
};

export default Dashboard;