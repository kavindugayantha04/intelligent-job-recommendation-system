import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/JobManagement.css";
import {
  getJobs,
  createJob,
  closeJobApi,
  updateJobApi,
  deleteJobApi
} from "../api/jobApi";

const emptyForm = {
  title: "",
  category: "",
  mandatorySkills: [],
  preferredSkills: [],
  experienceLevel: "",
  workType: "",
  salaryMin: "",
  salaryMax: "",
  deadline: "",
  description: ""
};

function JobManagement() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("All");
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [skillInput, setSkillInput] = useState("");
  const [preferredInput, setPreferredInput] = useState("");

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await getJobs();
      setJobs(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleChange = (e) => {
    setFormError("");
    setSuccessMessage("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getDeadlineText = (deadline) => {
    if (!deadline) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(deadline);
    end.setHours(0, 0, 0, 0);

    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires Today";
    if (diffDays === 1) return "Expires Tomorrow";

    return `Expires in ${diffDays} days`;
  };

  const isJobExpired = (deadline) => {
    if (!deadline) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    return deadlineDate < today;
  };

  const addSkill = (type) => {
    if (type === "mandatory") {
      const value = skillInput.trim();
      if (!value) return;

      if (formData.mandatorySkills.includes(value)) {
        setFormError("This mandatory skill is already added.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        mandatorySkills: [...prev.mandatorySkills, value]
      }));
      setSkillInput("");
      setFormError("");
    }

    if (type === "preferred") {
      const value = preferredInput.trim();
      if (!value) return;

      if (formData.preferredSkills.includes(value)) {
        setFormError("This preferred skill is already added.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        preferredSkills: [...prev.preferredSkills, value]
      }));
      setPreferredInput("");
      setFormError("");
    }
  };

  const removeSkill = (type, index) => {
    setFormData((prev) => {
      if (type === "mandatory") {
        return {
          ...prev,
          mandatorySkills: prev.mandatorySkills.filter((_, i) => i !== index)
        };
      }

      return {
        ...prev,
        preferredSkills: prev.preferredSkills.filter((_, i) => i !== index)
      };
    });
  };

  const openAddModal = () => {
    setEditingJob(null);
    setFormData(emptyForm);
    setSkillInput("");
    setPreferredInput("");
    setFormError("");
    setSuccessMessage("");
    setShowModal(true);
  };

  const openEditModal = (job) => {
    const expired = isJobExpired(job.deadline);
    const isLocked = expired || job.status === "Closed";

    if (isLocked) return;

    setEditingJob(job);
    setFormData({
      title: job.title || "",
      category: job.category || "",
      mandatorySkills: job.mandatorySkills || [],
      preferredSkills: job.preferredSkills || [],
      experienceLevel: job.experienceLevel || "",
      workType: job.workType || "",
      salaryMin: job.salaryMin || "",
      salaryMax: job.salaryMax || "",
      deadline: job.deadline ? job.deadline.slice(0, 10) : "",
      description: job.description || ""
    });
    setSkillInput("");
    setPreferredInput("");
    setFormError("");
    setSuccessMessage("");
    setShowModal(true);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Job title is required.";
    }

    if (formData.title.trim().length < 3) {
      return "Job title must be at least 3 characters long.";
    }

    if (!formData.category) {
      return "Please select a category.";
    }

    if (!formData.experienceLevel) {
      return "Please select an experience level.";
    }

    if (!formData.workType) {
      return "Please select a work type.";
    }

    if (!formData.deadline) {
      return "Please select an application deadline.";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDeadline = new Date(formData.deadline);
    selectedDeadline.setHours(0, 0, 0, 0);

    if (selectedDeadline < today) {
      return "Application deadline cannot be in the past.";
    }

    if (!formData.salaryMin || !formData.salaryMax) {
      return "Please enter both minimum and maximum salary.";
    }

    const min = Number(formData.salaryMin);
    const max = Number(formData.salaryMax);

    if (Number.isNaN(min) || Number.isNaN(max)) {
      return "Salary must be a valid number.";
    }

    if (min < 0 || max < 0) {
      return "Salary cannot be negative.";
    }

    if (min > max) {
      return "Minimum salary cannot be greater than maximum salary.";
    }

    if (formData.mandatorySkills.length === 0) {
      return "Please add at least one mandatory skill.";
    }

    if (!formData.description.trim()) {
      return "Job description is required.";
    }

    if (formData.description.trim().length < 20) {
      return "Job description must be at least 20 characters long.";
    }

    return "";
  };

  const handleSubmit = async () => {
    setFormError("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        salaryMin: Number(formData.salaryMin),
        salaryMax: Number(formData.salaryMax)
      };

      if (editingJob) {
        await updateJobApi(editingJob._id, payload);
        setSuccessMessage("Job updated successfully.");
      } else {
        await createJob(payload);
        setSuccessMessage("Job created successfully.");
      }

      await fetchJobs();

      setTimeout(() => {
        setShowModal(false);
        setEditingJob(null);
        setFormData(emptyForm);
        setSkillInput("");
        setPreferredInput("");
        setFormError("");
        setSuccessMessage("");
      }, 700);
    } catch (error) {
      console.error(error);
      setFormError(
        error.response?.data?.message ||
          "Something went wrong while saving the job."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeJob = async (id) => {
    try {
      const res = await closeJobApi(id);
      setJobs(jobs.map((job) => (job._id === id ? res.data : job)));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteJobApi(id);
      fetchJobs();
    } catch (error) {
      console.error(error);
    }
  };

  const goToApplicantsPage = (jobId) => {
    navigate(`/recruiter/job/${jobId}/applicants`);
  };

  const filteredJobs =
    filter === "All"
      ? jobs
      : jobs.filter((job) => {
          const expired = isJobExpired(job.deadline);

          if (filter === "Open") {
            return job.status === "Open" && !expired;
          }

          if (filter === "Closed") {
            return job.status === "Closed" || expired;
          }

          return true;
        });

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
          <li onClick={() => navigate("/dashboard")}>
            ◷ Interview Scheduling
          </li>
          <li onClick={() => navigate("/recruiter-profile")}>◉ Profile</li>
        </ul>
      </div>

      <div className="main-content">
        <div className="header">
          <div>
            <h1>Job Management</h1>
            <p className="header-sub">Add, edit and manage your job postings</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        <div className="job-actions">
          <button className="add-job-btn" onClick={openAddModal}>
            + Add New Job
          </button>

          <select
            className="filter-dropdown"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Jobs</option>
            <option value="Open">Open Jobs</option>
            <option value="Closed">Closed / Expired Jobs</option>
          </select>
        </div>

        <div className="jobs-grid">
          {filteredJobs.length === 0 ? (
            <div className="empty-state-card">
              <h3>No jobs found</h3>
              <p>
                No job postings match the selected filter. Add a new job to get
                started.
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const expired = isJobExpired(job.deadline);
              const isLocked = expired || job.status === "Closed";

              return (
                <div key={job._id} className="job-card">
                  <div className="job-card-left">
                    <div className="job-icon">💼</div>

                    <div className="job-card-body">
                      <h3>{job.title}</h3>

                      <div className="job-card-meta-row">
                        {job.category && (
                          <span className="meta-pill">📂 {job.category}</span>
                        )}
                        {job.experienceLevel && (
                          <span className="meta-pill">🎓 {job.experienceLevel}</span>
                        )}
                        {job.workType && (
                          <span className="meta-pill">📍 {job.workType}</span>
                        )}

                        {job.deadline && (
                          <span
                            className={`deadline-badge ${
                              expired ? "expired" : ""
                            }`}
                          >
                            ⏳ {getDeadlineText(job.deadline)}
                          </span>
                        )}

                        {job.mandatorySkills?.map((skill, i) => (
                          <span key={i} className="card-skill-tag mandatory">
                            {skill}
                          </span>
                        ))}

                        {job.preferredSkills?.map((skill, i) => (
                          <span key={i} className="card-skill-tag preferred">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <p className="job-description-preview">{job.description}</p>
                    </div>
                  </div>

                  <div className="job-card-right">
                    <span
                      className={`status-badge ${
                        isLocked ? "status-closed" : "status-open"
                      }`}
                    >
                      {isLocked ? "🔴 Closed" : "🟢 Open"}
                    </span>

                    <div
                      style={{
                        marginTop: "10px",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        color: "#334155"
                      }}
                    >
                      👥 {job.applicants || 0} Applicant
                      {(job.applicants || 0) !== 1 ? "s" : ""}
                    </div>

                    <button
                      type="button"
                      onClick={() => goToApplicantsPage(job._id)}
                      style={{
                        marginTop: "10px",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#0f172a",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      View Applicants
                    </button>

                    {!isLocked && (
                      <button
                        className="close-job-btn"
                        onClick={() => closeJob(job._id)}
                      >
                        Click to Close
                      </button>
                    )}

                    <div className="card-divider" />

                    <div className="action-buttons">
                      <button
                        className={`edit-btn ${isLocked ? "disabled-btn" : ""}`}
                        title={
                          isLocked
                            ? "Closed or expired jobs cannot be edited"
                            : "Edit Job"
                        }
                        onClick={() => openEditModal(job)}
                        disabled={isLocked}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="delete-btn"
                        title="Delete Job"
                        onClick={() => setDeleteConfirm(job._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>{editingJob ? "Edit Job" : "Add New Job"}</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {formError && <p className="form-message error">{formError}</p>}
              {successMessage && (
                <p className="form-message success">{successMessage}</p>
              )}

              <div className="form-row">
                <div className="form-group full">
                  <label>Job Title</label>
                  <input
                    name="title"
                    placeholder="e.g. Senior React Developer"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Select Category</option>
                    <option>IT</option>
                    <option>Marketing</option>
                    <option>Human Resources</option>
                    <option>Finance</option>
                  </select>
                </div>
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label>Experience Level</label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                  >
                    <option value="">Select Level</option>
                    <option>Junior</option>
                    <option>Mid</option>
                    <option>Senior</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Work Type</label>
                  <select
                    name="workType"
                    value={formData.workType}
                    onChange={handleChange}
                  >
                    <option value="">Select Type</option>
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>On-site</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Salary Min ($)</label>
                  <input
                    type="number"
                    name="salaryMin"
                    placeholder="e.g. 50000"
                    value={formData.salaryMin}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Salary Max ($)</label>
                  <input
                    type="number"
                    name="salaryMax"
                    placeholder="e.g. 90000"
                    value={formData.salaryMax}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Mandatory Skills</label>
                  <div className="skill-input-row">
                    <input
                      placeholder="Type a skill and click Add"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill("mandatory");
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="skill-add-btn"
                      onClick={() => addSkill("mandatory")}
                    >
                      Add
                    </button>
                  </div>

                  <div className="skill-tags">
                    {formData.mandatorySkills.map((skill, i) => (
                      <span
                        key={i}
                        className="tag mandatory"
                        onClick={() => removeSkill("mandatory", i)}
                      >
                        {skill} <span className="tag-remove">✕</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Preferred Skills</label>
                  <div className="skill-input-row">
                    <input
                      placeholder="Type a skill and click Add"
                      value={preferredInput}
                      onChange={(e) => setPreferredInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill("preferred");
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="skill-add-btn preferred"
                      onClick={() => addSkill("preferred")}
                    >
                      Add
                    </button>
                  </div>

                  <div className="skill-tags">
                    {formData.preferredSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="tag preferred"
                        onClick={() => removeSkill("preferred", i)}
                      >
                        {skill} <span className="tag-remove">✕</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Job Description</label>
                  <textarea
                    name="description"
                    placeholder="Describe the role, responsibilities, and requirements..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="post-btn"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingJob
                  ? "Save Changes"
                  : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setDeleteConfirm(null)
          }
        >
          <div className="confirm-modal">
            <div className="confirm-icon">🗑️</div>
            <h3>Delete this job?</h3>
            <p>
              This action cannot be undone. The job posting will be permanently
              removed.
            </p>
            <div className="confirm-actions">
              <button
                className="cancel-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>

              <button
                className="danger-btn"
                onClick={() => {
                  handleDelete(deleteConfirm);
                  setDeleteConfirm(null);
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobManagement;