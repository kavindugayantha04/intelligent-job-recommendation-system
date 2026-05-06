import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api.js";
import Footer from "../components/Footer.jsx";
import JobApplyModal from "../components/JobApplyModal.jsx";
import UserNavbar from "../components/UserNavbar.jsx";

function timeSince(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return "Not specified";
  return new Date(dateStr).toLocaleDateString();
}

function isExpired(deadline) {
  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);

  return end < today;
}

export default function BrowseJobs() {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [applyJob, setApplyJob] = useState(null);

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const res = await api.getJobs();
      setJobs(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.message || "Failed to load jobs");
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

    loadJobs();
  }, [navigate]);

  const openApplyModal = useCallback((job) => setApplyJob(job), []);
  const closeApplyModal = useCallback(() => setApplyJob(null), []);

  const filteredJobs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return jobs;

    return jobs.filter((job) => {
      const mandatorySkills = job.mandatorySkills || [];
      const preferredSkills = job.preferredSkills || [];

      return (
        (job.title || "").toLowerCase().includes(q) ||
        (job.category || "").toLowerCase().includes(q) ||
        (job.experienceLevel || "").toLowerCase().includes(q) ||
        (job.workType || "").toLowerCase().includes(q) ||
        mandatorySkills.some((s) => (s || "").toLowerCase().includes(q)) ||
        preferredSkills.some((s) => (s || "").toLowerCase().includes(q))
      );
    });
  }, [jobs, search]);

  const activeJobs = useMemo(() => {
    return filteredJobs.filter(
      (job) => job.status !== "Closed" && !isExpired(job.deadline)
    );
  }, [filteredJobs]);

  const openApplyJobId = location.state?.openApplyJobId;

  /* Open modal from Recommended Jobs (or elsewhere) via router state once */
  useEffect(() => {
    if (!openApplyJobId || loading || jobs.length === 0) return;

    const selected = jobs.find((job) => String(job._id) === String(openApplyJobId));
    if (selected) {
      openApplyModal(selected);
    }

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: {},
    });
  }, [openApplyJobId, loading, jobs, navigate, location.pathname, location.search, openApplyModal]);

  return (
    <>
      {!applyJob && <UserNavbar />}

      <div className="container">
        <div className="page-header">
          <h1>Browse Jobs</h1>
          <p>Find active opportunities and apply easily</p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by title, category, experience, work type, or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="btn btn-outline" onClick={loadJobs} disabled={loading}>
            &#8635; Refresh
          </button>
        </div>

        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          {!loading &&
            !error &&
            `${activeJobs.length} active job${activeJobs.length !== 1 ? "s" : ""} found`}
        </div>

        <div className="jobs-grid">
          {loading && <div className="spinner"></div>}

          {!loading && error && (
            <div className="empty-state">
              <div className="icon">⚠️</div>
              <h3>Failed to load jobs</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && activeJobs.length === 0 && (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No active jobs found</h3>
              <p>Try another search term or check back later.</p>
            </div>
          )}

          {!loading &&
            !error &&
            activeJobs.length > 0 &&
            activeJobs.map((job) => (
              <div className="job-card" key={job._id}>
                <div className="job-card-header">
                  <div className="job-card-header-main">
                    <div className="job-card-title">{job.title}</div>
                    <div className="job-card-company">📂 {job.category || "General"}</div>
                  </div>

                  <div className="job-card-header-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm job-card-apply-btn"
                      onClick={() => openApplyModal(job)}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="job-meta">
                  <span>🕐 Posted {timeSince(job.createdAt)}</span>
                  <span>⏳ Deadline {formatDate(job.deadline)}</span>
                </div>

                <div className="job-meta" style={{ marginTop: "0.4rem" }}>
                  <span>🎓 {job.experienceLevel || "Not specified"}</span>
                  <span>💼 {job.workType || "Not specified"}</span>
                </div>

                {job.mandatorySkills && job.mandatorySkills.length > 0 && (
                  <div className="job-skills">
                    {job.mandatorySkills.map((skill) => (
                      <span className="skill-tag" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {job.preferredSkills && job.preferredSkills.length > 0 && (
                  <div className="job-skills" style={{ marginTop: "0.5rem" }}>
                    {job.preferredSkills.map((skill) => (
                      <span
                        className="skill-tag"
                        key={skill}
                        style={{
                          background: "#eef6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="job-desc">
                  {job.description &&
                    (job.description.length > 180
                      ? `${job.description.substring(0, 180)}…`
                      : job.description)}
                </div>
              </div>
            ))}
        </div>
      </div>

      {applyJob && <JobApplyModal job={applyJob} onClose={closeApplyModal} />}

      <Footer />
    </>
  );
}
