import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRecruiterProfileApi,
  updateRecruiterProfileApi,
  changeRecruiterPasswordApi
} from "../api/recruiterProfileApi";

function RecruiterProfile() {
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getRecruiterProfileApi();

        setProfileForm({
          name: res.data.name || "",
          email: res.data.email || ""
        });
      } catch (error) {
        console.log(error);
        setErrorMessage(
          error.response?.data?.message || "Failed to load recruiter profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const initials = useMemo(() => {
    return (profileForm.name || "R")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [profileForm.name]);

  const validateProfileForm = () => {
    const errors = {};
    const trimmedName = profileForm.name.trim();
    const trimmedEmail = profileForm.email.trim().toLowerCase();

    if (!trimmedName) {
      errors.name = "Name is required.";
    } else if (trimmedName.length < 3) {
      errors.name = "Name must be at least 3 characters long.";
    }

    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      errors.currentPassword = "Current password is required.";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters long.";
    } else if (!/(?=.*[a-z])/.test(newPassword)) {
      errors.newPassword = "Password must contain at least one lowercase letter.";
    } else if (!/(?=.*[A-Z])/.test(newPassword)) {
      errors.newPassword = "Password must contain at least one uppercase letter.";
    } else if (!/(?=.*\d)/.test(newPassword)) {
      errors.newPassword = "Password must contain at least one number.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm the new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = "New password must be different from current password.";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setProfileMessage("");
    setErrorMessage("");

    setProfileErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setPasswordMessage("");
    setErrorMessage("");

    setPasswordErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setProfileMessage("");
    setErrorMessage("");

    if (!validateProfileForm()) return;

    try {
      setProfileSaving(true);

      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim().toLowerCase()
      };

      const res = await updateRecruiterProfileApi(payload);

      setProfileMessage(res.data.message || "Profile updated successfully.");

      if (res.data.recruiter) {
        const currentUser = JSON.parse(localStorage.getItem("user")) || {};
        const updatedUser = {
          ...currentUser,
          name: res.data.recruiter.name,
          email: res.data.recruiter.email,
          role: res.data.recruiter.role
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.log(error);
      setErrorMessage(
        error.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setErrorMessage("");

    if (!validatePasswordForm()) return;

    try {
      setPasswordSaving(true);

      const res = await changeRecruiterPasswordApi(passwordForm);

      setPasswordMessage(res.data.message || "Password changed successfully.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordErrors({});
    } catch (error) {
      console.log(error);
      setErrorMessage(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <h2 style={{ margin: 0 }}>Loading recruiter profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Recruiter Profile</h1>
            <p style={styles.subtitle}>
              Manage your account details and security settings
            </p>
          </div>

          <button
            style={styles.backBtn}
            onClick={() => navigate("/recruiter-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>

        {errorMessage && <div style={styles.alertError}>{errorMessage}</div>}
        {profileMessage && <div style={styles.alertSuccess}>{profileMessage}</div>}
        {passwordMessage && <div style={styles.alertSuccess}>{passwordMessage}</div>}

        <div style={styles.profileBanner}>
          <div style={styles.avatar}>{initials}</div>

          <div>
            <h2 style={styles.bannerName}>{profileForm.name || "Recruiter"}</h2>
            <p style={styles.bannerEmail}>{profileForm.email || "No email"}</p>
            <span style={styles.roleBadge}>Recruiter Account</span>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Profile Information</h2>
            <p style={styles.cardText}>
              Update your display name and email address.
            </p>

            <form onSubmit={handleProfileSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  style={{
                    ...styles.input,
                    ...(profileErrors.name ? styles.inputError : {})
                  }}
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                />
                {profileErrors.name && (
                  <div style={styles.fieldError}>{profileErrors.name}</div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  style={{
                    ...styles.input,
                    ...(profileErrors.email ? styles.inputError : {})
                  }}
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                />
                {profileErrors.email && (
                  <div style={styles.fieldError}>{profileErrors.email}</div>
                )}
              </div>

              <button
                style={{
                  ...styles.primaryBtn,
                  ...(profileSaving ? styles.disabledBtn : {})
                }}
                type="submit"
                disabled={profileSaving}
              >
                {profileSaving ? "Saving Profile..." : "Save Profile"}
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Change Password</h2>
            <p style={styles.cardText}>
              Keep your account secure by using a strong password.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Current Password</label>
                <div style={styles.passwordWrap}>
                  <input
                    style={{
                      ...styles.input,
                      ...(passwordErrors.currentPassword ? styles.inputError : {})
                    }}
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    style={styles.toggleBtn}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <div style={styles.fieldError}>{passwordErrors.currentPassword}</div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <div style={styles.passwordWrap}>
                  <input
                    style={{
                      ...styles.input,
                      ...(passwordErrors.newPassword ? styles.inputError : {})
                    }}
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    style={styles.toggleBtn}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <div style={styles.fieldError}>{passwordErrors.newPassword}</div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <div style={styles.passwordWrap}>
                  <input
                    style={{
                      ...styles.input,
                      ...(passwordErrors.confirmPassword ? styles.inputError : {})
                    }}
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    style={styles.toggleBtn}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <div style={styles.fieldError}>{passwordErrors.confirmPassword}</div>
                )}
              </div>

              <div style={styles.passwordHint}>
                Password should be at least 8 characters and include uppercase,
                lowercase, and a number.
              </div>

              <button
                style={{
                  ...styles.primaryBtn,
                  ...(passwordSaving ? styles.disabledBtn : {})
                }}
                type="submit"
                disabled={passwordSaving}
              >
                {passwordSaving ? "Updating Password..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #eef4ff 0%, #f8fafc 100%)",
    padding: "32px 20px"
  },
  wrapper: {
    maxWidth: "1100px",
    margin: "0 auto"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px"
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "800",
    color: "#0f172a"
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#64748b",
    fontSize: "15px"
  },
  backBtn: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700"
  },
  profileBanner: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "#ffffff",
    padding: "22px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
    marginBottom: "24px"
  },
  avatar: {
    width: "78px",
    height: "78px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    fontWeight: "800"
  },
  bannerName: {
    margin: 0,
    color: "#0f172a",
    fontSize: "24px"
  },
  bannerEmail: {
    margin: "6px 0 10px 0",
    color: "#64748b"
  },
  roleBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: "12px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px"
  },
  card: {
    background: "#fff",
    padding: "26px",
    borderRadius: "18px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)"
  },
  loadingCard: {
    maxWidth: "600px",
    margin: "120px auto",
    background: "#fff",
    padding: "28px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)"
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "8px",
    color: "#0f172a"
  },
  cardText: {
    marginTop: 0,
    marginBottom: "18px",
    color: "#64748b",
    fontSize: "14px"
  },
  formGroup: {
    marginBottom: "14px"
  },
  label: {
    display: "block",
    marginBottom: "7px",
    fontWeight: "700",
    color: "#334155",
    fontSize: "14px"
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#fff"
  },
  inputError: {
    border: "1px solid #ef4444",
    backgroundColor: "#fef2f2"
  },
  passwordWrap: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  toggleBtn: {
    minWidth: "72px",
    padding: "12px 10px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#e2e8f0",
    cursor: "pointer",
    fontWeight: "700",
    color: "#334155"
  },
  primaryBtn: {
    width: "100%",
    padding: "13px 16px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#fff",
    fontWeight: "800",
    cursor: "pointer",
    marginTop: "8px"
  },
  disabledBtn: {
    opacity: 0.7,
    cursor: "not-allowed"
  },
  passwordHint: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "13px",
    marginBottom: "10px"
  },
  fieldError: {
    color: "#dc2626",
    fontSize: "12px",
    marginTop: "6px",
    fontWeight: "600"
  },
  alertError: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    padding: "12px 14px",
    borderRadius: "10px",
    marginBottom: "14px",
    fontWeight: "600"
  },
  alertSuccess: {
    backgroundColor: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    padding: "12px 14px",
    borderRadius: "10px",
    marginBottom: "14px",
    fontWeight: "600"
  }
};

export default RecruiterProfile;