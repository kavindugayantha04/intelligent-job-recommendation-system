import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api.js";

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function validateCvFile(file) {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowed.includes(file.type) && !/\.(pdf|doc|docx)$/i.test(file.name)) {
    return false;
  }

  if (file.size > 5 * 1024 * 1024) {
    return false;
  }

  return true;
}

function validatePreferences({ field, role, location }) {
  const errors = {};

  const cleanField = field.trim();
  const cleanRole = role.trim();
  const cleanLocation = location.trim();

  if (!cleanField) {
    errors.field = "Preferred field / industry is required.";
  } else if (cleanField.length < 2) {
    errors.field = "Preferred field must be at least 2 characters.";
  } else if (cleanField.length > 50) {
    errors.field = "Preferred field cannot exceed 50 characters.";
  }

  if (!cleanRole) {
    errors.role = "Desired role / job title is required.";
  } else if (cleanRole.length < 2) {
    errors.role = "Desired role must be at least 2 characters.";
  } else if (cleanRole.length > 50) {
    errors.role = "Desired role cannot exceed 50 characters.";
  }

  if (!cleanLocation) {
    errors.location = "Preferred location is required.";
  } else if (cleanLocation.length < 2) {
    errors.location = "Preferred location must be at least 2 characters.";
  } else if (cleanLocation.length > 50) {
    errors.location = "Preferred location cannot exceed 50 characters.";
  }

  return errors;
}

function UserCard({ user, initials, roleBadgeClass, profilePictureUrl }) {
  return (
    <div className="card profile-header-card">
      <div className="profile-avatar profile-avatar-image">
        {profilePictureUrl ? (
          <img src={profilePictureUrl} alt="Profile" className="profile-avatar-img" />
        ) : (
          initials
        )}
      </div>

      <div>
        <div className="profile-header-name">{user ? user.name : "Loading..."}</div>
        <div className="profile-header-email">{user ? user.email : ""}</div>
        <div className="profile-header-meta">
          <span className={roleBadgeClass}>
            {user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function CvSection({
  hasCv,
  cvPath,
  cvError,
  cvSuccess,
  cvFile,
  cvUploading,
  onPickFile,
  onDropFile,
  onUpload,
  onClearFile,
  onOpenUpdate,
  onDelete,
}) {
  return (
    <div className="card cv-upload-card">
      <div className="cv-upload-card__top">
        <div className="cv-upload-card__icon-wrap" aria-hidden="true">
          📄
        </div>
        <div className="cv-upload-card__intro">
          <h2 className="cv-upload-card__title">Resume / CV</h2>
          <p className="cv-upload-card__hint">
            {hasCv
              ? "Your file is saved — we use it for applications and smarter job matching."
              : "Upload a PDF or Word file once. You can replace or remove it anytime."}
          </p>
        </div>
      </div>

      {cvError && <div className="alert alert-error show">{cvError}</div>}
      {cvSuccess && <div className="alert alert-success show">{cvSuccess}</div>}

      {hasCv && (
        <div className="cv-upload-card__body cv-upload-card__body--has-file">
          <div className="cv-file-chip">
            <div className="cv-file-chip__badge">✓</div>
            <div className="cv-file-chip__meta">
              <span className="cv-file-chip__label">Current file</span>
              <span className="cv-file-chip__name">{cvPath}</span>
            </div>
          </div>
          <div className="cv-upload-card__actions">
            <button className="btn btn-primary btn-sm" type="button" onClick={onOpenUpdate}>
              Update CV
            </button>
            <button className="btn btn-danger btn-sm" type="button" onClick={onDelete}>
              Delete CV
            </button>
          </div>
        </div>
      )}

      {!hasCv && (
        <label
          className="cv-upload-dropzone"
          htmlFor="cv-file-input"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) onDropFile(file);
          }}
        >
          <span className="cv-upload-dropzone__emoji" aria-hidden="true">
            📄
          </span>
          <span className="cv-upload-dropzone__title">
            Drop your CV here or click to browse
          </span>
          <span className="cv-upload-dropzone__sub">
            PDF or Word (.pdf, .doc, .docx) — max 5MB
          </span>

          <input
            type="file"
            id="cv-file-input"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickFile(file);
            }}
          />
        </label>
      )}

      {!hasCv && cvFile && (
        <div className="cv-upload-pending-row">
          <span>{cvFile.name}</span>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={onUpload}
            disabled={cvUploading}
          >
            {cvUploading ? "Uploading..." : "Upload"}
          </button>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={onClearFile}
            disabled={cvUploading}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function PreferencesForm({
  prefField,
  prefRole,
  prefLocation,
  prefSaving,
  prefError,
  prefSuccess,
  fieldError,
  roleError,
  locationError,
  onChangeField,
  onChangeRole,
  onChangeLocation,
  onSave,
}) {
  return (
    <div className="card">
      <div className="section-title">Job Preferences</div>

      {prefError && <div className="alert alert-error show">{prefError}</div>}
      {prefSuccess && <div className="alert alert-success show">{prefSuccess}</div>}

      <div className="form-group">
        <label>Preferred Field / Industry</label>
        <input
          value={prefField}
          onChange={(e) => onChangeField(e.target.value)}
          placeholder="e.g. Data Science"
        />
        {fieldError && <small className="field-error">{fieldError}</small>}
      </div>

      <div className="form-group">
        <label>Desired Role / Job Title</label>
        <input
          value={prefRole}
          onChange={(e) => onChangeRole(e.target.value)}
          placeholder="e.g. Data Analyst Intern"
        />
        {roleError && <small className="field-error">{roleError}</small>}
      </div>

      <div className="form-group">
        <label>Preferred Location</label>
        <input
          value={prefLocation}
          onChange={(e) => onChangeLocation(e.target.value)}
          placeholder="e.g. Colombo"
        />
        {locationError && <small className="field-error">{locationError}</small>}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" type="button" onClick={onSave} disabled={prefSaving}>
          {prefSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

function UpdateCvModal({
  open,
  updateUploading,
  updateError,
  updateSuccess,
  updateFile,
  onClose,
  onPickFile,
  onClearFile,
  onUpdate,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay open">
      <div className="modal" style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <h3 className="modal-title">Update CV</h3>
          <button className="modal-close" onClick={() => !updateUploading && onClose()}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {updateError && <div className="alert alert-error show">{updateError}</div>}
          {updateSuccess && <div className="alert alert-success show">{updateSuccess}</div>}

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickFile(file);
            }}
          />

          {updateFile && (
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-outline"
                type="button"
                onClick={onClearFile}
                disabled={updateUploading}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                type="button"
                onClick={onUpdate}
                disabled={updateUploading}
              >
                {updateUploading ? "Updating..." : "Update"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileSettings() {
  const [user, setUserState] = useState(null);
  const [initials, setInitials] = useState("?");
  const [roleBadgeClass, setRoleBadgeClass] = useState("badge");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  const [cvPath, setCvPath] = useState("");
  const [hasCv, setHasCv] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvError, setCvError] = useState("");
  const [cvSuccess, setCvSuccess] = useState("");

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateFile, setUpdateFile] = useState(null);
  const [updateUploading, setUpdateUploading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  const [prefField, setPrefField] = useState("");
  const [prefRole, setPrefRole] = useState("");
  const [prefLocation, setPrefLocation] = useState("");
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState("");
  const [prefSuccess, setPrefSuccess] = useState("");

  const [fieldError, setFieldError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    const u = getUser();

    if (u) {
      setUserState(u);

      const init = (u.name || "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      setInitials(init || "?");
      setRoleBadgeClass(
        "badge " + (u.role === "recruiter" ? "badge-shortlisted" : "badge-reviewing")
      );
    }

    loadProfileData();
  }, []);

  async function loadProfileData() {
    try {
      const profileData = await api.getProfile();

      if (profileData?.user) {
        setUserState(profileData.user);
        localStorage.setItem("user", JSON.stringify(profileData.user));

        const init = (profileData.user.name || "")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        setInitials(init || "?");
        setRoleBadgeClass(
          "badge " +
            (profileData.user.role === "recruiter" ? "badge-shortlisted" : "badge-reviewing")
        );
      }

      if (profileData?.profile?.profilePicture) {
        setProfilePictureUrl(`http://localhost:5000/${profileData.profile.profilePicture}`);
      } else {
        setProfilePictureUrl("");
      }

      const prefData = await api.getPrefs();
      const p = prefData?.data?.preferences || {};

      setPrefField(p.field || "");
      setPrefRole(p.role || "");
      setPrefLocation(p.location || "");

      if (prefData?.data?.resume) {
        setCvPath(prefData.data.resume);
        setHasCv(true);
      } else {
        setCvPath("");
        setHasCv(false);
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
    }
  }

  const uploadAllowed = useMemo(() => !!cvFile && validateCvFile(cvFile), [cvFile]);
  const updateAllowed = useMemo(() => !!updateFile && validateCvFile(updateFile), [updateFile]);

  async function handleUploadCv() {
    if (!cvFile) {
      setCvError("Please select a file.");
      return;
    }

    if (!uploadAllowed) {
      setCvError("Only PDF/DOC/DOCX under 5MB allowed.");
      return;
    }

    setCvError("");
    setCvSuccess("");
    setCvUploading(true);

    try {
      const formData = new FormData();
      formData.append("cv", cvFile);

      const res = await api.uploadCV(formData);

      if (!res || res.error) {
        throw new Error(res?.message || "Upload failed.");
      }

      const newCvPath = res?.data?.cvPath || cvFile.name;

      setCvPath(newCvPath);
      setHasCv(true);
      setCvSuccess("✓ CV uploaded successfully!");
      setCvFile(null);
    } catch (e) {
      setCvError(e.message || "Upload failed.");
    } finally {
      setCvUploading(false);
    }
  }

  async function handleUpdateCv() {
    if (!updateFile) {
      setUpdateError("Please select a file.");
      return;
    }

    if (!updateAllowed) {
      setUpdateError("Only PDF/DOC/DOCX under 5MB allowed.");
      return;
    }

    setUpdateError("");
    setUpdateSuccess("");
    setUpdateUploading(true);

    try {
      const formData = new FormData();
      formData.append("cv", updateFile);

      const res = await api.updateCV(formData);

      if (!res || res.error) {
        throw new Error(res?.message || "Update failed.");
      }

      const newCvPath = res?.data?.cvPath || updateFile.name;

      setCvPath(newCvPath);
      setHasCv(true);
      setUpdateSuccess("✓ CV updated successfully!");
      setUpdateFile(null);

      setTimeout(() => {
        setUpdateModalOpen(false);
        setUpdateSuccess("");
      }, 1000);
    } catch (e) {
      setUpdateError(e.message || "Update failed.");
    } finally {
      setUpdateUploading(false);
    }
  }

  async function handleDeleteCv() {
    if (!window.confirm("Are you sure you want to delete your CV?")) return;

    setCvError("");
    setCvSuccess("");

    try {
      const res = await api.deleteCV();

      if (!res || res.error) {
        throw new Error(res?.message || "Delete failed.");
      }

      setCvPath("");
      setHasCv(false);
      setCvFile(null);
      setCvSuccess("✓ CV deleted successfully!");

      // Also clear any cached recommendation / parsed-CV data so the
      // Recommended Jobs page and the Courses page (skill gaps) do
      // not show stale cards if the user navigates there immediately
      // after deleting the CV.
      try {
        const keys = [
          "recommendations",
          "recommendedJobs",
          "parsedCV",
          "parsedCvText",
          "resumeText",
          "aiRecommendations",
          // skill-gap caches (in case any future code path stores them)
          "missingSkills",
          "skillGaps",
          "courseSkillGaps",
          "candidateSkills",
        ];
        keys.forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
      } catch {
        /* ignore storage errors */
      }
    } catch (e) {
      setCvError(e.message || "Delete failed.");
    }
  }

  async function handleSavePrefs() {
    setPrefError("");
    setPrefSuccess("");
    setFieldError("");
    setRoleError("");
    setLocationError("");

    const errors = validatePreferences({
      field: prefField,
      role: prefRole,
      location: prefLocation,
    });

    if (Object.keys(errors).length > 0) {
      setFieldError(errors.field || "");
      setRoleError(errors.role || "");
      setLocationError(errors.location || "");
      return;
    }

    setPrefSaving(true);

    try {
      const res = await api.updatePrefs({
        field: prefField.trim(),
        role: prefRole.trim(),
        location: prefLocation.trim(),
      });

      if (!res?.success) {
        throw new Error(res?.message || "Failed to save preferences.");
      }

      setPrefSuccess("✓ Preferences saved!");
      setTimeout(() => setPrefSuccess(""), 3000);
    } catch (e) {
      setPrefError(e.message || "Failed to save preferences.");
    } finally {
      setPrefSaving(false);
    }
  }

  return (
    <>
      <UserCard
        user={user}
        initials={initials}
        roleBadgeClass={roleBadgeClass}
        profilePictureUrl={profilePictureUrl}
      />

      <CvSection
        hasCv={hasCv}
        cvPath={cvPath}
        cvError={cvError}
        cvSuccess={cvSuccess}
        cvFile={cvFile}
        cvUploading={cvUploading}
        onPickFile={(file) => {
          if (!validateCvFile(file)) {
            setCvError("Only PDF/DOC/DOCX under 5MB allowed.");
            setCvFile(null);
            return;
          }

          setCvError("");
          setCvSuccess("");
          setCvFile(file);
        }}
        onDropFile={(file) => {
          if (!validateCvFile(file)) {
            setCvError("Only PDF/DOC/DOCX under 5MB allowed.");
            setCvFile(null);
            return;
          }

          setCvError("");
          setCvSuccess("");
          setCvFile(file);
        }}
        onUpload={handleUploadCv}
        onClearFile={() => {
          setCvFile(null);
          setCvError("");
        }}
        onOpenUpdate={() => {
          setUpdateModalOpen(true);
          setUpdateFile(null);
          setUpdateError("");
          setUpdateSuccess("");
        }}
        onDelete={handleDeleteCv}
      />

      <PreferencesForm
        prefField={prefField}
        prefRole={prefRole}
        prefLocation={prefLocation}
        prefSaving={prefSaving}
        prefError={prefError}
        prefSuccess={prefSuccess}
        fieldError={fieldError}
        roleError={roleError}
        locationError={locationError}
        onChangeField={setPrefField}
        onChangeRole={setPrefRole}
        onChangeLocation={setPrefLocation}
        onSave={handleSavePrefs}
      />

      <UpdateCvModal
        open={updateModalOpen}
        updateUploading={updateUploading}
        updateError={updateError}
        updateSuccess={updateSuccess}
        updateFile={updateFile}
        onClose={() => setUpdateModalOpen(false)}
        onPickFile={(file) => {
          if (!validateCvFile(file)) {
            setUpdateError("Only PDF/DOC/DOCX under 5MB allowed.");
            setUpdateFile(null);
            return;
          }

          setUpdateError("");
          setUpdateSuccess("");
          setUpdateFile(file);
        }}
        onClearFile={() => {
          setUpdateFile(null);
          setUpdateError("");
        }}
        onUpdate={handleUpdateCv}
      />
    </>
  );
}