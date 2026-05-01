import { useState } from "react";
import { apiRequest } from "../lib/api";

export function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER"
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = mode === "signup" ? form : { email: form.email, password: form.password };
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      localStorage.setItem("ttm_token", data.token);
      onAuthSuccess(data.user);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <p className="eyebrow">Project execution, simplified</p>
        <h1>Team Task Manager</h1>
        <p>
          Create projects, invite teammates, assign work, and keep overdue tasks visible
          without losing control of who can do what.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        {mode === "signup" && (
          <>
            <label>
              Full name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Aarav Sharma"
              />
            </label>

            <label>
              Role
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
          </>
        )}

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="Minimum 6 characters"
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
        </button>

        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </form>
    </div>
  );
}
