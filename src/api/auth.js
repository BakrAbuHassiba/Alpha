const apiBase = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export const login = async (username, password) => {
  const response = await fetch(`${apiBase}/api/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error("Invalid login");
  }
  const data = await response.json();
  return data.token;
};

export const fetchActiveTimesheet = async (token) => {
  const response = await fetch(`${apiBase}/api/timesheet/active/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
};

export const saveActiveTimesheet = async (token, month, year, employee_name, pers_nr, data) => {
  const response = await fetch(`${apiBase}/api/timesheet/active/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ month, year, employee_name, pers_nr, data }),
  });
  if (!response.ok) throw new Error("Network response was not ok");
  return response.ok;
};

export const fetchActiveHousekeeping = async (token) => {
  const response = await fetch(
    `${apiBase}/api/housekeeping-log/active/`,
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
  if (!response.ok) return null;
  return response.json();
};

export const saveActiveHousekeeping = async (token, month, year, employee_name, pers_nr, data) => {
  const response = await fetch(
    `${apiBase}/api/housekeeping-log/active/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ month, year, employee_name, pers_nr, data }),
    }
  );
  if (!response.ok) throw new Error("Network response was not ok");
  return response.ok;
};

export const submitTimesheet = async (token, month, year, employee_name, pers_nr, data) => {
  const response = await fetch(`${apiBase}/api/timesheet/submit/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ month, year, employee_name, pers_nr, data }),
  });
  if (!response.ok) throw new Error("Network response was not ok");
  return response.ok;
};

export const submitHousekeepingLog = async (token, month, year, employee_name, pers_nr, data) => {
  const response = await fetch(
    `${apiBase}/api/housekeeping-log/submit/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ month, year, employee_name, pers_nr, data }),
    }
  );
  if (!response.ok) throw new Error("Network response was not ok");
  return response.ok;
};

export const fetchUserProfile = async (token) => {
  const response = await fetch(`${apiBase}/api/me/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
};

export const fetchAdminDashboard = async (token) => {
  const response = await fetch(`${apiBase}/api/admin/dashboard/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) throw new Error("Unauthorized or server error");
  return response.json();
};
