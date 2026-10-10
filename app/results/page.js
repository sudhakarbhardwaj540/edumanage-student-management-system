
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../src/prisma/db";
import { getSession } from "../../lib/session";

export default async function ResultsPage() {
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

  const results = await db.orm.public.Result
    .where({ studentId: student.id })
    .include("exam")
    .all();

  const totalMarks = results.reduce(
    (sum, result) => sum + Number(result.marks || 0),
    0
  );

  const totalMaximumMarks = results.reduce(
    (sum, result) => sum + Number(result.exam?.totalMarks || 0),
    0
  );

  const percentage =
    totalMaximumMarks > 0
      ? ((totalMarks / totalMaximumMarks) * 100).toFixed(1)
      : "0.0";

  // This is a simple percentage-based display estimate,
  // not an official university CGPA calculation.
  const cgpa =
    totalMaximumMarks > 0
      ? ((totalMarks / totalMaximumMarks) * 10).toFixed(1)
      : "0.0";

  function getGrade(marks, maximumMarks) {
    if (!maximumMarks || maximumMarks <= 0) return "F";

    const percentage = (marks / maximumMarks) * 100;

    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";

    return "F";
  }

  function getRemarks(percentage) {
    if (percentage >= 90) return "Outstanding";
    if (percentage >= 80) return "Very Good";
    if (percentage >= 70) return "Good";
    if (percentage >= 60) return "Satisfactory";
    if (percentage >= 40) return "Needs Improvement";

    return "Fail";
  }

  function getGradeStyle(grade) {
    if (grade === "A+" || grade === "A") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (grade === "B+" || grade === "B") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    if (grade === "C" || grade === "D") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    return {
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: "#2563eb",
            color: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
              }}
            >
              Examination Results
            </h1>

            <p
              style={{
                margin: "10px 0 0",
                opacity: 0.9,
              }}
            >
              View your academic performance and examination results
            </p>
          </div>

          <Link
            href="/dashboard"
            style={{
              background: "white",
              color: "#2563eb",
              padding: "12px 22px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Dashboard
          </Link>
        </div>

        {/* STUDENT INFORMATION */}
        <div
          style={{
            background: "white",
            padding: "28px",
            borderRadius: "15px",
            marginBottom: "25px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              color: "#2563eb",
              marginTop: 0,
              marginBottom: "22px",
            }}
          >
            Student Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            <InfoItem label="Name" value={student.user.name} />
            <InfoItem label="Roll Number" value={student.rollNumber} />
            <InfoItem
              label="Department"
              value={student.department || "CSE"}
            />
            <InfoItem
              label="Course"
              value={student.course || "B.Tech CSE"}
            />
            <InfoItem
              label="Semester"
              value={
                student.semester
                  ? `${student.semester}th Semester`
                  : "Not Added"
              }
            />
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          <SummaryCard
            title="Total Marks"
            value={`${totalMarks}/${totalMaximumMarks}`}
            color="#2563eb"
          />

          <SummaryCard
            title="Percentage"
            value={`${percentage}%`}
            color="#16a34a"
          />

          <SummaryCard
            title="CGPA (Estimated)"
            value={cgpa}
            color="#9333ea"
          />

          <SummaryCard
            title="Subjects"
            value={results.length}
            color="#f59e0b"
          />
        </div>

        {/* RESULT TABLE */}
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  color: "#2563eb",
                  margin: 0,
                }}
              >
                Subject-wise Results
              </h2>

              <p
                style={{
                  color: "#6b7280",
                  marginBottom: 0,
                }}
              >
                Your performance in each examination
              </p>
            </div>

            <div
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "8px 14px",
                borderRadius: "20px",
                fontWeight: "bold",
              }}
            >
              {results.length} Subjects
            </div>
          </div>

          {results.length === 0 ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              No examination results available.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "750px",
                }}
              >
                <thead>
                  <tr style={{ background: "#eff6ff" }}>
                    <th style={headerStyle}>#</th>
                    <th style={headerStyle}>Subject</th>
                    <th style={headerStyle}>Examination</th>
                    <th style={headerStyle}>Marks</th>
                    <th style={headerStyle}>Percentage</th>
                    <th style={headerStyle}>Grade</th>
                    <th style={headerStyle}>Remarks</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((result, index) => {
                    const maximumMarks = Number(
                      result.exam?.totalMarks || 0
                    );
                    const marks = Number(result.marks || 0);

                    const subjectPercentage =
                      maximumMarks > 0
                        ? (marks / maximumMarks) * 100
                        : 0;

                    const grade = getGrade(marks, maximumMarks);
                    const gradeStyle = getGradeStyle(grade);
                    const remarks = getRemarks(subjectPercentage);

                    const subjectName =
                      result.exam?.name?.split(" - ")[0] || "Subject";

                    return (
                      <tr key={result.id}>
                        <td style={cellStyle}>{index + 1}</td>

                        <td style={cellStyle}>
                          <strong style={{ color: "#111827" }}>
                            {subjectName}
                          </strong>
                        </td>

                        <td style={cellStyle}>
                          {result.exam?.name || "Examination"}
                        </td>

                        <td style={cellStyle}>
                          <strong>{marks}</strong>
                          {" / "}
                          {maximumMarks}
                        </td>

                        <td style={cellStyle}>
                          {subjectPercentage.toFixed(1)}%
                        </td>

                        <td style={cellStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 14px",
                              borderRadius: "20px",
                              fontWeight: "bold",
                              background: gradeStyle.background,
                              color: gradeStyle.color,
                            }}
                          >
                            {grade}
                          </span>
                        </td>

                        <td style={cellStyle}>{remarks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PERFORMANCE SUMMARY */}
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
            marginBottom: "25px",
          }}
        >
          <h2
            style={{
              color: "#2563eb",
              marginTop: 0,
            }}
          >
            Performance Summary
          </h2>

          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#374151",
                lineHeight: "1.7",
              }}
            >
              You have scored <strong>{totalMarks}</strong> marks out of{" "}
              <strong>{totalMaximumMarks}</strong>, achieving{" "}
              <strong>{percentage}%</strong> overall with an estimated CGPA
              of <strong>{cgpa}</strong>.
            </p>
          </div>
        </div>

        {/* STUDENT SERVICES */}
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              color: "#2563eb",
              marginTop: 0,
            }}
          >
            Student Services
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <ServiceLink href="/dashboard" text="Dashboard" />
            <ServiceLink href="/profile" text="My Profile" />
            <ServiceLink href="/attendance" text="Attendance" />
            <ServiceLink href="/examinations" text="Examinations" />
            <ServiceLink href="/fees" text="Fees" />
          </div>
        </div>
      </div>
    </main>
  );
}

/* INFORMATION ITEM */
function InfoItem({ label, value }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        padding: "16px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#6b7280",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>

      <strong style={{ color: "#111827" }}>{value}</strong>
    </div>
  );
}

/* SUMMARY CARD */
function SummaryCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "white",
        padding: "25px",
        borderRadius: "15px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
        borderLeft: `5px solid ${color}`,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#6b7280",
          fontSize: "15px",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: "10px 0 0",
          color,
          fontSize: "28px",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

/* SERVICE LINK */
function ServiceLink({ href, text }) {
  return (
    <Link
      href={href}
      style={{
        background: "#2563eb",
        color: "white",
        padding: "11px 18px",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      {text}
    </Link>
  );
}

/* TABLE STYLES */
const headerStyle = {
  padding: "15px",
  textAlign: "left",
  borderBottom: "2px solid #dbeafe",
  color: "#1e40af",
  fontSize: "14px",
};

const cellStyle = {
  padding: "16px 15px",
  borderBottom: "1px solid #e5e7eb",
  color: "#374151",
  fontSize: "14px",
};
