import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";
import Footer from "../components/Footer";

import {
  getCandidateProfile,
  updateCandidateProfile,
  uploadProfilePicture,
  deleteCandidateAccount
} from "../api/candidateApi";

const BASE_URL = "http://localhost:5000";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `${BASE_URL}/${imagePath}`;
};

const validateImageFile = (file) => {
  if (!file) return false;

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const isValidType =
    allowed.includes(file.type) || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

  const isValidSize = file.size <= 5 * 1024 * 1024;

  return isValidType && isValidSize;
};

const emptyEducation = {
  degree: "",
  fieldOfStudy: "",
  university: "",
  startYear: "",
  endYear: ""
};

const emptyExperience = {
  title: "",
  company: "",
  duration: "",
  description: ""
};

const emptyCourse = {
  courseName: "",
  issuedBy: ""
};

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  linkedin: "",
  github: "",
  portfolio: "",
  password: "",
  confirmPassword: ""
};

const EditProfile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const [educationList, setEducationList] = useState([]);
  const [experienceList, setExperienceList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [courseList, setCourseList] = useState([]);

  const [skillInput, setSkillInput] = useState("");
  const [skillError, setSkillError] = useState("");

  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [courseError, setCourseError] = useState("");

  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  const [educationForm, setEducationForm] = useState(emptyEducation);
  const [experienceForm, setExperienceForm] = useState(emptyExperience);

  const [educationErrors, setEducationErrors] = useState({});
  const [experienceErrors, setExperienceErrors] = useState({});

  const [editingEducationIndex, setEditingEducationIndex] = useState(null);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState(null);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [pageMessage, setPageMessage] = useState({
    type: "",
    text: ""
  });

  const fieldRefs = useRef({});
  const saveSectionRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    if (storedUser) {
      setUser(storedUser);
    }

    loadCandidateProfile();
  }, [navigate]);

  const loadCandidateProfile = async () => {
    try {
      setLoading(true);

      const res = await getCandidateProfile();

      const profileData = res.data.profile || {};
      const userData = res.data.user || {};

      setProfile(profileData);

      if (userData) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }

      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: profileData.phone || "",
        location: profileData.location || "",
        bio: profileData.bio || "",
        linkedin: profileData.linkedin || "",
        github: profileData.github || "",
        portfolio: profileData.portfolio || "",
        password: "",
        confirmPassword: ""
      });

      setEducationList(
        Array.isArray(profileData.education) ? profileData.education : []
      );

      setExperienceList(
        Array.isArray(profileData.experience) ? profileData.experience : []
      );

      setSkillsList(Array.isArray(profileData.skills) ? profileData.skills : []);

      setCourseList(
        Array.isArray(profileData.courses) ? profileData.courses : []
      );

      if (profileData?.profilePicture) {
        setImagePreview(getImageUrl(profileData.profilePicture));
      }
    } catch (error) {
      console.error("Failed to load candidate profile:", error);
      setPageMessage({
        type: "error",
        text: "Failed to load profile details."
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const avatarSrc = imagePreview || getImageUrl(profile?.profilePicture);

  const registerFieldRef = (name) => (el) => {
    if (el) fieldRefs.current[name] = el;
  };

  const scrollToField = (fieldName) => {
    const element = fieldRefs.current[fieldName];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof element.focus === "function") {
        element.focus();
      }
    } else if (saveSectionRef.current) {
      saveSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  };

  const getInputStyle = (fieldName) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: errors[fieldName] ? "1px solid #dc2626" : "1px solid #d1d5db",
    fontSize: "0.95rem",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box"
  });

  const getTextAreaStyle = (fieldName) => ({
    ...getInputStyle(fieldName),
    minHeight: "110px",
    resize: "vertical"
  });

  const getModalInputStyle = (hasError) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: hasError ? "1px solid #dc2626" : "1px solid #d1d5db",
    fontSize: "0.95rem",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box"
  });

  const labelStyle = {
    display: "block",
    fontWeight: 600,
    marginBottom: "0.45rem",
    fontSize: "0.92rem",
    color: "#111827"
  };

  const sectionTitleStyle = {
    fontWeight: 700,
    marginBottom: "1rem",
    fontSize: "1rem",
    color: "#111827"
  };

  const helperStyle = {
    fontSize: "0.8rem",
    color: "#6b7280",
    marginTop: "0.35rem"
  };

  const errorTextStyle = {
    fontSize: "0.8rem",
    color: "#dc2626",
    marginTop: "0.35rem"
  };

  const cardStyle = {
    marginBottom: "1.25rem",
    borderRadius: "20px",
    padding: "1.25rem",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e5e7eb",
    background: "#ffffff"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1rem"
  };

  const modalOverlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    zIndex: 9999
  };

  const modalCardStyle = {
    width: "100%",
    maxWidth: "650px",
    background: "#fff",
    borderRadius: "20px",
    padding: "1.25rem",
    boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
    maxHeight: "90vh",
    overflowY: "auto"
  };

  const actionButtonStyle = {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.88rem"
  };

  const messageStyle = (type) => ({
    padding: "12px 14px",
    borderRadius: "12px",
    marginBottom: "1rem",
    fontSize: "0.92rem",
    fontWeight: 500,
    border:
      type === "success"
        ? "1px solid #86efac"
        : "1px solid #fca5a5",
    background: type === "success" ? "#f0fdf4" : "#fef2f2",
    color: type === "success" ? "#166534" : "#b91c1c"
  });

  const validateUrl = (value) => {
    if (!value.trim()) return true;
    try {
      new URL(value.trim());
      return true;
    } catch {
      return false;
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return true;
    const cleanedPhone = phone.replace(/[\s()-]/g, "");
    return /^(?:\+94|0)\d{9}$/.test(cleanedPhone);
  };

  const validateYear = (year) => {
    if (!year.trim()) return true;
    if (year.trim().toLowerCase() === "present") return true;
    return /^(19|20)\d{2}$/.test(year);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Enter a valid phone number";
    }

    if (formData.bio.trim().length > 300) {
      newErrors.bio = "Summary cannot exceed 300 characters";
    }

    if (!validateUrl(formData.linkedin)) {
      newErrors.linkedin = "Enter a valid LinkedIn URL";
    }

    if (!validateUrl(formData.github)) {
      newErrors.github = "Enter a valid GitHub URL";
    }

    if (!validateUrl(formData.portfolio)) {
      newErrors.portfolio = "Enter a valid portfolio URL";
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password && !formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const validateEducationEntry = (entry) => {
    const newErrors = {};

    if (!entry.degree.trim()) {
      newErrors.degree = "Degree / Qualification is required";
    }

    if (!entry.university.trim()) {
      newErrors.university = "University / Institute is required";
    }

    if (!validateYear(entry.startYear)) {
      newErrors.startYear = "Enter a valid start year";
    }

    if (!validateYear(entry.endYear)) {
      newErrors.endYear = "Enter a valid end year or Present";
    }

    if (
      entry.startYear.trim() &&
      entry.endYear.trim() &&
      entry.endYear.trim().toLowerCase() !== "present" &&
      /^(19|20)\d{2}$/.test(entry.startYear.trim()) &&
      /^(19|20)\d{2}$/.test(entry.endYear.trim()) &&
      Number(entry.endYear.trim()) < Number(entry.startYear.trim())
    ) {
      newErrors.endYear = "End year cannot be before start year";
    }

    return newErrors;
  };

  const validateExperienceEntry = (entry) => {
    const newErrors = {};

    if (!entry.title.trim()) {
      newErrors.title = "Job title is required";
    }

    if (!entry.company.trim()) {
      newErrors.company = "Company / Organization is required";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));

    setPageMessage({
      type: "",
      text: ""
    });
  };

  const handleEducationFormChange = (e) => {
    const { name, value } = e.target;

    setEducationForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setEducationErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
  };

  const handleExperienceFormChange = (e) => {
    const { name, value } = e.target;

    setExperienceForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setExperienceErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
  };

  const handleCourseFormChange = (e) => {
    const { name, value } = e.target;

    setCourseForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setCourseError("");
  };

  const addSkill = () => {
    const cleanSkill = skillInput.trim();

    if (!cleanSkill) {
      setSkillError("Please enter a skill");
      return;
    }

    const exists = skillsList.some(
      (skill) => skill.toLowerCase() === cleanSkill.toLowerCase()
    );

    if (exists) {
      setSkillError("Skill already added");
      return;
    }

    setSkillsList((prev) => [...prev, cleanSkill]);
    setSkillInput("");
    setSkillError("");
  };

  const removeSkill = (index) => {
    setSkillsList((prev) => prev.filter((_, i) => i !== index));
  };

  const addCourse = () => {
    const courseName = courseForm.courseName.trim();
    const issuedBy = courseForm.issuedBy.trim();

    if (!courseName) {
      setCourseError("Course name is required");
      return;
    }

    setCourseList((prev) => [
      ...prev,
      {
        courseName,
        issuedBy
      }
    ]);

    setCourseForm(emptyCourse);
    setCourseError("");
  };

  const removeCourse = (index) => {
    setCourseList((prev) => prev.filter((_, i) => i !== index));
  };

  const openAddEducationModal = () => {
    setEducationForm(emptyEducation);
    setEducationErrors({});
    setEditingEducationIndex(null);
    setShowEducationModal(true);
  };

  const openEditEducationModal = (index) => {
    setEducationForm(educationList[index]);
    setEducationErrors({});
    setEditingEducationIndex(index);
    setShowEducationModal(true);
  };

  const saveEducationEntry = () => {
    const newErrors = validateEducationEntry(educationForm);
    setEducationErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    if (editingEducationIndex !== null) {
      const updated = [...educationList];
      updated[editingEducationIndex] = {
        ...educationForm
      };
      setEducationList(updated);
    } else {
      setEducationList((prev) => [...prev, { ...educationForm }]);
    }

    setEducationForm(emptyEducation);
    setEducationErrors({});
    setEditingEducationIndex(null);
    setShowEducationModal(false);
  };

  const deleteEducationEntry = (index) => {
    if (!window.confirm("Delete this education entry?")) return;
    setEducationList((prev) => prev.filter((_, i) => i !== index));
  };

  const openAddExperienceModal = () => {
    setExperienceForm(emptyExperience);
    setExperienceErrors({});
    setEditingExperienceIndex(null);
    setShowExperienceModal(true);
  };

  const openEditExperienceModal = (index) => {
    setExperienceForm(experienceList[index]);
    setExperienceErrors({});
    setEditingExperienceIndex(index);
    setShowExperienceModal(true);
  };

  const saveExperienceEntry = () => {
    const newErrors = validateExperienceEntry(experienceForm);
    setExperienceErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    if (editingExperienceIndex !== null) {
      const updated = [...experienceList];
      updated[editingExperienceIndex] = {
        ...experienceForm
      };
      setExperienceList(updated);
    } else {
      setExperienceList((prev) => [...prev, { ...experienceForm }]);
    }

    setExperienceForm(emptyExperience);
    setExperienceErrors({});
    setEditingExperienceIndex(null);
    setShowExperienceModal(false);
  };

  const deleteExperienceEntry = (index) => {
    if (!window.confirm("Delete this experience entry?")) return;
    setExperienceList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!validateImageFile(file)) {
      setImageError("Please upload JPG, PNG, or WEBP image under 5MB.");
      return;
    }

    setImage(file);
    setImageError("");

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadPicture = async () => {
    if (!image) {
      setImageError("Please select an image");
      return;
    }

    if (!validateImageFile(image)) {
      setImageError("Please upload JPG, PNG, or WEBP image under 5MB.");
      return;
    }

    try {
      setUploadingImage(true);
      setImageError("");
      setPageMessage({ type: "", text: "" });

      const res = await uploadProfilePicture(image);
      const savedPath = res.data.profilePicture;

      if (savedPath) {
        const updatedProfile = {
          ...profile,
          profilePicture: savedPath
        };

        setProfile(updatedProfile);
        setImagePreview(getImageUrl(savedPath));
      }

      setImage(null);
      setPageMessage({
        type: "success",
        text: "Profile picture uploaded successfully."
      });
    } catch (error) {
      console.error(error);
      setPageMessage({
        type: "error",
        text: "Failed to upload image."
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const updateProfile = async () => {
    setPageMessage({ type: "", text: "" });

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];
      setPageMessage({
        type: "error",
        text: "Please correct the highlighted fields before saving."
      });
      scrollToField(firstErrorField);
      return;
    }

    try {
      setSavingProfile(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
        linkedin: formData.linkedin.trim(),
        github: formData.github.trim(),
        portfolio: formData.portfolio.trim(),
        education: educationList,
        experience: experienceList,
        skills: skillsList,
        courses: courseList
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await updateCandidateProfile(payload);

      const updatedUser = res.data.user || user;
      const updatedProfile = res.data.profile || payload;

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfile((prev) => ({
        ...prev,
        ...updatedProfile
      }));

      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));

      setErrors((prev) => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));

      setPageMessage({
        type: "success",
        text: "Profile updated successfully."
      });

      if (saveSectionRef.current) {
        saveSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    } catch (error) {
      console.error(error);
      setPageMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to update profile."
      });

      if (saveSectionRef.current) {
        saveSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account permanently?")) return;

    try {
      await deleteCandidateAccount();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } catch (error) {
      console.error(error);
      setPageMessage({
        type: "error",
        text: "Failed to delete account."
      });
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <div className="container">User not found.</div>;

  return (
    <>
      <UserNavbar />

      <div
        className="container"
        style={{
          maxWidth: "1100px",
          paddingTop: "1.25rem",
          paddingBottom: "2rem"
        }}
      >
        <div className="page-header" style={{ marginBottom: "1.25rem" }}>
          <h1>Edit Profile</h1>
          <p>Update your professional profile details.</p>
        </div>

        <div
          className="edit-profile-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
            gap: "1.25rem",
            alignItems: "start"
          }}
        >
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={cardStyle} className="profile-card-hover">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "0.85rem"
                }}
              >
                <div
                  className="profile-avatar"
                  style={{
                    width: "110px",
                    height: "110px",
                    borderRadius: "999px",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    background: "#eef2ff",
                    color: "#1f2937",
                    fontWeight: 700,
                    fontSize: "1.4rem"
                  }}
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: "#111827",
                      wordBreak: "break-word"
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "0.92rem",
                      wordBreak: "break-all"
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            <div style={cardStyle} className="profile-card-hover">
              <p style={sectionTitleStyle}>Profile Picture</p>

              <label
                htmlFor="avatarUpload"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  padding: "12px 14px",
                  border: imageError ? "1px dashed #dc2626" : "1px dashed #cbd5e1",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  fontSize: "0.9rem",
                  color: "#475569",
                  marginBottom: "0.8rem",
                  flexWrap: "wrap"
                }}
              >
                <span>📁</span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {image ? image.name : "Choose a JPG, PNG, or WEBP image"}
                </span>
              </label>

              <input
                id="avatarUpload"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />

              <p style={{ ...helperStyle, marginBottom: "0.9rem" }}>
                Maximum size: 5MB
              </p>
              {imageError && <p style={errorTextStyle}>{imageError}</p>}

              <button
                className="btn btn-primary"
                onClick={handleUploadPicture}
                style={{ width: "100%" }}
                disabled={uploadingImage}
              >
                {uploadingImage ? "Uploading..." : "Upload Picture"}
              </button>
            </div>

            <div style={cardStyle} className="profile-card-hover">
              <p
                style={{
                  ...sectionTitleStyle,
                  color: "#dc2626",
                  marginBottom: "0.5rem"
                }}
              >
                Danger Zone
              </p>
              <p style={{ ...helperStyle, marginBottom: "0.9rem" }}>
                Once deleted, your account cannot be recovered.
              </p>
              <button
                className="btn btn-danger"
                onClick={deleteAccount}
                style={{ width: "100%" }}
              >
                Delete Account
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={cardStyle} className="profile-card-hover">
              <p style={sectionTitleStyle}>Basic Information</p>

              <div style={gridStyle}>
                <div className="form-group">
                  <label style={labelStyle}>Full Name</label>
                  <input
                    ref={registerFieldRef("name")}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={getInputStyle("name")}
                    className="edit-profile-input"
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p style={errorTextStyle}>{errors.name}</p>}
                </div>

                <div className="form-group">
                  <label style={labelStyle}>Email</label>
                  <input
                    ref={registerFieldRef("email")}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={getInputStyle("email")}
                    className="edit-profile-input"
                    placeholder="Enter your email"
                  />
                  {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    ref={registerFieldRef("phone")}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={getInputStyle("phone")}
                    className="edit-profile-input"
                    placeholder="e.g. +94 77 123 4567"
                  />
                  {errors.phone && <p style={errorTextStyle}>{errors.phone}</p>}
                </div>

                <div className="form-group">
                  <label style={labelStyle}>Location</label>
                  <input
                    ref={registerFieldRef("location")}
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    style={getInputStyle("location")}
                    className="edit-profile-input"
                    placeholder="e.g. Colombo, Sri Lanka"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label style={labelStyle}>Professional Summary</label>
                <textarea
                  ref={registerFieldRef("bio")}
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  style={getTextAreaStyle("bio")}
                  className="edit-profile-input"
                  placeholder="Write a short summary about yourself"
                />
                <p style={helperStyle}>
                  Keep it short and professional. Max 300 characters.
                </p>
                {errors.bio && <p style={errorTextStyle}>{errors.bio}</p>}
              </div>
            </div>

            <div style={cardStyle} className="profile-card-hover">
              <p style={sectionTitleStyle}>Professional Links</p>

              <div style={gridStyle}>
                <div className="form-group">
                  <label style={labelStyle}>LinkedIn URL</label>
                  <input
                    ref={registerFieldRef("linkedin")}
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    style={getInputStyle("linkedin")}
                    className="edit-profile-input"
                    placeholder="https://www.linkedin.com/in/your-profile"
                  />
                  {errors.linkedin && (
                    <p style={errorTextStyle}>{errors.linkedin}</p>
                  )}
                </div>

                <div className="form-group">
                  <label style={labelStyle}>GitHub URL</label>
                  <input
                    ref={registerFieldRef("github")}
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    style={getInputStyle("github")}
                    className="edit-profile-input"
                    placeholder="https://github.com/yourusername"
                  />
                  {errors.github && (
                    <p style={errorTextStyle}>{errors.github}</p>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label style={labelStyle}>Portfolio URL</label>
                <input
                  ref={registerFieldRef("portfolio")}
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  style={getInputStyle("portfolio")}
                  className="edit-profile-input"
                  placeholder="https://yourportfolio.com"
                />
                {errors.portfolio && (
                  <p style={errorTextStyle}>{errors.portfolio}</p>
                )}
              </div>
            </div>

            <div style={cardStyle} className="profile-card-hover">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap"
                }}
              >
                <p style={{ ...sectionTitleStyle, marginBottom: 0 }}>Education</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddEducationModal}
                >
                  + Add Education
                </button>
              </div>

              {educationList.length === 0 ? (
                <p className="empty-profile-note">No education entries added yet.</p>
              ) : (
                educationList.map((item, index) => (
                  <div key={index} className="profile-item-card">
                    <div className="profile-item-title">
                      {item.degree || "Untitled Education"}
                    </div>
                    <div className="profile-item-sub">{item.fieldOfStudy}</div>
                    <div className="profile-item-sub">{item.university}</div>
                    <div className="profile-item-meta">
                      {item.startYear} {item.startYear || item.endYear ? " - " : ""}
                      {item.endYear}
                    </div>

                    <div className="profile-item-actions">
                      <button
                        type="button"
                        style={actionButtonStyle}
                        onClick={() => openEditEducationModal(index)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={actionButtonStyle}
                        onClick={() => deleteEducationEntry(index)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={cardStyle} className="profile-card-hover">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap"
                }}
              >
                <p style={{ ...sectionTitleStyle, marginBottom: 0 }}>Experience</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddExperienceModal}
                >
                  + Add Experience
                </button>
              </div>

              {experienceList.length === 0 ? (
                <p className="empty-profile-note">No experience entries added yet.</p>
              ) : (
                experienceList.map((item, index) => (
                  <div key={index} className="profile-item-card">
                    <div className="profile-item-title">
                      {item.title || "Untitled Experience"}
                    </div>
                    <div className="profile-item-sub">{item.company}</div>
                    <div className="profile-item-meta">{item.duration}</div>
                    <div
                      className="profile-item-sub"
                      style={{ marginBottom: "0.75rem" }}
                    >
                      {item.description}
                    </div>

                    <div className="profile-item-actions">
                      <button
                        type="button"
                        style={actionButtonStyle}
                        onClick={() => openEditExperienceModal(index)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={actionButtonStyle}
                        onClick={() => deleteExperienceEntry(index)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={cardStyle} className="profile-card-hover">
              <p style={sectionTitleStyle}>Skills</p>

              <div className="tag-input-row">
                <div className="form-group tag-input-grow">
                  <label style={labelStyle}>Skill</label>
                  <input
                    value={skillInput}
                    onChange={(e) => {
                      setSkillInput(e.target.value);
                      setSkillError("");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: skillError ? "1px solid #dc2626" : "1px solid #d1d5db",
                      fontSize: "0.95rem",
                      outline: "none",
                      background: "#fff",
                      boxSizing: "border-box"
                    }}
                    className="edit-profile-input"
                    placeholder="Type one skill"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  {skillError && <p style={errorTextStyle}>{skillError}</p>}
                </div>

                <div>
                  <button
                    type="button"
                    className="add-small-btn"
                    onClick={addSkill}
                  >
                    + Add Skill
                  </button>
                </div>
              </div>

              <div className="tag-list">
                {skillsList.length === 0 ? (
                  <p className="empty-profile-note">No skills added yet.</p>
                ) : (
                  skillsList.map((skill, index) => (
                    <span key={index} className="profile-tag">
                      <span className="profile-tag-text">{skill}</span>
                      <button
                        type="button"
                        className="remove-tag-btn"
                        onClick={() => removeSkill(index)}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div style={cardStyle} className="profile-card-hover">
              <p style={sectionTitleStyle}>Courses / Certifications</p>

              <div style={gridStyle}>
                <div className="form-group">
                  <label style={labelStyle}>Course Name</label>
                  <input
                    name="courseName"
                    value={courseForm.courseName}
                    onChange={handleCourseFormChange}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border:
                        courseError && !courseForm.courseName.trim()
                          ? "1px solid #dc2626"
                          : "1px solid #d1d5db",
                      fontSize: "0.95rem",
                      outline: "none",
                      background: "#fff",
                      boxSizing: "border-box"
                    }}
                    className="edit-profile-input"
                    placeholder="e.g. Power BI Fundamentals"
                  />
                </div>

                <div className="form-group">
                  <label style={labelStyle}>Issued By</label>
                  <input
                    name="issuedBy"
                    value={courseForm.issuedBy}
                    onChange={handleCourseFormChange}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid #d1d5db",
                      fontSize: "0.95rem",
                      outline: "none",
                      background: "#fff",
                      boxSizing: "border-box"
                    }}
                    className="edit-profile-input"
                    placeholder="e.g. Microsoft"
                  />
                </div>
              </div>

              {courseError && <p style={errorTextStyle}>{courseError}</p>}

              <div style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="add-small-btn"
                  onClick={addCourse}
                >
                  + Add Course
                </button>
              </div>

              <div className="tag-list">
                {courseList.length === 0 ? (
                  <p className="empty-profile-note">No courses added yet.</p>
                ) : (
                  courseList.map((course, index) => (
                    <span key={index} className="profile-tag course-tag">
                      <span className="profile-tag-text">
                        <strong>{course.courseName}</strong>
                        {course.issuedBy ? ` — issued by ${course.issuedBy}` : ""}
                      </span>
                      <button
                        type="button"
                        className="remove-tag-btn"
                        onClick={() => removeCourse(index)}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div style={cardStyle} className="profile-card-hover">
              <p style={sectionTitleStyle}>Security</p>

              <div style={gridStyle}>
                <div className="form-group">
                  <label style={labelStyle}>New Password</label>
                  <input
                    ref={registerFieldRef("password")}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={getInputStyle("password")}
                    className="edit-profile-input"
                    placeholder="Leave empty if unchanged"
                  />
                  {errors.password && (
                    <p style={errorTextStyle}>{errors.password}</p>
                  )}
                </div>

                <div className="form-group">
                  <label style={labelStyle}>Confirm Password</label>
                  <input
                    ref={registerFieldRef("confirmPassword")}
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={getInputStyle("confirmPassword")}
                    className="edit-profile-input"
                    placeholder="Confirm new password"
                  />
                  {errors.confirmPassword && (
                    <p style={errorTextStyle}>{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <div
              ref={saveSectionRef}
              style={{
                position: "sticky",
                bottom: "12px",
                zIndex: 50
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                  borderRadius: "18px",
                  padding: "14px"
                }}
              >
                {pageMessage.text && (
                  <div style={messageStyle(pageMessage.type)}>
                    {pageMessage.text}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-primary"
                    onClick={updateProfile}
                    disabled={savingProfile}
                    style={{
                      minWidth: "220px",
                      padding: "12px 20px",
                      borderRadius: "14px"
                    }}
                  >
                    {savingProfile ? "Updating..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEducationModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem"
              }}
            >
              <h3 style={{ margin: 0 }}>
                {editingEducationIndex !== null ? "Edit Education" : "Add Education"}
              </h3>
              <button
                type="button"
                style={actionButtonStyle}
                onClick={() => {
                  setShowEducationModal(false);
                  setEducationForm(emptyEducation);
                  setEducationErrors({});
                  setEditingEducationIndex(null);
                }}
              >
                Close
              </button>
            </div>

            <div style={gridStyle}>
              <div className="form-group">
                <label style={labelStyle}>Degree / Qualification</label>
                <input
                  name="degree"
                  value={educationForm.degree}
                  onChange={handleEducationFormChange}
                  style={getModalInputStyle(educationErrors.degree)}
                  className="edit-profile-input"
                  placeholder="e.g. BSc in Data Science"
                />
                {educationErrors.degree && (
                  <p style={errorTextStyle}>{educationErrors.degree}</p>
                )}
              </div>

              <div className="form-group">
                <label style={labelStyle}>Field of Study</label>
                <input
                  name="fieldOfStudy"
                  value={educationForm.fieldOfStudy}
                  onChange={handleEducationFormChange}
                  style={getModalInputStyle(educationErrors.fieldOfStudy)}
                  className="edit-profile-input"
                  placeholder="e.g. Data Science"
                />
              </div>

              <div className="form-group">
                <label style={labelStyle}>University / Institute</label>
                <input
                  name="university"
                  value={educationForm.university}
                  onChange={handleEducationFormChange}
                  style={getModalInputStyle(educationErrors.university)}
                  className="edit-profile-input"
                  placeholder="Enter university or institute name"
                />
                {educationErrors.university && (
                  <p style={errorTextStyle}>{educationErrors.university}</p>
                )}
              </div>

              <div className="form-group">
                <label style={labelStyle}>Start Year</label>
                <input
                  name="startYear"
                  value={educationForm.startYear}
                  onChange={handleEducationFormChange}
                  style={getModalInputStyle(educationErrors.startYear)}
                  className="edit-profile-input"
                  placeholder="e.g. 2024"
                />
                {educationErrors.startYear && (
                  <p style={errorTextStyle}>{educationErrors.startYear}</p>
                )}
              </div>

              <div className="form-group">
                <label style={labelStyle}>End Year / Present</label>
                <input
                  name="endYear"
                  value={educationForm.endYear}
                  onChange={handleEducationFormChange}
                  style={getModalInputStyle(educationErrors.endYear)}
                  className="edit-profile-input"
                  placeholder="e.g. 2028 or Present"
                />
                {educationErrors.endYear && (
                  <p style={errorTextStyle}>{educationErrors.endYear}</p>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "1rem"
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveEducationEntry}
              >
                Save Education
              </button>
            </div>
          </div>
        </div>
      )}

      {showExperienceModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem"
              }}
            >
              <h3 style={{ margin: 0 }}>
                {editingExperienceIndex !== null ? "Edit Experience" : "Add Experience"}
              </h3>
              <button
                type="button"
                style={actionButtonStyle}
                onClick={() => {
                  setShowExperienceModal(false);
                  setExperienceForm(emptyExperience);
                  setExperienceErrors({});
                  setEditingExperienceIndex(null);
                }}
              >
                Close
              </button>
            </div>

            <div style={gridStyle}>
              <div className="form-group">
                <label style={labelStyle}>Job Title</label>
                <input
                  name="title"
                  value={experienceForm.title}
                  onChange={handleExperienceFormChange}
                  style={getModalInputStyle(experienceErrors.title)}
                  className="edit-profile-input"
                  placeholder="e.g. Intern Data Analyst"
                />
                {experienceErrors.title && (
                  <p style={errorTextStyle}>{experienceErrors.title}</p>
                )}
              </div>

              <div className="form-group">
                <label style={labelStyle}>Company / Organization</label>
                <input
                  name="company"
                  value={experienceForm.company}
                  onChange={handleExperienceFormChange}
                  style={getModalInputStyle(experienceErrors.company)}
                  className="edit-profile-input"
                  placeholder="Enter company name"
                />
                {experienceErrors.company && (
                  <p style={errorTextStyle}>{experienceErrors.company}</p>
                )}
              </div>

              <div className="form-group">
                <label style={labelStyle}>Duration</label>
                <input
                  name="duration"
                  value={experienceForm.duration}
                  onChange={handleExperienceFormChange}
                  style={getModalInputStyle(experienceErrors.duration)}
                  className="edit-profile-input"
                  placeholder="e.g. 6 months / 1 year"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label style={labelStyle}>Experience Description</label>
              <textarea
                name="description"
                value={experienceForm.description}
                onChange={handleExperienceFormChange}
                style={{
                  ...getModalInputStyle(experienceErrors.description),
                  minHeight: "110px",
                  resize: "vertical"
                }}
                className="edit-profile-input"
                placeholder="Describe your responsibilities or project work"
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "1rem"
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveExperienceEntry}
              >
                Save Experience
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default EditProfile; 