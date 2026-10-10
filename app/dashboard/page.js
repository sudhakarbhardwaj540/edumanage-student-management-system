import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../src/prisma/db";
import { getSession } from "../../lib/session";
import LogoutButton from "../../components/LogoutButton";

export default async function DashboardPage() {
  // ==========================================
  // 1. CHECK LOGIN SESSION
  // ==========================================

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // ==========================================
  // 2. GET LOGGED-IN STUDENT
  // ==========================================

  const student = await db.orm.public.Student
    .where({ userId: session.userId })
    .include("user")
    .first();

  if (!student) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f7fb",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "15px",
            textAlign: "center",
          }}
        >
          <h2>Student profile not found</h2>

          <Link
            href="/login"
            style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "12px 25px",
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
            }}
          >
            Back to Login
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================
  // 3. GET ATTENDANCE
  // ==========================================

  const attendanceRecords = await db.orm.public.Attendance
    .where({ studentId: student.id })
    .include("subject")
    .all();

  const totalClasses = attendanceRecords.length;

  const presentClasses = attendanceRecords.filter(
    (record) => record.status === "Present"
  ).length;

  const attendancePercentage =
    totalClasses > 0
      ? Math.round((presentClasses / totalClasses) * 100)
      : 0;

  // ==========================================
  // 4. SUBJECT-WISE ATTENDANCE
  // ==========================================

  const subjectAttendance = {};

  attendanceRecords.forEach((record) => {
    if (!record.subject) {
      return;
    }

    const subjectId = record.subject.id;

    if (!subjectAttendance[subjectId]) {
      subjectAttendance[subjectId] = {
        id: subjectId,
        name: record.subject.name,
        code: record.subject.code,
        total: 0,
        present: 0,
      };
    }

    subjectAttendance[subjectId].total += 1;

    if (record.status === "Present") {
      subjectAttendance[subjectId].present += 1;
    }
  });

  const subjectAttendanceList = Object.values(
    subjectAttendance
  ).map((subject) => ({
    ...subject,
    percentage:
      subject.total > 0
        ? Math.round(
            (subject.present / subject.total) * 100
          )
        : 0,
  }));

  // ==========================================
  // 5. ENROLLED COURSES
  // ==========================================

  const enrollments = await db.orm.public.Enrollment
    .where({ studentId: student.id })
    .all();

  // ==========================================
  // 6. EXAMINATION RESULTS
  // ==========================================

  const results = await db.orm.public.Result
    .where({ studentId: student.id })
    .include("exam")
    .all();

  const totalMarks = results.reduce(
    (sum, result) => sum + result.marks,
    0
  );

  const totalMaximumMarks = results.reduce(
    (sum, result) => sum + result.exam.totalMarks,
    0
  );

  const percentage =
    totalMaximumMarks > 0
      ? (totalMarks / totalMaximumMarks) * 100
      : 0;

  const currentCGPA = (percentage / 10).toFixed(1);

  // ==========================================
  // 7. FEES
  // ==========================================

  const fees = await db.orm.public.Fee
    .where({ studentId: student.id })
    .all();

  const pendingFees = fees
    .filter((fee) => fee.status !== "Paid")
    .reduce((sum, fee) => sum + fee.amount, 0);

  // ==========================================
  // 8. UPCOMING EXAMINATIONS
  // ==========================================

  const upcomingExams = [];

  for (const enrollment of enrollments) {
    const subjects = await db.orm.public.Subject
      .where({ courseId: enrollment.courseId })
      .all();

    for (const subject of subjects) {
      const subjectExams = await db.orm.public.Exam
        .where({ subjectId: subject.id })
        .all();

      for (const exam of subjectExams) {
        if (exam.examDate) {
          const examDate = new Date(exam.examDate);
          const today = new Date();

          today.setHours(0, 0, 0, 0);

          if (examDate >= today) {
            upcomingExams.push({
              ...exam,
              subjectName: subject.name,
              subjectCode: subject.code,
            });
          }
        }
      }
    }
  }

  upcomingExams.sort(
    (a, b) =>
      new Date(a.examDate).getTime() -
      new Date(b.examDate).getTime()
  );

  const displayedUpcomingExams =
    upcomingExams.slice(0, 5);

  // ==========================================
  // 9. DASHBOARD UI
  // ==========================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1300px",
          margin: "0 auto",
        }}
      >

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div
          style={{
            background: "#2563eb",
            color: "white",
            padding: "35px",
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
            <p
              style={{
                margin: 0,
                fontSize: "18px",
                opacity: 0.9,
              }}
            >
              Student Dashboard
            </p>

            <h1
              style={{
                margin: "15px 0 8px",
                fontSize: "32px",
              }}
            >
              Welcome, {student.user.name} 👋
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: "17px",
              }}
            >
              Roll Number: {student.rollNumber}
            </p>
          </div>

          <LogoutButton />
        </div>

        {/* ================================= */}
        {/* STATISTICS */}
        {/* ================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "25px",
          }}
        >

          {/* COURSES */}

          <div
            style={{
              background: "white",
              padding: "28px",
              borderRadius: "15px",
              boxShadow:
                "0 5px 20px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ margin: 0, color: "#666" }}>
              Enrolled Courses
            </p>

            <h2
              style={{
                margin: "12px 0 0",
                color: "#2563eb",
                fontSize: "34px",
              }}
            >
              {enrollments.length}
            </h2>
          </div>

          {/* ATTENDANCE */}

          <div
            style={{
              background: "white",
              padding: "28px",
              borderRadius: "15px",
              boxShadow:
                "0 5px 20px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ margin: 0, color: "#666" }}>
              Attendance
            </p>

            <h2
              style={{
                margin: "12px 0 0",
                color:
                  attendancePercentage >= 75
                    ? "#16a34a"
                    : "#dc2626",
                fontSize: "34px",
              }}
            >
              {attendancePercentage}%
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#777",
              }}
            >
              {presentClasses} of {totalClasses} classes
              present
            </p>
          </div>

          {/* CGPA */}

          <div
            style={{
              background: "white",
              padding: "28px",
              borderRadius: "15px",
              boxShadow:
                "0 5px 20px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ margin: 0, color: "#666" }}>
              Current CGPA
            </p>

            <h2
              style={{
                margin: "12px 0 0",
                color: "#7c3aed",
                fontSize: "34px",
              }}
            >
              {currentCGPA}
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#777",
              }}
            >
              Based on examination results
            </p>
          </div>

          {/* FEES */}

          <div
            style={{
              background: "white",
              padding: "28px",
              borderRadius: "15px",
              boxShadow:
                "0 5px 20px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ margin: 0, color: "#666" }}>
              Pending Fees
            </p>

            <h2
              style={{
                margin: "12px 0 0",
                color:
                  pendingFees > 0
                    ? "#dc2626"
                    : "#16a34a",
                fontSize: "34px",
              }}
            >
              ₹{pendingFees.toLocaleString("en-IN")}
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#777",
              }}
            >
              {pendingFees > 0
                ? "Payment pending"
                : "All fees paid"}
            </p>
          </div>
        </div>

        {/* ================================= */}
        {/* STUDENT INFORMATION */}
        {/* ================================= */}

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              color: "#2563eb",
              marginTop: 0,
            }}
          >
            Student Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <div>
              <strong>Name</strong>
              <p>{student.user.name}</p>
            </div>

            <div>
              <strong>Email</strong>
              <p>{student.user.email}</p>
            </div>

            <div>
              <strong>Department</strong>
              <p>
                {student.department || "Not Added"}
              </p>
            </div>

            <div>
              <strong>Course</strong>
              <p>
                {student.course || "Not Added"}
              </p>
            </div>

            <div>
              <strong>Semester</strong>
              <p>
                {student.semester
                  ? `${student.semester}th Semester`
                  : "Not Added"}
              </p>
            </div>

            <div>
              <strong>Roll Number</strong>
              <p>{student.rollNumber}</p>
            </div>
          </div>
        </div>

        {/* ================================= */}
        {/* SUBJECT-WISE ATTENDANCE */}
        {/* ================================= */}

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              color: "#2563eb",
              marginTop: 0,
            }}
          >
            Subject-wise Attendance
          </h2>

          {subjectAttendanceList.length === 0 ? (
            <p style={{ color: "#666" }}>
              No subject-wise attendance available.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "15px",
                marginTop: "20px",
              }}
            >
              {subjectAttendanceList.map((subject) => (
                <div
                  key={subject.id}
                  style={{
                    padding: "20px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontSize: "17px",
                        }}
                      >
                        {subject.name}
                      </strong>

                      <p
                        style={{
                          margin: "5px 0 0",
                          color: "#777",
                        }}
                      >
                        {subject.code}
                      </p>
                    </div>

                    <strong
                      style={{
                        fontSize: "20px",
                        color:
                          subject.percentage >= 75
                            ? "#16a34a"
                            : "#dc2626",
                      }}
                    >
                      {subject.percentage}%
                    </strong>
                  </div>

                  <div
                    style={{
                      marginTop: "15px",
                      height: "10px",
                      background: "#e5e7eb",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${subject.percentage}%`,
                        height: "100%",
                        background:
                          subject.percentage >= 75
                            ? "#16a34a"
                            : "#dc2626",
                        borderRadius: "10px",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    {subject.present} of{" "}
                    {subject.total} classes present
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================================= */}
        {/* UPCOMING EXAMINATIONS */}
        {/* ================================= */}

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.06)",
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
            <h2
              style={{
                color: "#2563eb",
                margin: 0,
              }}
            >
              Upcoming Examinations
            </h2>

            <Link
              href="/examinations"
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              View All →
            </Link>
          </div>

          {displayedUpcomingExams.length === 0 ? (
            <p style={{ color: "#666" }}>
              No upcoming examinations.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {displayedUpcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "18px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      {exam.subjectName}
                    </strong>

                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#666",
                      }}
                    >
                      {exam.name}
                    </p>

                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#777",
                        fontSize: "14px",
                      }}
                    >
                      Code: {exam.subjectCode}
                    </p>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#dc2626",
                        fontWeight: "bold",
                      }}
                    >
                      {new Date(
                        exam.examDate
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#666",
                      }}
                    >
                      Total Marks: {exam.totalMarks}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================================= */}
        {/* RECENT EXAMINATION RESULTS */}
        {/* ================================= */}

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.06)",
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
            <h2
              style={{
                color: "#2563eb",
                margin: 0,
              }}
            >
              Recent Examination Results
            </h2>

            <Link
              href="/results"
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              View All →
            </Link>
          </div>

          {results.length === 0 ? (
            <p style={{ color: "#666" }}>
              No examination results available.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {results
                .slice(-5)
                .reverse()
                .map((result) => (
                  <div
                    key={result.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "18px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>
                        {result.exam.name}
                      </strong>

                      <p
                        style={{
                          margin: "5px 0 0",
                          color: "#666",
                        }}
                      >
                        Marks: {result.marks} /{" "}
                        {result.exam.totalMarks}
                      </p>
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color:
                          result.grade === "A" ||
                          result.grade === "A+"
                            ? "#16a34a"
                            : "#2563eb",
                      }}
                    >
                      {result.grade || "N/A"}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ================================= */}
        {/* STUDENT SERVICES */}
        {/* ================================= */}

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            boxShadow:
              "0 5px 20px rgba(0,0,0,0.06)",
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
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <Link
              href="/profile"
              style={{
                background: "#2563eb",
                color: "white",
                padding: "18px",
                borderRadius: "10px",
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
                borderRadius: "10px",
                textAlign: "center",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Attendance
            </Link>

            <Link
              href="/examinations"
              style={{
                background: "#7c3aed",
                color: "white",
                padding: "18px",
                borderRadius: "10px",
                textAlign: "center",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Examinations
            </Link>

            <Link
              href="/results"
              style={{
                background: "#ea580c",
                color: "white",
                padding: "18px",
                borderRadius: "10px",
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
                borderRadius: "10px",
                textAlign: "center",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Fees
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
