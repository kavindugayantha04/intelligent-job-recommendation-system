import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyApplications, withdrawApplication } from "../api/applicationApi";
import axios from "../api/axiosConfig";
import UserNavbar from "../components/UserNavbar.jsx";
import Footer from "../components/Footer.jsx";

function timeSince(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function showToast(msg) {
  alert(msg);
}

export default function MyApplications() {
  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [scheduledInterviewCount, setScheduledInterviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmId, setConfirmId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function loadApps() {
    setLoading(true);
    setError("");

    try {
      const [appsRes, interviewRes] = await Promise.all([
        getMyApplications(),
        axios.get("/interview/my/scheduled-count"),
      ]);

      setApps(appsRes.data?.applications || []);
      setScheduledInterviewCount(interviewRes.data?.scheduledCount || 0);
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to load applications"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    loadApps();
  }, [navigate]);

  const stats = useMemo(() => {
    const total = apps.length;
    const pending = apps.filter((a) => a.status === "pending").length;

    return {
      total,
      pending,
      accepted: scheduledInterviewCount,
    };
  }, [apps, scheduledInterviewCount]);

  async function confirmWithdraw() {
    if (!confirmId) return;

    setConfirmLoading(true);

    try {
      await withdrawApplication(confirmId);
      showToast("Application withdrawn successfully.");
      setConfirmId(null);
      await loadApps();
    } catch (e) {
      showToast(
        e.response?.data?.message || e.message || "Failed to withdraw application."
      );
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <>
      <UserNavbar />

      <div className="container">
        <div className="page-header">
          <h1>My Applications</h1>
          <p>Track the status of your job applications</p>
        </div>

        {stats.total > 0 && (
          <div className="stats-row">
            <div className="stat-card">
              <div className="num">{stats.total}</div>
              <div className="label">Total Applied</div>
            </div>

            <div className="stat-card">
              <div className="num">{stats.pending}</div>
              <div className="label">Pending</div>
            </div>

            <div className="stat-card">
              <div className="num">{stats.accepted}</div>
              <div className="label">Accepted</div>
            </div>
          </div>
        )}

        <div>
          {loading && <div className="spinner"></div>}

          {!loading && error && (
            <div className="empty-state">
              <div className="icon">⚠️</div>
              <h3>Failed to load applications</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && apps.length === 0 && (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No applications yet</h3>
              <p>Browse jobs and apply to get started!</p>

              <Link
                to="/browse-jobs"
                className="btn btn-primary"
                style={{ marginTop: "1rem", display: "inline-block" }}
              >
                Browse Jobs
              </Link>
            </div>
          )}

          {!loading && !error && apps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {apps.map((a) => {
                const job = a.jobId || {};
                const jobTitle = job.title || "Job Removed";
                const jobCategory = job.category || "General";
                const experience = job.experienceLevel || "Not specified";
                const workType = job.workType || "Not specified";

                const skills = [
                  ...(job.mandatorySkills || []),
                  ...(job.preferredSkills || []),
                ];

                return (
                  <div className="app-card" key={a._id}>
                    <div className="app-card-info">
                      <div className="app-card-title">{jobTitle}</div>
                      <div className="app-card-company">📂 {jobCategory}</div>

                      <div className="app-card-meta">
                        <>
                          🎓 {experience} &nbsp;·&nbsp; 💼 {workType} &nbsp;·&nbsp; Applied{" "}
                          {timeSince(a.createdAt)}
                        </>
                      </div>

                      {skills.length > 0 && (
                        <div className="job-skills" style={{ marginTop: "0.6rem" }}>
                          {skills.slice(0, 5).map((s, i) => (
                            <span className="skill-tag" key={s + i}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {a.coverLetter && (
                        <div
                          style={{
                            color: "var(--text-dim)",
                            fontSize: "0.8rem",
                            marginTop: "8px",
                            fontStyle: "italic",
                          }}
                        >
                          "
                          {a.coverLetter.length > 100
                            ? a.coverLetter.substring(0, 100) + "…"
                            : a.coverLetter}
                          "
                        </div>
                      )}
                    </div>

                    <div className="app-card-actions">
                      <span className={`badge badge-${a.status}`}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirmId(a._id)}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {confirmId && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: "380px" }}>
            <div className="modal-header">
              <div className="modal-title">Withdraw Application</div>
              <button
                className="modal-close"
                onClick={() => !confirmLoading && setConfirmId(null)}
              >
                &times;
              </button>
            </div>

            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Are you sure you want to withdraw this application? This action cannot
              be undone.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="btn btn-outline"
                onClick={() => !confirmLoading && setConfirmId(null)}
                disabled={confirmLoading}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger"
                onClick={confirmWithdraw}
                disabled={confirmLoading}
              >
                {confirmLoading ? "Withdrawing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}