"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "Invalid email or password"
        );
        return;
      }

      setMessage(
        `Welcome, ${data.user.name}! Login successful.`
      );

      const role = String(data.user.role || "")
        .toLowerCase()
        .trim();

      setTimeout(() => {
        if (role === "teacher") {
          router.replace("/teacher/dashboard");
        } else if (role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/dashboard");
        }

        router.refresh();
      }, 500);
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "white",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#2563eb",
            marginBottom: "10px",
          }}
        >
          Welcome Back
        </h1>

        <h2
          style={{
            textAlign: "center",
            fontSize: "20px",
            fontWeight: "normal",
            marginBottom: "30px",
            color: "#374151",
          }}
        >
          Student Management System
        </h2>

        <form onSubmit={handleLogin}>
          <label
            htmlFor="email"
            style={labelStyle}
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            style={inputStyle}
          />

          <label
            htmlFor="password"
            style={labelStyle}
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{
              ...inputStyle,
              marginBottom: "20px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "14px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p
            role="status"
            style={{
              textAlign: "center",
              marginTop: "20px",
              color: message.includes("successful")
                ? "#16a34a"
                : "#dc2626",
              fontWeight: "bold",
              lineHeight: "1.5",
            }}
          >
            {message}
          </p>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Secure login for authorized users
        </p>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: "bold",
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "18px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "16px",
  boxSizing: "border-box",
};