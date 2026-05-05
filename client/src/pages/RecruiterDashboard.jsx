import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { getJobs } from "../api/jobApi";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function isExpired(deadline) {
  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jobDeadline = new Date(deadline);
  jobDeadline.setHours(0, 0, 0, 0);

  return jobDeadline < today;
}

function getDaysLeft(deadline) {
  if (!deadline) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jobDeadline = new Date(deadline);
  jobDeadline.setHours(0, 0, 0, 0);

  const diffTime = jobDeadline - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function RecruiterDashboard() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await getJobs();

      const jobsData = Array.isArray(res.data) ? res.data : [];
      setJobs(jobsData);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalJobs = jobs.length;

    const openJobs = jobs.filter(
      (job) => job.status === "Open" && !isExpired(job.deadline)
    ).length;

    const closedJobs = jobs.filter(
      (job) => job.status === "Closed" || isExpired(job.deadline)
    ).length;

    const totalApplicants = jobs.reduce(
      (sum, job) => sum + (job.applicants || 0),
      0
    );

    const expiringSoon = jobs.filter((job) => {
      const daysLeft = getDaysLeft(job.deadline);
      return (
        job.status === "Open" &&
        daysLeft !== null &&
        daysLeft >= 0 &&
        daysLeft <= 7
      );
    }).length;

    const avgApplicants =
      totalJobs > 0 ? (totalApplicants / totalJobs).toFixed(1) : 0;

    let mostAppliedJob = null;
    if (jobs.length > 0) {
      mostAppliedJob = jobs.reduce((max, job) =>
        (job.applicants || 0) > (max.applicants || 0) ? job : max
      );
    }

    return {
      totalJobs,
      openJobs,
      closedJobs,
      totalApplicants,
      expiringSoon,
      avgApplicants,
      mostAppliedJob,
    };
  }, [jobs]);

  const pieData = {
    labels: ["Open Jobs", "Closed / Expired Jobs"],
    datasets: [
      {
        data: [stats.openJobs, stats.closedJobs],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    },
    cutout: "45%",
  };

  const barData = {
    labels: jobs.map((job) => job.title),
    datasets: [
      {
        label: "Applicants",
        data: jobs.map((job) => job.applicants || 0),
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-subtitle">
            <h2>Recruiter Portal</h2>
          </span>
        </div>

        <ul>
          <li
            className="active"
            onClick={() => navigate("/recruiter-dashboard")}
          >
            ◈ Dashboard
          </li>

          <li onClick={() => navigate("/job-management")}>
            ◻ Job Management
          </li>

          <li onClick={() => navigate("/dashboard")}>
            ◷ Interview Scheduling
          </li>

          <li onClick={() => navigate("/recruiter-profile")}>
            ◉ Profile
          </li>
        </ul>
      </div>

      <div className="main-content">
        <div className="header">
          <div>
            <h1>Recruiter Dashboard</h1>
            <p className="header-sub">
              Intelligent Job Recommendation System · Overview
            </p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "30px", fontSize: "18px" }}>Loading dashboard...</div>
        ) : (
          <>
            <div className="cards">
              <div className="card card-blue">
                <p>Total Jobs</p>
                <h2>{stats.totalJobs}</h2>
              </div>

              <div className="card card-green">
                <p>Open Jobs</p>
                <h2>{stats.openJobs}</h2>
              </div>

              <div className="card card-red">
                <p>Closed Jobs</p>
                <h2>{stats.closedJobs}</h2>
              </div>

              <div className="card card-yellow">
                <p>Total Applicants</p>
                <h2>{stats.totalApplicants}</h2>
              </div>
            </div>

            <div className="cards" style={{ marginTop: "20px" }}>
              <div className="card">
                <p>Jobs Expiring Soon</p>
                <h2>{stats.expiringSoon}</h2>
              </div>

              <div className="card">
                <p>Average Applicants / Job</p>
                <h2>{stats.avgApplicants}</h2>
              </div>

              <div className="card">
                <p>Most Applied Job</p>
                <h2 style={{ fontSize: "18px" }}>
                  {stats.mostAppliedJob ? stats.mostAppliedJob.title : "N/A"}
                </h2>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-box">
                <h3>Job Status Overview</h3>
                <div className="chart-wrap">
                  <Pie data={pieData} options={pieOptions} />
                </div>
              </div>

              <div className="chart-box">
                <h3>Applicants Per Job</h3>
                <div className="chart-wrap">
                  {jobs.length > 0 ? (
                    <Bar data={barData} options={barOptions} />
                  ) : (
                    <p style={{ padding: "20px" }}>No jobs available yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div
              className="chart-box"
              style={{ marginTop: "24px", padding: "20px" }}
            >
              <h3 style={{ marginBottom: "16px" }}>Recent Job Posts</h3>

              {recentJobs.length === 0 ? (
                <p>No job posts yet.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                        <th style={{ padding: "12px" }}>Title</th>
                        <th style={{ padding: "12px" }}>Category</th>
                        <th style={{ padding: "12px" }}>Applicants</th>
                        <th style={{ padding: "12px" }}>Deadline</th>
                        <th style={{ padding: "12px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentJobs.map((job) => {
                        const expired = isExpired(job.deadline);
                        const statusText =
                          job.status === "Closed" || expired ? "Closed" : "Open";

                        return (
                          <tr key={job._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px" }}>{job.title}</td>
                            <td style={{ padding: "12px" }}>{job.category || "—"}</td>
                            <td style={{ padding: "12px" }}>{job.applicants || 0}</td>
                            <td style={{ padding: "12px" }}>
                              {job.deadline
                                ? new Date(job.deadline).toLocaleDateString()
                                : "—"}
                            </td>
                            <td style={{ padding: "12px" }}>{statusText}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RecruiterDashboard;