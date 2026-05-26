import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: "/help", label: "Chat", icon: "💬", exact: true },
    { to: "/help/admin", label: "FAQ Admin", icon: "⚙️" },
    { to: "/help/logs", label: "Logs", icon: "📊" },
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#0f172a",
      }}
    >
      <aside
        style={{
          width: collapsed ? 72 : 230,
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          borderRight: "1px solid rgba(99, 102, 241, 0.2)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: collapsed ? "24px 0" : "24px 20px",
            borderBottom: "1px solid rgba(99, 102, 241, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4f46e5, #22d3ee)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
              boxShadow: "0 0 16px rgba(79, 70, 229, 0.45)",
            }}
          >
            🤖
          </div>
          {!collapsed && (
            <div>
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "#fff",
                  lineHeight: 1.1,
                }}
              >
                JobMatch
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#a5b4fc",
                  fontWeight: 500,
                }}
              >
                AI Chatbot
              </div>
            </div>
          )}
        </div>

        <nav
          style={{
            padding: "16px 10px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "12px 0" : "12px 14px",
                borderRadius: 12,
                textDecoration: "none",
                color: isActive ? "#e0e7ff" : "rgba(255,255,255,0.55)",
                background: isActive
                  ? "rgba(79, 70, 229, 0.25)"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(129, 140, 248, 0.35)"
                  : "1px solid transparent",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                transition: "all 0.2s",
                justifyContent: collapsed ? "center" : "flex-start",
                cursor: "pointer",
              })}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            margin: "0 10px 16px",
            padding: "10px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
        >
          {collapsed ? "→" : "← Collapse"}
        </button>

        {!collapsed && (
          <div
            style={{
              margin: "0 10px 16px",
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(79, 70, 229, 0.12)",
              border: "1px solid rgba(129, 140, 248, 0.2)",
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              textAlign: "center",
            }}
          >
            DS-01-G18 · AIML Project
          </div>
        )}
      </aside>

      <main style={{ flex: 1, overflow: "hidden", background: "#f1f5f9" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
