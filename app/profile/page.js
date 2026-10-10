
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../src/prisma/db";
import { getSession } from "../../lib/session";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const student = await db.orm.public.Student
    .where({ userId: session.userId })
    .include("user")
    .first();

  if (!student) {
    redirect("/login");
  }

  const profileItems = [
    { label: "Name", value: student.user.name },
    { label: "Email", value: student.user.email },
    { label: "Role", value: student.user.role },
    { label: "Roll Number", value: student.rollNumber },
    { label: "Department", value: student.department || "Not Added" },
    { label: "Course", value: student.course || "Not Added" },
    {
      label: "Semester",
      value: student.semester
        ? `${student.semester}${student.semester === 1 ? "st" : student.semester === 2 ? "nd" : student.semester === 3 ? "rd" : "th"} Semester`
        : "Not Added",
    },
    { label: "Phone", value: student.phone || "Not Added" },
    { label: "Address", value: student.address || "Not Added" },
    {
      label: "Date of Birth",
      value: student.dateOfBirth
        ? String(student.dateOfBirth)
        : "Not Added",
    },
    { label: "Gender", value: student.gender || "Not Added" },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "32px 20px",
        fontFamily: "Arial, sans-serif",
        color: "#1e293b",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header
          style={{
            background: "#1d4ed8",
            color: "#ffffff",
            padding: "30px",
            borderRadius: "16px",
            marginBottom: "24px",
            boxShadow: "0 8px 24px rgba(37, 99, 235, 0.15)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "30px" }}>My Profile</h1>
          <p style={{ marginBottom: 0, color: "#dbeafe", lineHeight: 1.6 }}>
            View your personal and academic information
          </p>
        </header>

        <section
          style={{
            background: "#ffffff",
            padding: "32px",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.07)",
          }}
        >
          <h2
            style={{
              color: "#1d4ed8",
              fontSize: "21px",
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            Personal Information
          </h2>

          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "24px" }}>
            Your registered account and academic details
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {profileItems.map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "17px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  minWidth: 0,
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: "15px",
                    fontWeight: 500,
                    lineHeight: 1.6,
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: "28px",
              background: "#1d4ed8",
              color: "#ffffff",
              padding: "13px 22px",
              borderRadius: "9px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to Dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}
