import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaCalendarAlt, FaUsers, FaCog, FaSignOutAlt } from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation();

  const menu = [
    { to: "/", label: "Dashboard", icon: <FaTachometerAlt /> },
    { to: "/interviews", label: "Interview Scheduling", icon: <FaCalendarAlt /> },
    { to: "/candidates", label: "Candidates", icon: <FaUsers /> },
   
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-subtitle">Recruitment</div>
        <h2>Interview App</h2>
      </div>

      <ul>
        {menu.map((m) => (
          <li key={m.to} className={location.pathname === m.to ? "active" : ""}>
            <Link to={m.to}>
              <span style={{ fontSize: 18 }}>{m.icon}</span>
              <span>{m.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "auto" }}>
        <button className="logout-btn" onClick={() => { /* implement logout navigation */ }}>
          <FaSignOutAlt style={{ marginRight: 8 }} /> Logout
        </button>
      </div>
    </aside>
  );
}