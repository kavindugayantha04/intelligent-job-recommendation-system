import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
} from "chart.js";

import Sidebar from "../components/AdminSidebar";
import "../styles/sidebar.css";
import {
  getAdminInterviews,
  getAdminCandidates,
  getAdminJobs
} from "../api/adminApi";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

const KpiCard = ({ title, value, color }) => (
  <div style={{ ...styles.kpiCard, borderTop: `4px solid ${color}` }}>
    <p style={styles.kpiTitle}>{title}</p>
    <h2 style={{ ...styles.kpiValue, color }}>{value}</h2>
  </div>
);

function AdminDashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setErrorMessage("");

        const interviewsRes = await getAdminInterviews();
        const candidatesRes = await getAdminCandidates();
        const jobsRes = await getAdminJobs();

        setInterviews(Array.isArray(interviewsRes.data) ? interviewsRes.data : []);
        setCandidates(Array.isArray(candidatesRes.data) ? candidatesRes.data : []);
        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
      } catch (err) {
        console.log(err);
        setErrorMessage("Failed to load dashboard data.");
      }
    };

    fetchData();
  }, []);

  const totalInterviews = interviews.length;

  const completedInterviews = interviews.filter(
    (i) => i.status?.toLowerCase() === "completed"
  ).length;

  const pendingInterviews = interviews.filter(
    (i) => i.status?.toLowerCase() === "upcoming"
  ).length;

  const cancelledInterviews = interviews.filter(
    (i) => i.status?.toLowerCase() === "cancelled"
  ).length;

  const passedInterviews = interviews.filter(
    (i) => i.resultStatus?.toLowerCase() === "pass"
  ).length;

  const totalCandidates = candidates.length;

  const successRate =
    totalInterviews === 0
      ? 0
      : Math.round((passedInterviews / totalInterviews) * 100);

  const interviewData = {
    labels: ["Total", "Completed", "Pending"],
    datasets: [
      {
        label: "Interviews",
        data: [totalInterviews, completedInterviews, pendingInterviews],
        backgroundColor: ["#3498db", "#2ecc71", "#e74c3c"],
        borderRadius: 8
      }
    ]
  };

  const last7Days = [...Array(7)]
    .map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    })
    .reverse();

  // FIXED: use createdAt instead of interview scheduled date
  const trendCounts = last7Days.map((date) =>
    interviews.filter((i) => i.createdAt?.slice(0, 10) === date).length
  );

  const trendData = {
    labels: last7Days,
    datasets: [
      {
        label: "Interviews Created",
        data: trendCounts,
        borderColor: "#3498db",
        backgroundColor: "rgba(52,152,219,0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 4
      }
    ]
  };

  return (
    <div style={styles.wrapper}>
      <Sidebar />

      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
            <p style={{ margin: 0, color: "#777" }}>Live system analytics</p>
          </div>
        </div>

        {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}

        <div style={styles.kpiGrid}>
          <KpiCard
            title="Total Interviews"
            value={totalInterviews}
            color="#3498db"
          />
          <KpiCard
            title="Completed"
            value={completedInterviews}
            color="#2ecc71"
          />
          <KpiCard title="All Jobs" value={jobs.length} color="#e74c3c" />
          <KpiCard
            title="Candidates"
            value={totalCandidates}
            color="#9b59b6"
          />
          <KpiCard
            title="Success Rate"
            value={`${successRate}%`}
            color="#16a085"
          />
        </div>

        <div style={styles.companyProfileCard}>
          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#1a2035" }}>
              Manage company profile
            </h3>
            <p style={{ margin: 0, color: "#666", fontSize: "14px", maxWidth: "480px" }}>
              Update company details, images, culture, and benefits shown on the public
              company page.
            </p>
          </div>
          <button
            type="button"
            style={styles.companyProfileBtn}
            onClick={() => navigate("/admin/company-profile")}
          >
            Manage now
          </button>
        </div>

        <div style={styles.chartGrid}>
          <div style={styles.card}>
            <h3>Interview Summary</h3>
            <Bar data={interviewData} />
          </div>

          <div style={styles.card}>
            <h3>Last 7 Days Trend</h3>
            <Line data={trendData} />
          </div>
        </div>

        <div style={styles.card}>
          <h3>Recent Jobs</h3>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Job Title</th>
              </tr>
            </thead>

            <tbody>
              {jobs.length > 0 ? (
                jobs.map((item, index) => (
                  <tr key={item._id}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{item.title || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={styles.empty}>
                    No jobs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.card}>
          <h3>Recent Interviews</h3>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Job</th>
                <th style={styles.th}>Result</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {interviews.length > 0 ? (
                interviews.slice(0, 5).map((item) => (
                  <tr key={item._id}>
                    <td style={styles.td}>
                      {item.candidateId?.userId?.name || "N/A"}
                    </td>
                    <td style={styles.td}>{item.jobId?.title || "N/A"}</td>
                    <td style={styles.td}>{item.resultStatus || "N/A"}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background:
                            item.status === "completed"
                              ? "#2ecc71"
                              : item.status === "cancelled"
                              ? "#e74c3c"
                              : "#f39c12"
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={styles.empty}>
                    No interviews found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    background: "#f4f6f9",
    minHeight: "100vh"
  },

  main: {
    flex: 1,
    padding: "20px"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px"
  },

  companyProfileCard: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    background: "#fff",
    padding: "22px 24px",
    borderRadius: "14px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.05)",
    marginTop: "25px",
    borderLeft: "4px solid #4f46e5",
  },

  companyProfileBtn: {
    padding: "10px 22px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    color: "#fff",
    background: "linear-gradient(135deg, #4338ca, #4f46e5)",
    boxShadow: "0 4px 14px rgba(67, 56, 202, 0.35)",
  },

  kpiCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.05)",
    transition: "0.3s",
    cursor: "pointer"
  },

  kpiTitle: {
    fontSize: "13px",
    color: "#777"
  },

  kpiValue: {
    fontSize: "26px",
    fontWeight: "bold"
  },

  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginTop: "25px"
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.05)",
    marginTop: "25px"
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 10px",
    marginTop: "10px"
  },

  th: {
    textAlign: "left",
    padding: "12px 15px",
    background: "#f4f6f9",
    borderBottom: "2px solid #e0e0e0",
    fontSize: "13px",
    color: "#555"
  },

  td: {
    padding: "12px 15px",
    background: "#fff",
    borderTop: "1px solid #eee",
    borderBottom: "1px solid #eee",
    textAlign: "center",
    fontSize: "14px",
    color: "#333"
  },

  badge: {
    padding: "5px 10px",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "12px"
  },

  empty: {
    textAlign: "center",
    padding: "20px",
    color: "#777"
  },

  errorText: {
    color: "#e74c3c",
    marginBottom: "15px",
    fontWeight: "bold"
  }
};

export default AdminDashboard;