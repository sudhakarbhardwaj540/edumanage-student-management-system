
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../../src/prisma/db";
import { getSession } from "../../../lib/session";
import LogoutButton from "../../../components/LogoutButton";

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f7fb",
  padding: "35px",
  fontFamily: "Arial, sans-serif",
  color: "#1f2937",
};

const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "14px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
};

const thStyle = {
  padding: "14px",
  textAlign: "left",
  background: "#eff6ff",
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #e5e7eb",
};

export default async function TeacherDashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "teacher") {
    redirect("/dashboard");
  }

  const teacher = await db.orm.public.Teacher
    .where({ userId: session.userId })
    .include("user")
    .first();

  if (!teacher) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1>Teacher Profile Not Found</h1>
          <p>
            Your login is valid, but no teacher profile is
            linked to this account.
          </p>
          <Link href="/login">Back to Login</Link>
        </section>
      </main>
    );
  }

  // Get courses assigned to this teacher.
  const courses = await db.orm.public.Course
    .where({ teacherId: teacher.id })
    .include("department")
    .all();

  // Get students enrolled in the teacher's courses.
  const studentMap = new Map();

  for (const course of courses) {
    const enrollments = await db.orm.public.Enrollment
      .where({ courseId: course.id })
      .include("student")
      .all();

    for (const enrollment of enrollments) {
      const student = enrollment.student;

      if (!student) {
        continue;
      }

      const studentUser = await db.orm.public.User
        .where({ id: student.userId })
        .first();

      studentMap.set(student.id, {
        id: student.id,
        name: studentUser?.name || "Name not available",
        email: studentUser?.email || "Email not available",
        rollNumber: student.rollNumber,
        department: student.department,
        semester: student.semester,
        courseName: course.name,
      });
    }
  }

  const students = Array.from(studentMap.values());

  return (
    <main style={pageStyle}>
      {/* Teacher header */}
      <header
        style={{
          ...cardStyle,
          background: "#2563eb",
          color: "white",
          marginBottom: "25px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <p>Teacher Portal</p>
          <h1>Welcome, {teacher.user.name} 👋</h1>
          <p>Employee ID: {teacher.employeeId}</p>
          <p>
            Department: {teacher.department || "Not assigned"}
          </p>
        </div>

        <LogoutButton />
      </header>

      {/* Dashboard statistics */}
      <section style={{ ...cardStyle, marginBottom: "25px" }}>
        <h2 style={{ color: "#2563eb", marginTop: 0 }}>
          Teacher Dashboard
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "18px",
          }}
        >
          <div style={cardStyle}>
            <p>Assigned Courses</p>
            <h2 style={{ color: "#2563eb" }}>
              {courses.length}
            </h2>
          </div>

          <div style={cardStyle}>
            <p>Enrolled Students</p>
            <h2 style={{ color: "#059669" }}>
              {students.length}
            </h2>
          </div>

          <div style={cardStyle}>
            <p>Employee ID</p>
            <h2 style={{ color: "#7c3aed" }}>
              {teacher.employeeId}
            </h2>
          </div>
        </div>
      </section>

      {/* Assigned courses */}
      <section style={{ ...cardStyle, marginBottom: "25px" }}>
        <h2 style={{ color: "#2563eb", marginTop: 0 }}>
          My Assigned Courses
        </h2>

        {courses.length === 0 ? (
          <p>No courses are assigned to you yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            {courses.map((course) => (
              <article
                key={course.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "22px",
                  background: "#f9fafb",
                }}
              >
                <h3 style={{ color: "#2563eb" }}>
                  {course.name}
                </h3>

                <p>
                  <strong>Course Code:</strong> {course.code}
                </p>

                <p>
                  <strong>Department:</strong>{" "}
                  {course.department?.name || "Not assigned"}
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {course.duration
                    ? `${course.duration} years`
                    : "Not specified"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Student list */}
      <section style={cardStyle}>
        <h2 style={{ color: "#2563eb", marginTop: 0 }}>
          My Students
        </h2>

        <p>Total Students: {students.length}</p>

        {students.length === 0 ? (
          <p>
            No students are enrolled in your assigned courses
            yet. Students will appear here after enrollment.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                background: "white",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Roll Number</th>
                  <th style={thStyle}>Student Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Semester</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={tdStyle}>
                      {student.rollNumber}
                    </td>
                    <td style={tdStyle}>{student.name}</td>
                    <td style={tdStyle}>{student.email}</td>
                    <td style={tdStyle}>{student.courseName}</td>
                    <td style={tdStyle}>
                      {student.semester
                        ? `${student.semester}th Semester`
                        : "Not specified"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
