import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Footer from "../components/Footer.jsx";
import JobApplyModal from "../components/JobApplyModal.jsx";
import UserNavbar from "../components/UserNavbar.jsx";
import { getMyRecommendations } from "../api/recommendationApi.js";

/* =========================
   Small presentation helpers
========================= */
function shortDescription(text, max = 180) {
  if (!text) return "";
  return text.length > max ? `${text.substring(0, max)}…` : text;
}

function scoreToPercent(score) {
  if (typeof score !== "number" || isNaN(score)) return null;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

function hasValidScore(score) {
  return typeof score === "number" && !isNaN(score) && score > 0;
}

function scoreColor(percent) {
  if (percent >= 70) return "#4f46e5";
  if (percent >= 40) return "#0891b2";
  if (percent >= 20) return "#d97706";
  return "#64748b";
}

const DEFAULT_EMPTY_MESSAGE = "Upload your CV to get recommendations.";

/**
 * Defensive: clear any cached recommendation / parsed-CV data that any
 * earlier version of the app might have stashed in browser storage.
 * Current code does NOT cache anything, but doing this on every mount
 * guarantees no stale data can ever leak into the UI.
 */
function clearRecommendationCache() {
  try {
    const keys = [
      "recommendations",
      "recommendedJobs",
      "parsedCV",
      "parsedCvText",
      "resumeText",
      "aiRecommendations",
    ];
    keys.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  } catch {
    /* storage can be unavailable in private mode — ignore */
  }
}

/* =========================
   MAIN PAGE
========================= */
export default function RecommendedJobs() {
  const navigate = useNavigate();

  // `jobs` is ALWAYS sourced from the latest backend response.
  // We never persist recommendations across requests — on every fetch,
  // state is reset first so a previous "good" response can't leak into
  // a later "no data" state.
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");
  const [applyJob, setApplyJob] = useState(null);

  async function loadRecommendations() {
    // Hard reset so stale cards can never flash or stick on the screen.
    setLoading(true);
    setError("");
    setEmptyMessage("");
    setJobs([]);

    try {
      const data = await getMyRecommendations();

      const list = Array.isArray(data?.recommendations)
        ? data.recommendations
        : [];

      // Backend signalled "no CV" or "no recommendation data" — treat
      // as empty state, NOT as an error, and show the friendly message
      // from the server. We explicitly wipe jobs so no old cards remain.
      if (data?.hasCV === false || data?.hasRecommendationData === false) {
        setJobs([]);
        setEmptyMessage(data.message || DEFAULT_EMPTY_MESSAGE);
        return;
      }

      // Valid response but zero ranked jobs (e.g. no active jobs posted).
      if (list.length === 0) {
        setJobs([]);
        setEmptyMessage(
          data?.message || "No matching jobs available at the moment."
        );
        return;
      }

      setJobs(list);
      setEmptyMessage("");
    } catch (e) {
      // On any failure, make absolutely sure no old recommendations survive.
      setJobs([]);

      // Older backend versions returned 400 with a message; handle both.
      const status = e.response?.status;
      const message =
        e.response?.data?.message ||
        e.message ||
        "Failed to load recommendations.";

      if (status === 400 || status === 404) {
        setEmptyMessage(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // Wipe any historical recommendation cache before fetching fresh data.
    clearRecommendationCache();
    loadRecommendations();
  }, [navigate]);

  const showEmptyState =
    !loading && !error && jobs.length === 0;

  return (
    <>
      {!applyJob && <UserNavbar />}

      <div className="container">
        <div className="page-header">
          <h1>Recommended Jobs for You</h1>
          <p>AI-ranked jobs based on your profile, skills and CV</p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
            }}
          >
            {!loading && !error && jobs.length > 0 &&
              `${jobs.length} recommendation${jobs.length !== 1 ? "s" : ""} found`}
          </div>

          <button
            className="btn btn-outline"
            onClick={loadRecommendations}
            disabled={loading}
          >
            &#8635; Refresh
          </button>
        </div>

        <div className="jobs-grid">
          {loading && <div className="spinner"></div>}

          {!loading && error && (
            <div className="empty-state">
              <div className="icon">⚠️</div>
              <h3>Could not load recommendations</h3>
              <p>{error}</p>
            </div>
          )}

          {showEmptyState && (
            <div className="empty-state">
              <div className="icon">🤖</div>
              <h3>No recommendations to show</h3>
              <p>{emptyMessage || DEFAULT_EMPTY_MESSAGE}</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "0.75rem" }}
                onClick={() => navigate("/profile")}
              >
                Go to Profile
              </button>
            </div>
          )}

          {!loading && !error && jobs.length > 0 && jobs.map((job) => {
            const showScore = hasValidScore(job.similarity_score);
            const percent = showScore ? scoreToPercent(job.similarity_score) : null;
            const color = showScore ? scoreColor(percent) : "#6b7280";

            return (
              <div className="job-card" key={job._id}>
                <div className="job-card-header">
                  <div className="job-card-header-main">
                    <div className="job-card-title">{job.title}</div>
                    <div className="job-card-company">
                      📂 {job.category || "General"}
                    </div>
                  </div>

                  <div className="job-card-header-actions">
                    {showScore && (
                      <div
                        className="job-card-match-pill"
                        style={{
                          background: `${color}15`,
                          color,
                          border: `1px solid ${color}40`,
                        }}
                        title="AI match score"
                      >
                        {percent}% match
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm job-card-apply-btn"
                      onClick={() => setApplyJob(job)}
                    >
                      View &amp; Apply
                    </button>
                  </div>
                </div>

                <div className="job-meta" style={{ marginTop: "0.4rem" }}>
                  <span>🎓 {job.experienceLevel || "Not specified"}</span>
                  <span>💼 {job.workType || "Not specified"}</span>
                </div>

                {job.mandatorySkills && job.mandatorySkills.length > 0 && (
                  <div className="job-skills" style={{ marginTop: "0.75rem" }}>
                    {job.mandatorySkills.map((skill) => (
                      <span className="skill-tag" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="job-desc" style={{ marginTop: "0.75rem" }}>
                  {shortDescription(job.description)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {applyJob && (
        <JobApplyModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
          onAppliedSuccess={loadRecommendations}
        />
      )}

      <Footer />
    </>
  );
}
