import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../src/prisma/db";
import { getSession } from "../../lib/session";

export default async function ExaminationsPage() {
  // Check login session
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Find logged-in student
  const student = await db.orm.public.Student
    .where({ userId: session.userId })
    .include("user")
    .first();

  if (!student) {
    redirect("/login");
  }

  // Get all examinations
  const exams = await db.orm.public.Exam
    .include("subject")
    .all();

  // Sort examinations by date
  const sortedExams = [...exams].sort((a, b) => {
    return String(a.examDate || "").localeCompare(
      String(b.examDate || "")
    );
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#7c3aed",
          color: "white",
          padding: "30px",
          borderRadius: "15px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 10px 0",
                fontSize: "18px",
              }}
            >
              Examinations
            </p>

            <h1
              style={{
                margin: "0 0 10px 0",
                fontSize: "30px",
              }}
            >
              {student.user.name}'s Examinations
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: "16px",
              }}
            >
              Roll Number: {student.rollNumber}
            </p>
          </div>

          <Link
            href="/dashboard"
            style={{
              background: "white",
              color: "#7c3aed",
              padding: "12px 25px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Examination Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              color: "#666",
              margin: "0 0 10px 0",
            }}
          >
            Total Examinations
          </p>

          <h2
            style={{
              color: "#7c3aed",
              fontSize: "35px",
              margin: 0,
            }}
          >
            {exams.length}
          </h2>
        </div>

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              color: "#666",
              margin: "0 0 10px 0",
            }}
          >
            Semester
          </p>

          <h2
            style={{
              color: "#2563eb",
              fontSize: "30px",
              margin: 0,
            }}
          >
            {student.semester
              ? `${student.semester}th`
              : "N/A"}
          </h2>
        </div>

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              color: "#666",
              margin: "0 0 10px 0",
            }}
          >
            Course
          </p>

          <h2
            style={{
              color: "#16a34a",
              fontSize: "24px",
              margin: 0,
            }}
          >
            {student.course || "N/A"}
          </h2>
        </div>
      </div>

      {/* Examination List */}
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          marginBottom: "25px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
        }}
      >
        <h2
          style={{
            color: "#2563eb",
            marginTop: 0,
            marginBottom: "25px",
          }}
        >
          Examination Schedule
        </h2>

        {sortedExams.length === 0 ? (
          <p style={{ color: "#666" }}>
            No examinations scheduled.
          </p>
        ) : (
          sortedExams.map((exam) => (
            <div
              key={exam.id}
              style={{
                background: "#f8fafc",
                padding: "25px",
                borderRadius: "12px",
                marginBottom: "15px",
                borderLeft: "5px solid #7c3aed",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "15px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "#333",
                      fontSize: "20px",
                    }}
                  >
                    {exam.subject?.name || "Subject"}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 8px 0",
                      color: "#666",
                    }}
                  >
                    Subject Code:{" "}
                    {exam.subject?.code || "N/A"}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                    }}
                  >
                    Exam: {exam.name}
                  </p>
                </div>

                <div
                  style={{
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      background: "#ede9fe",
                      color: "#7c3aed",
                      padding: "10px 18px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {exam.examDate
                      ? String(exam.examDate)
                      : "Date not available"}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      color: "#666",
                    }}
                  >
                    Total Marks: {exam.totalMarks}
                  </p>
                </div>
              </div>

              {exam.description && (
                <p
                  style={{
                    marginTop: "15px",
                    marginBottom: 0,
                    color: "#666",
                  }}
                >
                  {exam.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Student Services */}
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
        }}
      >
        <h2
          style={{
            color: "#2563eb",
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          Student Services
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              background: "#2563eb",
              color: "white",
              padding: "18px",
              borderRadius: "8px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Dashboard
          </Link>

          <Link
            href="/profile"
            style={{
              background: "#2563eb",
              color: "white",
              padding: "18px",
              borderRadius: "8px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            My Profile
          </Link>

          <Link
            href="/attendance"
            style={{
              background: "#16a34a",
              color: "white",
              padding: "18px",
              borderRadius: "8px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Attendance
          </Link>

          <Link
            href="/results"
            style={{
              background: "#f97316",
              color: "white",
              padding: "18px",
              borderRadius: "8px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Results
          </Link>

          <Link
            href="/fees"
            style={{
              background: "#0891b2",
              color: "white",
              padding: "18px",
              borderRadius: "8px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Fees
          </Link>
        </div>
      </div>
    </main>
  );
}
