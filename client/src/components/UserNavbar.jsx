import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/style2.css";

const UserNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Courses tab also lights up while the candidate is mid-MCQ-test
  // (skill-gap functionality has been merged into /courses).
  const isCoursesActive =
    location.pathname.startsWith("/courses") ||
    location.pathname.startsWith("/skill-test");

  return (
    <header className="site-header">
      <div className="header-inner">

        <Link className="header-brand" to="/candidate-dashboard">
          Intelligent Job Recommendation System
        </Link>

        <nav className="header-links">
          <Link
            to="/candidate-dashboard"
            className={`nav-item ${
              location.pathname === "/candidate-dashboard" ? "active" : ""
            }`}
          >
            Home
          </Link>

          <Link
            to="/browse-jobs"
            className={`nav-item ${
              location.pathname === "/browse-jobs" ? "active" : ""
            }`}
          >
            Browse Jobs
          </Link>

          <Link
            to="/recommended-jobs"
            className={`nav-item ${
              location.pathname === "/recommended-jobs" ? "active" : ""
            }`}
          >
            Recommended Jobs
          </Link>

          <Link
            to="/my-applications"
            className={`nav-item ${
              location.pathname === "/my-applications" ? "active" : ""
            }`}
          >
            My Applications
          </Link>

          <Link
            to="/courses"
            className={`nav-item ${isCoursesActive ? "active" : ""}`}
          >
            Courses
          </Link>

          <Link
            to="/help"
            className={`nav-item ${
              location.pathname === "/help" ? "active" : ""
            }`}
          >
            Help
          </Link>

          <Link
            to="/profile"
            className={`nav-item ${
              location.pathname === "/profile" ? "active" : ""
            }`}
          >
            Profile
          </Link>
        </nav>

        <div className="header-actions">
          <span className="header-user">{user?.name}</span>

          <button
            className="signout-btn"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default UserNavbar;
