import { Link } from "react-router-dom";
import "../styles/style2.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h4>Jiffy Products</h4>
          <p>AI-powered job recommendation system.</p>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/candidate-dashboard">Home</Link>
            </li>
            <li>
              <Link to="/browse-jobs">Browse Jobs</Link>
            </li>
            <li>
              <Link to="/my-applications">My Applications</Link>
            </li>
            <li>
              <Link to="/courses">Courses</Link>
            </li>
            <li>
              <Link to="/help">Help</Link>
            </li>
            <li>
              <Link to="/profile">Profile</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact Us</h4>
          <p>Email: support@jobs.com</p>
          <p>Phone: +94 77 123 4567</p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 Intelligent Job Recommendation System
      </div>
    </footer>
  );
};

export default Footer;