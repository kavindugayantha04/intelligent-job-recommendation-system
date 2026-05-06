import React from "react";
import { useState } from "react";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/LandingPage.css";
import heroImage from "../assets/hero.png";

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <>
      <Navbar onCourseClick={() => setShowLogin(true)} />

      <section className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="hero-left">
            <h1>Find the Right Career Match with AI</h1>

            <p>
              Upload your CV, discover relevant opportunities, and receive
              intelligent job recommendations based on your skills, experience,
              and career goals.
            </p>

            <button
              type="button"
              className="upload-btn"
              onClick={() => setShowLogin(true)}
            >
              Upload CV
            </button>
          </div>

          <div className="hero-right">
            <img src={heroImage} alt="Professional" />
          </div>
        </div>
      </section>

      <section className="featured-company">
        <p className="featured-title">Careers at Jiffy Products</p>
        <h2 className="company-name">Jiffy Products</h2>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="icon-circle">🤖</div>
          <h3>Smart Job Match</h3>
          <p>
            Get AI-powered job recommendations tailored to your skills and
            experience.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon-circle">📊</div>
          <h3>Resume Insights</h3>
          <p>
            Analyze your CV and discover skill gaps to improve your job
            matches.
          </p>
        </div>

        <div className="feature-card">
          <div className="icon-circle">🔔</div>
          <h3>Interview Alerts</h3>
          <p>Get notified when recruiters schedule interviews.</p>
        </div>
      </section>

      <section className="categories">
        <h2>Explore Job Categories</h2>

        <div className="category-grid">
          <div className="category-card">IT</div>
          <div className="category-card">Marketing</div>
          <div className="category-card">Human Resources</div>
          <div className="category-card">Finance</div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Jiffy Products</h3>
            <p>AI-powered job recommendation system.</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li onClick={() => setShowLogin(true)}>Login</li>
              <li onClick={() => setShowRegister(true)}>Register</li>
              <li>
                <Link to="/courses">Courses</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact Us</h4>
            <p>Email: support@jobs.com</p>
            <p>Phone: +94 77 123 4567</p>
          </div>
        </div>

        <p className="copyright">
          © 2026 Intelligent Job Recommendation System
        </p>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} />
      )}
    </>
  );
};

export default LandingPage;
