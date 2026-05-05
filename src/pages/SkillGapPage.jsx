import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import UserNavbar from "../components/UserNavbar.jsx";
import Footer from "../components/Footer.jsx";
import { getMySkillGap } from "../api/skillGapApi.js";

/* =========================================================
   Skill Gap Detection page (candidate side)
   - Reads candidate.skills + active jobs (mandatory + preferred)
     from /api/skill-gap/me and shows the missing skills.
   - Each missing skill becomes a clickable card → /skill-test/:skill
========================================================= */
export default function SkillGapPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [missingSkills, setMissingSkills] = useState([]);
  const [candidateSkills, setCandidateSkills] = useState([]);
  const [jobsAnalyzed, setJobsAnalyzed] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    loadSkillGap();
  }, [navigate]);

  async function loadSkillGap() {
    setLoading(true);
    setError("");
    try {
      const data = await getMySkillGap();
      setMissingSkills(Array.isArray(data?.missingSkills) ? data.missingSkills : []);
      setCandidateSkills(Array.isArray(data?.candidateSkills) ? data.candidateSkills : []);
      setJobsAnalyzed(data?.jobsAnalyzed || 0);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          "Failed to load your skill gap."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <UserNavbar />

      <div className="container">
        <div className="page-header">
          <h1>Your Skill Gaps</h1>
          <p>
            Skills required by active jobs that are missing from your profile.
            Take a quick MCQ test to confirm your level for each.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          <span>
            {jobsAnalyzed} active job{jobsAnalyzed !== 1 ? "s" : ""} analysed —{" "}
            {candidateSkills.length} skill{candidateSkills.length !== 1 ? "s" : ""} on your profile
          </span>
          <button
            className="btn btn-outline"
            onClick={loadSkillGap}
            disabled={loading}
          >
            &#8635; Refresh
          </button>
        </div>

        {loading && <div className="spinner"></div>}

        {!loading && error && (
          <div className="empty-state">
            <div className="icon">⚠️</div>
            <h3>Could not load skill gap</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && missingSkills.length === 0 && (
          <div className="empty-state">
            <div className="icon">✅</div>
            <h3>No skill gaps detected</h3>
            <p>
              Great — your profile already covers every skill required by the
              active jobs. Update your CV to reflect each one.
            </p>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: "0.75rem" }}
              onClick={() => navigate("/recommended-jobs")}
            >
              See Recommended Jobs
            </button>
          </div>
        )}

        {!loading && !error && missingSkills.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {missingSkills.map((skill) => (
              <div
                key={skill}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    background: "#fef3c7",
                    color: "#92400e",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    width: "fit-content",
                  }}
                >
                  Missing skill
                </div>

                <h3 style={{ margin: 0, fontSize: "18px", color: "#1a2035" }}>
                  {skill}
                </h3>

                <p style={{ margin: 0, color: "#6b7280", fontSize: "13px", lineHeight: 1.5 }}>
                  Required by jobs that match your profile. Take a quick MCQ
                  test to find out whether you really need a course.
                </p>

                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: "auto" }}
                  onClick={() =>
                    navigate(`/skill-test/${encodeURIComponent(skill)}`)
                  }
                >
                  Start MCQ Test
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
