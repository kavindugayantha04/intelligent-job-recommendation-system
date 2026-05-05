import { useEffect, useState } from "react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
} from "chart.js";

import Sidebar from "../components/AdminSidebar";
import "../styles/sidebar.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

// KPI CARD
const KpiCard = ({ title, value, color }) => (
  <div style={{ ...styles.kpiCard, borderTop: `4px solid ${color}` }}>
    <p style={styles.kpiTitle}>{title}</p>
    <h2 style={{ ...styles.kpiValue, color }}>{value}</h2>
  </div>
);

function Dashboard() {
  const [filter, setFilter] = useState("Weekly");
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const interviewsRes = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/interview/all`
        );
        const interviewsData = await interviewsRes.json();

        const candidatesRes = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/getall/candidates`
        );

        const jobRes = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/getalljobs`
        );

        const candidatesData = await candidatesRes.json();
        const jobData = await jobRes.json();

        setInterviews(interviewsData);
        setCandidates(candidatesData);
        setJobs(jobData);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  // KPI
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

  // Doughnut
  const roleChartData = {
    labels: ["Upcoming", "Completed", "Cancelled"],
    datasets: [
      {
        data: [pendingInterviews, completedInterviews, cancelledInterviews],
        backgroundColor: ["#f39c12", "#2ecc71", "#e74c3c"],
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  // Bar
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

  // Line
  const last7Days = [...Array(7)]
    .map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    })
    .reverse();

  const trendCounts = last7Days.map((date) =>
    interviews.filter((i) => i.date?.slice(0, 10) === date).length
  );

  const trendData = {
    labels: last7Days,
    datasets: [
      {
        label: "Interviews Trend",
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
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
            <p style={{ margin: 0, color: "#777" }}>Live system analytics</p>
          </div>

          {/* <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.select}
          >
            <option>Weekly</option>
            <option>Monthly</option>
          </select> */}
        </div>

        {/* KPI */}
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
          <KpiCard
            title="All Jobs"
            value={jobs.length}
            color="#e74c3c"
          />
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

        {/* CHARTS */}
        <div style={styles.chartGrid}>
          {/* <div style={styles.card}>
            <h3>Status Overview</h3>
            <div style={{ height: "240px" }}>
              <Doughnut data={roleChartData} />
            </div>
          </div> */}

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
                <th>#</th>
                <th>Job Title</th>
                
              </tr>
            </thead>

            <tbody>
              {jobs.map((item, index) => (
                <tr key={item._id}>

                  {/* Index column */}
                  <td style={styles.td}>
                    {index + 1}
                  </td>

                  <td style={styles.td}>
                    {item.title || "N/A"}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE */}
        <div style={styles.card}>
          <h3>Recent Interviews</h3>

          <table style={styles.table}>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job</th>
                <th>Result</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {interviews.slice(0, 5).map((item) => (
                <tr key={item._id} style={styles.td}>
                  <td>{item.candidateId?.userId?.name || "N/A"}</td>
                  <td>{item.jobId?.title || "N/A"}</td>
                  <td>{item.resultStatus || "N/A"}</td>
                  <td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
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

  select: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd"
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px"
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
    boxShadow: "0 6px 15px rgba(0,0,0,0.05)"
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
  }
};

export default Dashboard;