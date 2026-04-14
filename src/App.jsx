import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import HousekeepingLogPage from "./pages/HousekeepingLogPage";
import TimesheetPage from "./pages/TimesheetPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LoginPage from "./pages/LoginPage";
import { fetchUserProfile } from "./api/auth";
import "./styles.css";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchUserProfile(token)
        .then((profile) => {
          const isUserAdmin = !!(profile && (profile.is_staff || profile.is_superuser));
          setIsAdmin(isUserAdmin);
          
          // Only redirect if at the root path, to allow navigation to other pages like /housekeeping
          if (window.location.pathname === "/") {
            if (isUserAdmin) {
              navigate("/admin");
            }
          }
        })
        .catch(() => {
          setIsAdmin(false);
        });
    } else {
      setIsAdmin(false);
    }
  }, [token, navigate]);

  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setIsAdmin(false);
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <>
      <nav className="app-nav" aria-label="Seiten">
        {!isAdmin && (
          <>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "app-nav-link app-nav-link--active" : "app-nav-link"
              }
            >
              Stundennachweis
            </NavLink>
            <NavLink
              to="/housekeeping"
              className={({ isActive }) =>
                isActive ? "app-nav-link app-nav-link--active" : "app-nav-link"
              }
            >
              Housekeeping-Log
            </NavLink>
          </>
        )}
        {isAdmin && (
          <a
            href="/admin"
            className={`app-nav-link ${window.location.pathname === "/admin" ? "app-nav-link--active" : ""}`}
            onClick={(e) => {
              if (window.location.pathname === "/admin") {
                e.preventDefault();
                window.location.reload();
              }
            }}
          >
            Admin Dashboard
          </a>
        )}
        <button onClick={handleLogout} className="app-nav-link" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "inherit", fontFamily: "inherit" }}>
          Logout
        </button>
      </nav>
      <main className="timesheet-page">
        <Routes>
          {isAdmin ? (
            <>
              <Route path="/" element={<AdminDashboardPage token={token} />} />
              <Route path="/admin" element={<AdminDashboardPage token={token} />} />
              <Route path="*" element={<AdminDashboardPage token={token} />} />
            </>
          ) : (
            <>
              <Route path="/" element={<TimesheetPage token={token} />} />
              <Route path="/housekeeping" element={<HousekeepingLogPage token={token} />} />
              <Route path="*" element={<TimesheetPage token={token} />} />
            </>
          )}
        </Routes>
      </main>
    </>
  );
}
