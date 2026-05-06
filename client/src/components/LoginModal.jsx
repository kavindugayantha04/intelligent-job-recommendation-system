import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import "../styles/RegisterModal.css";

const LoginModal = ({ onClose }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
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
    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      return "Please fill in all fields.";
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
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
        email: formData.email.trim(),
        password: formData.password
      };

      const res = await loginUser(payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setSuccessMessage("Login successful!");

      setTimeout(() => {
        const role = String(res.data.user?.role ?? "candidate")
          .trim()
          .toLowerCase();

        if (role === "admin") {
          navigate("/admin-dashboard");
        } else if (role === "recruiter") {
          navigate("/recruiter-dashboard");
        } else {
          navigate("/candidate-dashboard");
        }

        onClose();
      }, 800);

    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <button className="close-btn" onClick={onClose} type="button">
          ✖
        </button>

        <h2>Login</h2>

        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}

        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}

        <form onSubmit={handleSubmit}>
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

          <p className="helper-text">
            Enter your registered email and password to continue.
          </p>

          <button type="submit" className="submit-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;