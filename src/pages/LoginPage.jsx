import { useState } from "react";
import { login } from "../api/auth";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await login(username, password);
      onLogin(token);
    } catch (err) {
      setError("Login fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.");
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: 400, margin: "40px auto", padding: "20px", background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label>Benutzername</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label>Passwort</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
        </div>
        <button type="submit" style={{ padding: "10px", background: "#0056b3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Einloggen
        </button>
      </form>
    </div>
  );
}
