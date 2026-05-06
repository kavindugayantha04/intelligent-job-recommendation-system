import React, { useState } from "react";
import { registerUser } from "../api/authApi";
import "../styles/RegisterModal.css";

const RegisterModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      return "All fields are required.";
    }

    if (name.length < 3) {
      return "Full name must be at least 3 characters long.";
    }

    if (!/^[A-Za-z\s]+$/.test(name)) {
      return "Full name can only contain letters and spaces.";
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    if (password.length > 20) {
      return "Password cannot be more than 20 characters long.";
    }

    if (!/[A-Z]/.test(password)) {
      return "Password must include at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
      return "Password must include at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
      return "Password must include at least one number.";
    }

    if (password !== confirmPassword) {
      return "Password and confirm password do not match.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      };

      const res = await registerUser(payload);

      setSuccessMessage(res.data.message || "Registration successful!");

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  const hasMinLength = formData.password.length >= 6;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const passwordsMatch =
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <button className="close-btn" onClick={onClose} type="button">
          ✖
        </button>

        <h2>Create Account</h2>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="password-rules">
            <p className={hasMinLength ? "valid" : ""}>
              • At least 6 characters
            </p>
            <p className={hasUppercase ? "valid" : ""}>
              • At least one uppercase letter
            </p>
            <p className={hasLowercase ? "valid" : ""}>
              • At least one lowercase letter
            </p>
            <p className={hasNumber ? "valid" : ""}>
              • At least one number
            </p>
          </div>

          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {formData.confirmPassword && !passwordsMatch && (
            <p className="error-message">Passwords do not match.</p>
          )}

          {formData.confirmPassword && passwordsMatch && (
            <p className="success-message">Passwords match.</p>
          )}

          <button type="submit" className="submit-btn">
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;