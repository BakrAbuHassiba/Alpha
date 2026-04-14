import { useEffect, useState } from "react";
import { fetchAdminDashboard } from "../api/auth";
import { fetchTimesheetSettings, getDefaultTimesheetSettings } from "../api/timesheetSettings";
import { fetchHousekeepingLogSettings, getDefaultHousekeepingLogSettings } from "../api/housekeepingLogSettings";
import TimesheetTable from "../components/TimesheetTable";
import HousekeepingLogTable from "../components/HousekeepingLogTable";

export default function AdminDashboardPage({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tsSettings, setTsSettings] = useState(() => getDefaultTimesheetSettings());
  const [hkSettings, setHkSettings] = useState(() => getDefaultHousekeepingLogSettings());
  
  const [selectedSheet, setSelectedSheet] = useState(null); // { type, isSubmitted, data }

  useEffect(() => {
    Promise.all([
      fetchAdminDashboard(token),
      fetchTimesheetSettings(),
      fetchHousekeepingLogSettings()
    ])
      .then(([dashboardData, ts, hk]) => {
        setData(dashboardData);
        setTsSettings(ts);
        setHkSettings(hk);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load dashboard data. Are you an admin?");
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="admin-status">Loading dashboard...</div>;
  if (error) return <div className="admin-status error">{error}</div>;

  const renderList = (title, items, type, isSubmitted) => (
    <div className="admin-section">
      <h3>{title}</h3>
      <div className="admin-list">
        {items.length === 0 && <p className="empty-msg">No entries found.</p>}
        {items.map((item) => (
          <div key={item.id} className="admin-list-item" onClick={() => setSelectedSheet({ type, isSubmitted, item })}>
            <div className="item-info">
              <span className="user-name">{item.user__username}</span>
              <span className="sheet-period">{item.month} {item.year}</span>
              <span className="sheet-employee">{item.employee_name}</span>
            </div>
            <div className="item-meta">
              {isSubmitted ? (
                <span className="status-submitted">Submitted: {new Date(item.submitted_at).toLocaleDateString()}</span>
              ) : (
                <span className="status-active">Active (Draft) - Last update: {new Date(item.updated_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        {selectedSheet && (
          <button className="back-btn" onClick={() => setSelectedSheet(null)}>
            ← Back to List
          </button>
        )}
      </header>

      {!selectedSheet ? (
        <div className="admin-grid">
          <div className="admin-column">
            <h2>Timesheets</h2>
            {renderList("Active Drafts", data.active_timesheets, "timesheet", false)}
            {renderList("Submitted Sheets", data.submitted_timesheets, "timesheet", true)}
          </div>
          <div className="admin-column">
            <h2>Housekeeping Logs</h2>
            {renderList("Active Drafts", data.active_housekeeping, "housekeeping", false)}
            {renderList("Submitted Sheets", data.submitted_housekeeping, "housekeeping", true)}
          </div>
        </div>
      ) : (
        <div className="admin-view-sheet">
          <div className="sheet-viewer-header">
            <h3>
              {selectedSheet.type === "timesheet" ? "Stundennachweis" : "Housekeeping-Log"} - 
              User: {selectedSheet.item.user__username} 
              ({selectedSheet.isSubmitted ? "Submitted" : "Draft"})
            </h3>
          </div>
          
          <div className="timesheet-sheet timesheet-sheet--wide" style={{ marginTop: 20 }}>
            {selectedSheet.type === "timesheet" ? (
              <TimesheetTable 
                hotelName={tsSettings.hotel_name} 
                verhaltnis={tsSettings.verhaltnis} 
                token={token}
                initialData={selectedSheet.item}
                readOnly={true}
              />
            ) : (
              <HousekeepingLogTable 
                hotelName={hkSettings.hotel_name} 
                config={hkSettings} 
                token={token}
                initialData={selectedSheet.item}
                readOnly={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
