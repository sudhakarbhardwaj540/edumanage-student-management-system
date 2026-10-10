"use client";

export default function LogoutButton() {
  async function handleLogout() {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = "/login";
      } else {
        alert("Logout failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "white",
        color: "#2563eb",
        border: "none",
        padding: "12px 25px",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
