import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import UserNavbar from "../components/UserNavbar.jsx";
import Footer from "../components/Footer.jsx";
import { getCourses, getCourseSkillGaps } from "../api/courseApi.js";

/* =========================================================
   Courses page (candidate side)
   ---------------------------------------------------------
   Sections (top → bottom):
     1. Heading "Courses"
     2. "Skill Gaps Found From Recommended Jobs"
        - Missing skill cards with "Start MCQ Test"
        - Empty states:
            no CV/profile skills -> "Upload your CV…"
            no gaps              -> "No major skill gaps found."
     3. Filter input (filter courses by skill)
     4. All available courses
========================================================= */
export default function CourseRecommendationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skillParam = searchParams.get("skill") || "";

  // ---- Skill gap state ---- //
  const [gapsLoading, setGapsLoading] = useState(true);
  const [gapsError, setGapsError] = useState("");
  const [missingSkills, setMissingSkills] = useState([]);
  const [hasCandidateSkills, setHasCandidateSkills] = useState(false);
  const [analysedJobsCount, setAnalysedJobsCount] = useState(0);
  const [gapMessage, setGapMessage] = useState("");

  // ---- Course state ---- //
  const [skillFilter, setSkillFilter] = useState(skillParam);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  /* ---- effects ---- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    loadSkillGaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCourses(skillParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillParam]);

  async function loadSkillGaps() {
    // Clear any previous gap state up-front so we never render stale
    // missing skills on refresh / re-fetch (esp. after the user has
    // since cleared their CV / profile skills).
    setGapsLoading(true);
    setGapsError("");
    setMissingSkills([]);
    setHasCandidateSkills(false);
    setAnalysedJobsCount(0);
    setGapMessage("");

    try {
      const data = await getCourseSkillGaps();

      const candidateSkills = Array.isArray(data?.candidateSkills)
        ? data.candidateSkills
        : [];
      const missing = Array.isArray(data?.missingSkills)
        ? data.missingSkills
        : [];

      // If the backend says "no usable candidate data", force the
      // missing-skills list to empty so the UI never shows skill cards.
      const hasCandidate = candidateSkills.length > 0;
      setHasCandidateSkills(hasCandidate);
      setMissingSkills(hasCandidate ? missing : []);
      setAnalysedJobsCount(data?.analysedJobsCount || 0);
      setGapMessage(data?.message || "");
    } catch (e) {
      setGapsError(
        e.response?.data?.message ||
          e.message ||
          "Failed to load skill gaps."
      );
    } finally {
      setGapsLoading(false);
    }
  }

  async function loadCourses(skill) {
    setCoursesLoading(true);
    setCoursesError("");
    try {
      const data = await getCourses({ skill });
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      setCoursesError(
        e.response?.data?.message ||
          e.message ||
          "Failed to load courses."
      );
    } finally {
      setCoursesLoading(false);
    }
  }

  function handleApplyFilter(e) {
    e.preventDefault();
    const trimmed = skillFilter.trim();
    if (trimmed) {
      navigate(`/courses?skill=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/courses");
    }
  }

  function clearFilter() {
    setSkillFilter("");
    navigate("/courses");
  }

  return (
    <>
      <UserNavbar />

      <div className="container">
        {/* ===== HEADING ===== */}
        <div className="page-header">
          <h1>Courses</h1>
          <p>
            See the skills you're missing for jobs that match your profile,
            then enroll in courses to close the gap.
          </p>
        </div>

        {/* ===== SKILL GAPS SECTION ===== */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "0.75rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px", color: "#1a2035" }}>
              Skill Gaps Found From Recommended Jobs
            </h2>
            {!gapsLoading && analysedJobsCount > 0 && (
              <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                Based on {analysedJobsCount} matching job
                {analysedJobsCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {gapsLoading && <div className="spinner"></div>}

          {!gapsLoading && gapsError && (
            <div className="empty-state">
              <div className="icon">⚠️</div>
              <h3>Could not load skill gaps</h3>
              <p>{gapsError}</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "0.5rem" }}
                onClick={loadSkillGaps}
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state: no CV / profile skills */}
          {!gapsLoading && !gapsError && !hasCandidateSkills && (
            <div
              style={{
                background: "white",
                border: "1px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                color: "#475569",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
              <p style={{ margin: 0, fontWeight: 600 }}>
                Upload your CV or complete your profile to identify skill
                gaps.
              </p>
              {gapMessage &&
                gapMessage !==
                  "Upload your CV or complete your profile to identify skill gaps." && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {gapMessage}
                  </p>
                )}
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: "12px" }}
                onClick={() => navigate("/profile")}
              >
                Go to Profile
              </button>
            </div>
          )}

          {/* Empty state: candidate has skills but no gaps */}
          {!gapsLoading &&
            !gapsError &&
            hasCandidateSkills &&
            missingSkills.length === 0 && (
              <div
                style={{
                  background: "white",
                  border: "1px solid #d1fae5",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  color: "#065f46",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  No major skill gaps found.
                </p>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#047857",
                    fontSize: "13px",
                  }}
                >
                  Your skills already cover the recommended jobs.
                </p>
              </div>
            )}

          {/* Has gaps */}
          {!gapsLoading &&
            !gapsError &&
            hasCandidateSkills &&
            missingSkills.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "16px",
                }}
              >
                {missingSkills.map((skill) => (
                  <div
                    key={skill}
                    style={{
                      background: "white",
                      borderRadius: "12px",
                      padding: "18px",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
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
                    </span>

                    <h3
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        color: "#1a2035",
                      }}
                    >
                      {skill}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        fontSize: "12px",
                        lineHeight: 1.5,
                      }}
                    >
                      Required by jobs you match. Take a quick MCQ test to see
                      whether you really need a course.
                    </p>

                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: "auto" }}
                      onClick={() =>
                        navigate(
                          `/skill-test/${encodeURIComponent(skill)}`
                        )
                      }
                    >
                      Start MCQ Test
                    </button>
                  </div>
                ))}
              </div>
            )}
        </section>

        {/* ===== ALL COURSES SECTION ===== */}
        <section>
          <h2
            style={{
              margin: "0 0 0.75rem",
              fontSize: "20px",
              color: "#1a2035",
            }}
          >
            All Courses
          </h2>

          <form
            onSubmit={handleApplyFilter}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Filter by skill (e.g. React)"
              style={{
                flex: "1 1 220px",
                padding: "10px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                background: "white",
              }}
            />
            <button type="submit" className="btn btn-primary">
              Filter
            </button>
            {skillParam && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={clearFilter}
              >
                Clear
              </button>
            )}
          </form>

          {coursesLoading && <div className="spinner"></div>}

          {!coursesLoading && coursesError && (
            <div className="empty-state">
              <div className="icon">⚠️</div>
              <h3>Could not load courses</h3>
              <p>{coursesError}</p>
            </div>
          )}

          {!coursesLoading && !coursesError && courses.length === 0 && (
            <div className="empty-state">
              <div className="icon">📚</div>
              <h3>No courses found</h3>
              <p>
                {skillParam
                  ? `No courses for "${skillParam}" yet.`
                  : "There are no courses configured at the moment."}
              </p>
            </div>
          )}

          {!coursesLoading && !coursesError && courses.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px",
              }}
            >
              {courses.map((course) => (
                <div
                  key={course._id}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    overflow: "hidden",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      height: "150px",
                      background: "#1a2035",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "44px",
                        }}
                      >
                        📚
                      </div>
                    )}
                    {course.relatedSkill && (
                      <span
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          background: "rgba(255,255,255,0.92)",
                          color: "#1a2035",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        {course.relatedSkill}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      padding: "18px 20px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        color: "#1a2035",
                      }}
                    >
                      {course.title}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {course.level && (
                        <span
                          style={{
                            background: "#eff6ff",
                            color: "#3b6ef6",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {course.level}
                        </span>
                      )}
                      {course.category && (
                        <span
                          style={{
                            background: "#f3f4f6",
                            color: "#6b7280",
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                          }}
                        >
                          {course.category}
                        </span>
                      )}
                    </div>

                    {course.description && (
                      <p
                        style={{
                          margin: 0,
                          color: "#6b7280",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          flex: 1,
                        }}
                      >
                        {course.description.slice(0, 140)}
                        {course.description.length > 140 ? "…" : ""}
                      </p>
                    )}

                    {course.link && (
                      <a
                        href={course.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{
                          marginTop: "auto",
                          textDecoration: "none",
                          textAlign: "center",
                        }}
                      >
                        Enroll
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}
