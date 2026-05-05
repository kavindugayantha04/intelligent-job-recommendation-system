import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/JobManagement.css";
import axios from "../api/axiosConfig";
import CreateInterview from "../components/CreateInterview";

const BASE_URL = "http://localhost:5000";

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString();
}

function timeSince(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${BASE_URL}/${imagePath}`;
}

export default function JobApplicants() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedApplicationForInterview, setSelectedApplicationForInterview] =
    useState(null);

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/jobs/${id}/applicants`);
      setJob(res.data.job);
      setApplications(res.data.applications || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getCandidateProfileId = (app) => {
    return (
      app?.profile?._id ||
      app?.candidateId?._id ||
      app?.candidateId ||
      ""
    );
  };

  const openInterviewModal = (app) => {
    console.log("APPLICATION DATA:", app);
    console.log("CANDIDATE PROFILE ID:", getCandidateProfileId(app));
    setSelectedApplicationForInterview(app);
    setShowInterviewModal(true);
  };

  const closeInterviewModal = () => {
    setShowInterviewModal(false);
    setSelectedApplicationForInterview(null);
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-subtitle">
            <h2>Recruiter Portal</h2>
          </span>
        </div>

        <ul>
          <li onClick={() => navigate("/recruiter-dashboard")}>◈ Dashboard</li>
          <li className="active" onClick={() => navigate("/job-management")}>
            ◻ Job Management
          </li>
          <li onClick={() => navigate("/dashboard")}>◷ Interview Scheduling</li>
          <li onClick={() => navigate("/edit-profile")}>◉ Profile</li>
        </ul>
      </div>

      <div className="main-content">
        <div className="header">
          <div>
            <h1>Job Applicants</h1>
            <p className="header-sub">View and manage applicants for this job</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        {job && (
          <div
            className="job-card"
            style={{ marginBottom: "1.5rem", alignItems: "center" }}
          >
            <div className="job-card-left">
              <div className="job-icon">📄</div>

              <div className="job-card-body">
                <h3>{job.title}</h3>

                <div className="job-card-meta-row">
                  {job.category && (
                    <span className="meta-pill">📂 {job.category}</span>
                  )}

                  {job.deadline && (
                    <span className="meta-pill">
                      ⏳ Deadline: {formatDate(job.deadline)}
                    </span>
                  )}

                  <span className="meta-pill">
                    👥 {job.applicants || 0} Applicant
                    {(job.applicants || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="job-card-right">
              <button
                className="edit-btn"
                onClick={() => navigate("/job-management")}
              >
                ← Back to Jobs
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty-state-card">
            <h3>Loading applicants...</h3>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state-card">
            <h3>No Applicants Yet</h3>
            <p>No candidates have applied for this job so far.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            <div style={{ marginBottom: "0.9rem" }}>
              <strong>All applicants — {applications.length}</strong>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.9rem", color: "#4b5563" }}>
                Ordered by match score, then job title/category fit, skills matched, experience, and
                profile depth (not application time).
              </p>
            </div>

            {applications.map((app, index) => (
              <div key={app._id} className="job-card">
                <div className="job-card-left">
                  <div className="job-icon">👤</div>

                  <div className="job-card-body">
                    <h3>{app.user?.name || "Unknown Candidate"}</h3>
                    <div className="job-card-meta-row" style={{ marginTop: "6px" }}>
                      <span className="meta-pill" style={{ fontWeight: 800, background: "#f3f4f6" }}>
                        #{index + 1}
                      </span>
                      <span
                        className="meta-pill"
                        style={{
                          background: "#ecfdf5",
                          color: "#065f46",
                          border: "1px solid #a7f3d0",
                          fontWeight: 700,
                        }}
                      >
                        ⭐ Score: {Math.round(app.totalScore || 0)}%
                      </span>
                      <span className="meta-pill">
                        📂 Job/category fit: {Math.round(Number(app.categoryAffinity ?? app.matchDetails?.categoryAffinity ?? 0))}%
                      </span>
                      {index < 3 && Number(app.totalScore || 0) > 0 && (
                        <span
                          className="meta-pill"
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            border: "1px solid #fde68a",
                            fontWeight: 700,
                          }}
                        >
                          Top Candidate
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          background: "#e5e7eb",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.round(app.totalScore || 0)}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #34d399, #10b981)",
                          }}
                        />
                      </div>
                    </div>

                    <div className="job-card-meta-row">
                      <span className="meta-pill">
                        📧 {app.user?.email || "No email"}
                      </span>

                      <span className="meta-pill">
                        🕒 Applied {timeSince(app.createdAt)}
                      </span>

                      <span className="meta-pill">
                        📌 {app.status || "pending"}
                      </span>

                      {app.profile?.desiredRole && (
                        <span className="meta-pill">
                          🎯 {app.profile.desiredRole}
                        </span>
                      )}

                      {app.profile?.preferredField && (
                        <span className="meta-pill">
                          💼 {app.profile.preferredField}
                        </span>
                      )}

                      <span className="meta-pill">
                        ✅ Skills Match: {(app.matchDetails?.matchedSkills || []).length}/
                        {(app.matchDetails?.requiredSkills || []).length || 0}
                      </span>
                      <span className="meta-pill">
                        🧠 Experience: {app.matchDetails?.applicantYears || 0} yrs
                      </span>
                    </div>

                    {app.profile?.skills?.length > 0 && (
                      <div className="job-card-meta-row">
                        {app.profile.skills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="card-skill-tag mandatory">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {app.coverLetter && (
                      <p className="job-description-preview">
                        {app.coverLetter.length > 160
                          ? `${app.coverLetter.substring(0, 160)}...`
                          : app.coverLetter}
                      </p>
                    )}
                  </div>
                </div>

                <div className="job-card-right">
                  <button
                    className="edit-btn"
                    onClick={() => setSelectedApplicant(app)}
                  >
                    View Details
                  </button>

                  <button
                    className="close-job-btn"
                    onClick={() => openInterviewModal(app)}
                  >
                    Schedule Interview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedApplicant && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setSelectedApplicant(null)
          }
        >
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Applicant Details</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedApplicant(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  marginBottom: "1.25rem",
                  flexWrap: "wrap"
                }}
              >
                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "999px",
                    overflow: "hidden",
                    background: "#eef2ff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: "700",
                    fontSize: "1.2rem",
                    color: "#1f2937"
                  }}
                >
                  {selectedApplicant.profile?.profilePicture ? (
                    <img
                      src={getImageUrl(selectedApplicant.profile.profilePicture)}
                      alt="profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    (selectedApplicant.user?.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  )}
                </div>

                <div>
                  <h3 style={{ margin: 0 }}>
                    {selectedApplicant.user?.name || "Unknown Candidate"}
                  </h3>
                  <p style={{ margin: "6px 0", color: "#64748b" }}>
                    {selectedApplicant.user?.email || "No email"}
                  </p>
                  <p style={{ margin: 0, color: "#64748b" }}>
                    Applied {timeSince(selectedApplicant.createdAt)}
                  </p>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    value={selectedApplicant.profile?.phone || "Not provided"}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    value={selectedApplicant.profile?.location || "Not provided"}
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Preferred Field</label>
                  <input
                    value={selectedApplicant.profile?.preferredField || "Not provided"}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Desired Role</label>
                  <input
                    value={selectedApplicant.profile?.desiredRole || "Not provided"}
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Preferred Location</label>
                  <input
                    value={
                      selectedApplicant.profile?.preferredLocation || "Not provided"
                    }
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Professional Summary</label>
                  <textarea
                    value={selectedApplicant.profile?.bio || "No summary provided"}
                    readOnly
                    rows={4}
                  />
                </div>
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input
                    value={selectedApplicant.profile?.linkedin || "Not provided"}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>GitHub</label>
                  <input
                    value={selectedApplicant.profile?.github || "Not provided"}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Portfolio</label>
                  <input
                    value={selectedApplicant.profile?.portfolio || "Not provided"}
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Skills</label>
                  <div className="skill-tags">
                    {selectedApplicant.profile?.skills?.length > 0 ? (
                      selectedApplicant.profile.skills.map((skill, i) => (
                        <span key={i} className="tag mandatory">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p style={{ color: "#64748b", margin: 0 }}>
                        No skills added
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Education</label>
                  {selectedApplicant.profile?.education?.length > 0 ? (
                    selectedApplicant.profile.education.map((edu, index) => (
                      <div
                        key={index}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "12px",
                          marginBottom: "10px",
                          background: "#f8fafc"
                        }}
                      >
                        <strong>{edu.degree || "Not provided"}</strong>
                        <div>{edu.fieldOfStudy || ""}</div>
                        <div>{edu.university || ""}</div>
                        <div style={{ color: "#64748b", fontSize: "0.88rem" }}>
                          {edu.startYear || ""}{" "}
                          {edu.startYear || edu.endYear ? "-" : ""}{" "}
                          {edu.endYear || ""}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#64748b", margin: 0 }}>
                      No education added
                    </p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Experience</label>
                  {selectedApplicant.profile?.experience?.length > 0 ? (
                    selectedApplicant.profile.experience.map((exp, index) => (
                      <div
                        key={index}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "12px",
                          marginBottom: "10px",
                          background: "#f8fafc"
                        }}
                      >
                        <strong>{exp.title || "Not provided"}</strong>
                        <div>{exp.company || ""}</div>
                        <div style={{ color: "#64748b", fontSize: "0.88rem" }}>
                          {exp.duration || ""}
                        </div>
                        <div style={{ marginTop: "6px" }}>
                          {exp.description || ""}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#64748b", margin: 0 }}>
                      No experience added
                    </p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Courses / Certifications</label>
                  {selectedApplicant.profile?.courses?.length > 0 ? (
                    <div className="skill-tags">
                      {selectedApplicant.profile.courses.map((course, index) => (
                        <span key={index} className="tag preferred">
                          {course.courseName}
                          {course.issuedBy ? ` — ${course.issuedBy}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#64748b", margin: 0 }}>
                      No courses added
                    </p>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Cover Letter</label>
                  <textarea
                    value={selectedApplicant.coverLetter || "No cover letter provided"}
                    readOnly
                    rows={6}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setSelectedApplicant(null)}
              >
                Close
              </button>

              <button
                className="post-btn"
                onClick={() => {
                  setSelectedApplicant(null);
                  openInterviewModal(selectedApplicant);
                }}
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateInterview
        isOpen={showInterviewModal}
        onClose={closeInterviewModal}
        onSuccess={fetchApplicants}
        initialCandidateId={getCandidateProfileId(selectedApplicationForInterview)}
        initialJobId={job?._id || ""}
        candidateName={selectedApplicationForInterview?.user?.name || ""}
        jobTitle={job?.title || ""}
      />
    </div>
  );
}