import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBook,
  FaQuestionCircle,
  FaUsers,
  FaClipboardList,
  FaSignOutAlt,
  FaBuilding
} from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    {
      to: "/admin-dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt />
    },
    {
      to: "/admin/company-profile",
      label: "Company Profile",
      icon: <FaBuilding />
    },
    {
      to: "/admin/courses",
      label: "Course Management",
      icon: <FaBook />
    },
    {
      to: "/admin/questions",
      label: "MCQ Management",
      icon: <FaQuestionCircle />
    },
    {
      to: "/admin/recruiters",
      label: "Recruiter Registration",
      icon: <FaUsers />
    },
    {
      to: "/logs",
      label: "Audits",
      icon: <FaClipboardList />
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-subtitle">Admin Panel</div>
        <h2></h2>
      </div>

      <ul>
        {menu.map((m) => (
          <li
            key={m.to}
            className={
              location.pathname === m.to ||
              (m.to === "/admin/questions" && location.pathname === "/admin/mcq")
                ? "active"
                : ""
            }
          >
            <Link to={m.to}>
              <span style={{ fontSize: 18 }}>{m.icon}</span>
              <span>{m.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "auto" }}>
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt style={{ marginRight: 8 }} /> Logout
        </button>
      </div>
    </aside>
  );
}
