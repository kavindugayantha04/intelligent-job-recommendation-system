import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyApplications, withdrawApplication } from "../api/applicationApi";
import { getAllInterviews, scheduleMyInterviewApi } from "../api/interviewApi";
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

function formatInterviewDate(dateStr) {
  if (!dateStr) return "Not set";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MyApplications() {
  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [myInterviews, setMyInterviews] = useState([]);
  const [scheduledInterviewCount, setScheduledInterviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmId, setConfirmId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ date: "", time: "", venue: "" });
  const [scheduleErrors, setScheduleErrors] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  async function loadApps() {
    setLoading(true);
    setError("");

    try {
      const [appsRes, interviewRes, allInterviewsRes] = await Promise.all([
        getMyApplications(),
        axios.get("/interview/my/scheduled-count"),
        getAllInterviews(),
      ]);

      setApps(appsRes.data?.applications || []);
      setScheduledInterviewCount(interviewRes.data?.scheduledCount || 0);
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserId = currentUser?._id || currentUser?.id || "";
      const allInterviews = Array.isArray(allInterviewsRes.data)
        ? allInterviewsRes.data
        : [];
      const ownInterviews = allInterviews.filter((it) => {
        const interviewUserId =
          it?.candidateId?.userId?._id ||
          it?.candidateId?.userId ||
          "";
        return String(interviewUserId) === String(currentUserId);
      });
      setMyInterviews(ownInterviews);
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
    const interviewJobIds = new Set(
      myInterviews
        .map((it) => it?.jobId?._id || it?.jobId)
        .filter(Boolean)
        .map((id) => String(id))
    );
    const total = apps.length;
    const pending = apps.filter(
      (a) => a.status === "pending" && !interviewJobIds.has(String(a?.jobId?._id || a?.jobId))
    ).length;
    const acceptedApplications = myInterviews.length;

    return {
      total,
      pending,
      accepted: acceptedApplications,
      scheduledInterviews: scheduledInterviewCount,
    };
  }, [apps, myInterviews, scheduledInterviewCount]);

  const filteredApps = useMemo(() => {
    const interviewJobIds = new Set(
      myInterviews
        .map((it) => it?.jobId?._id || it?.jobId)
        .filter(Boolean)
        .map((id) => String(id))
    );
    if (activeFilter === "pending") {
      return apps.filter(
        (a) => a.status === "pending" && !interviewJobIds.has(String(a?.jobId?._id || a?.jobId))
      );
    }
    if (activeFilter === "accepted") return [];
    return apps;
  }, [activeFilter, apps, myInterviews]);

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

  function openScheduleModal(application) {
    setScheduleFor(application);
    setScheduleForm({ date: "", time: "", venue: "" });
    setScheduleErrors({});
  }

  function closeScheduleModal() {
    if (scheduleLoading) return;
    setScheduleFor(null);
    setScheduleErrors({});
  }

  function validateSchedule() {
    const errors = {};
    if (!scheduleForm.date) errors.date = "Date is required";
    if (!scheduleForm.time) errors.time = "Time is required";
    if (!scheduleForm.venue.trim()) errors.venue = "Venue is required";

    if (scheduleForm.date && scheduleForm.time) {
      const selected = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
      if (selected <= new Date()) {
        errors.time = "Please choose a future date and time";
      }
    }

    setScheduleErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleScheduleInterview() {
    if (!scheduleFor || !validateSchedule()) return;

    setScheduleLoading(true);
    try {
      await scheduleMyInterviewApi({
        jobId: scheduleFor.jobId?._id,
        date: scheduleForm.date,
        time: scheduleForm.time,
        venue: scheduleForm.venue.trim(),
      });
      showToast("Interview scheduled successfully.");
      closeScheduleModal();
      await loadApps();
    } catch (e) {
      showToast(e.response?.data?.message || e.message || "Failed to schedule interview.");
    } finally {
      setScheduleLoading(false);
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
            <div
              className={`stat-card stat-card-clickable ${
                activeFilter === "all" ? "stat-card-active" : ""
              }`}
              onClick={() => setActiveFilter("all")}
            >
              <div className="num">{stats.total}</div>
              <div className="label">Total Applied</div>
            </div>

            <div
              className={`stat-card stat-card-clickable ${
                activeFilter === "pending" ? "stat-card-active" : ""
              }`}
              onClick={() => setActiveFilter("pending")}
            >
              <div className="num">{stats.pending}</div>
              <div className="label">Pending</div>
            </div>

            <div
              className={`stat-card stat-card-clickable ${
                activeFilter === "accepted" ? "stat-card-active" : ""
              }`}
              onClick={() => setActiveFilter("accepted")}
            >
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
              {activeFilter === "accepted" && (
                <div className="interview-panel interview-panel-muted" style={{ marginTop: 0 }}>
                  <div className="interview-panel-title">Interview Schedule Details</div>
                  <div className="interview-panel-subtext">
                    Showing your scheduled interviews with full details. Scheduled interviews: {stats.scheduledInterviews}.
                  </div>
                </div>
              )}

              {activeFilter === "accepted" && myInterviews.length === 0 && (
                <div className="interview-panel interview-panel-muted">
                  <div className="interview-panel-title">No Interview Schedules Yet</div>
                  <div className="interview-panel-subtext">
                    No interview records were found for your account.
                  </div>
                </div>
              )}

              {activeFilter === "accepted" &&
                myInterviews.map((interview) => {
                  const job = interview.jobId || {};
                  const showResult =
                    interview.resultStatus &&
                    String(interview.resultStatus).toLowerCase() !== "pending";
                  return (
                    <div className="app-card" key={interview._id}>
                      <div className="app-card-info">
                        <div className="app-card-title">{job.title || "Job role not available"}</div>
                        {job.category && <div className="app-card-company">📂 {job.category}</div>}
                        {(job.experienceLevel || job.workType) && (
                          <div className="app-card-meta">
                            {job.experienceLevel && <>🎓 {job.experienceLevel}</>}
                            {job.experienceLevel && job.workType && <>&nbsp;·&nbsp;</>}
                            {job.workType && <>💼 {job.workType}</>}
                          </div>
                        )}

                        <div className="interview-panel" style={{ marginTop: "0.75rem" }}>
                          <div className="interview-panel-title">Interview Schedule</div>
                          <div className="interview-panel-details">
                            <span>🧩 Job Role: {job.title || "Not set"}</span>
                            <span>📅 Date: {formatInterviewDate(interview.date)}</span>
                            <span>🕒 Time: {interview.time || "Not set"}</span>
                            <span>📍 Venue: {interview.venue || "Online"}</span>
                            <span>📌 Interview Status: {interview.status || "Upcoming"}</span>
                            {showResult && <span>📝 Result: {interview.resultStatus}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="app-card-actions">
                        <span className="badge badge-accepted">Accepted</span>
                      </div>
                    </div>
                  );
                })}

              {activeFilter !== "accepted" && filteredApps.map((a) => {
                const job = a.jobId || {};
                const jobTitle = job.title || "Job Removed";
                const jobCategory = job.category || "General";
                const experience = job.experienceLevel || "Not specified";
                const workType = job.workType || "Not specified";
                const interview = a.interviewSchedule;
                const canScheduleInterview = !interview && a.status !== "rejected";

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

      {scheduleFor && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <div className="modal-title">Schedule Interview</div>
              <button className="modal-close" onClick={closeScheduleModal}>
                &times;
              </button>
            </div>

            <div style={{ color: "var(--text-muted)", marginBottom: "1rem", fontSize: "0.9rem" }}>
              {scheduleFor.jobId?.title || "Selected job"}
            </div>

            <div className="form-group">
              <label>Interview Date</label>
              <input
                type="date"
                value={scheduleForm.date}
                onChange={(e) => {
                  setScheduleForm((prev) => ({ ...prev, date: e.target.value }));
                  setScheduleErrors((prev) => ({ ...prev, date: "" }));
                }}
              />
              {scheduleErrors.date && <div className="field-error">{scheduleErrors.date}</div>}
            </div>

            <div className="form-group">
              <label>Interview Time</label>
              <input
                type="time"
                value={scheduleForm.time}
                onChange={(e) => {
                  setScheduleForm((prev) => ({ ...prev, time: e.target.value }));
                  setScheduleErrors((prev) => ({ ...prev, time: "" }));
                }}
              />
              {scheduleErrors.time && <div className="field-error">{scheduleErrors.time}</div>}
            </div>

            <div className="form-group">
              <label>Venue</label>
              <input
                type="text"
                placeholder="e.g., Zoom / Office HQ / Google Meet"
                value={scheduleForm.venue}
                onChange={(e) => {
                  setScheduleForm((prev) => ({ ...prev, venue: e.target.value }));
                  setScheduleErrors((prev) => ({ ...prev, venue: "" }));
                }}
              />
              {scheduleErrors.venue && <div className="field-error">{scheduleErrors.venue}</div>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className="btn btn-outline"
                onClick={closeScheduleModal}
                disabled={scheduleLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleScheduleInterview}
                disabled={scheduleLoading}
              >
                {scheduleLoading ? "Scheduling..." : "Confirm Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
