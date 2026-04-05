import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FaTachometerAlt, 
  FaBook, 
  FaUsers, 
  FaClipboardList, 
  FaSignOutAlt 
} from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation();

 const menu = [
  { 
    to: "/admin/dashboard", 
    label: "Dashboard", 
    icon: <FaTachometerAlt /> 
  },
  { 
    to: "/courses", 
    label: "Course Management", 
    icon: <FaBook /> 
  },
  {
  to: "/recruiter/registration",
  label: "Recruiter Registration",
  icon: <FaUsers />  
  },
  { 
    to: "/logs", 
    label: "Audits", 
    icon: <FaClipboardList /> 
  },
 
];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-subtitle">Admin Panel</div>
        <h2></h2>
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