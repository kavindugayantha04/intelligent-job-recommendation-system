import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import RegisterModal from "./RegisterModal";
import LoginModal from "./LoginModal";
import "../styles/Navbar.css";

const navLinkClass = ({ isActive }) =>
  `nav-link${isActive ? " nav-link-active" : ""}`;

const Navbar = ({ onCourseClick }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const showCompanyAz = location.pathname === "/";

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          Intelligent Job Recommendation System
        </div>

        <div className={`nav-links ${menuOpen ? "active" : ""}`}>
          <NavLink to="/" className={navLinkClass} end onClick={closeMenu}>
            Home
          </NavLink>
          {typeof onCourseClick === "function" ? (
            <button
              type="button"
              className="nav-link"
              onClick={() => {
                closeMenu();
                onCourseClick();
              }}
            >
              Course
            </button>
          ) : (
            <NavLink to="/courses" className={navLinkClass} onClick={closeMenu}>
              Course
            </NavLink>
          )}
          
          {showCompanyAz && (
            <NavLink
              to="/company-a-z"
              className={navLinkClass}
              onClick={closeMenu}
            >
              Company A-Z
            </NavLink>
          )}

          <button
            type="button"
            className="login-btn"
            onClick={() => {
              closeMenu();
              setShowLogin(true);
            }}
          >
            Login
          </button>

          <button
            type="button"
            className="register-btn"
            onClick={() => {
              closeMenu();
              setShowRegister(true);
            }}
          >
            Register
          </button>
        </div>

        <div
          className="hamburger"
          role="button"
          tabIndex={0}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setMenuOpen(!menuOpen);
            }
          }}
        >
          ☰
        </div>
      </nav>

      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} />
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;
