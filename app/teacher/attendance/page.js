
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f7fb",
  padding: "35px",
  fontFamily: "Arial, sans-serif",
  color: "#1f2937",
};

const cardStyle = {
  background: "#ffffff",
  padding: "25px",
  borderRadius: "14px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
  marginBottom: "25px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
  background: "white",
};

export default function TeacherAttendancePage() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  const [courseId, setCourseId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch(
          "/api/teacher/attendance/options"
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load courses."
          );
        }

        setCourses(data.courses || []);
      } catch (err) {
        setError(true);
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  useEffect(() => {
    if (!courseId) {
      setSubjects([]);
      setStudents([]);
      setSubjectId("");
      setAttendance({});
      return;
    }

    async function loadCourseData() {
      setLoading(true);
      setMessage("");
      setError(false);
      setStudents([]);
      setAttendance({});
      setSubjectId("");

      try {
        const [optionsResponse, studentsResponse] =
          await Promise.all([
            fetch(
              `/api/teacher/attendance/options?courseId=${courseId}`
            ),
            fetch(
              `/api/teacher/attendance/students?courseId=${courseId}`
            ),
          ]);

        const optionsData = await optionsResponse.json();
        const studentsData = await studentsResponse.json();

        if (!optionsResponse.ok) {
          throw new Error(
            optionsData.message || "Unable to load subjects."
          );
        }

        if (!studentsResponse.ok) {
          throw new Error(
            studentsData.message || "Unable to load students."
          );
        }

        const studentList =
          studentsData.students ||
          studentsData.enrollments?.map(
            (enrollment) => enrollment.student
          ) ||
          [];

        setSubjects(optionsData.subjects || []);
        setStudents(studentList);
      } catch (err) {
        setError(true);
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCourseData();
  }, [courseId]);

  function markStudent(studentId, status) {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: status,
    }));
  }

  function markAll(status) {
    const updated = {};

    students.forEach((student) => {
      updated[student.id] = status;
    });

    setAttendance(updated);
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    setError(false);

    if (!courseId || !subjectId || !date) {
      setError(true);
      setMessage("Please select a course, subject, and date.");
      return;
    }

    if (students.length === 0) {
      setError(true);
      setMessage("No students are available for this course.");
      return;
    }

    const incomplete = students.some(
      (student) => !attendance[student.id]
    );

    if (incomplete) {
      setError(true);
      setMessage("Please mark every student Present or Absent.");
      return;
    }

    const attendanceList = students.map((student) => ({
      studentId: student.id,
      status: attendance[student.id],
    }));

    setSaving(true);

    try {
      const response = await fetch(
        "/api/teacher/attendance/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: Number(courseId),
            subjectId: Number(subjectId),
            date,
            attendance: attendanceList,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save attendance."
        );
      }

      setMessage(
        `Success! Attendance saved for ${data.count} students.`
      );
    } catch (err) {
      setError(true);
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  const presentCount = students.filter(
    (student) => attendance[student.id] === "Present"
  ).length;

  const absentCount = students.filter(
    (student) => attendance[student.id] === "Absent"
  ).length;

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header
          style={{
            background: "#2563eb",
            color: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
          }}
        >
          <h1 style={{ marginTop: 0 }}>
            Attendance Management
          </h1>
          <p style={{ marginBottom: 0 }}>
            Select a course and subject, mark attendance,
            and save the records.
          </p>
        </header>

        <section style={cardStyle}>
          <h2 style={{ color: "#2563eb", marginTop: 0 }}>
            Attendance Details
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label htmlFor="course">
                <strong>Course</strong>
              </label>
              <select
                id="course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                style={{ ...inputStyle, marginTop: "8px" }}
                disabled={loading}
                required
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject">
                <strong>Subject</strong>
              </label>
              <select
                id="subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                style={{ ...inputStyle, marginTop: "8px" }}
                disabled={!courseId || subjects.length === 0}
                required
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="attendanceDate">
                <strong>Attendance Date</strong>
              </label>
              <input
                id="attendanceDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ ...inputStyle, marginTop: "8px" }}
                required
              />
            </div>
          </div>
        </section>

        {message && (
          <div
            role="status"
            style={{
              ...cardStyle,
              color: error ? "#b91c1c" : "#166534",
              background: error ? "#fef2f2" : "#f0fdf4",
            }}
          >
            {message}
          </div>
        )}

        {courseId && (
          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <h2 style={{ color: "#2563eb", marginTop: 0 }}>
                Student Attendance
              </h2>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => markAll("Present")}
                  disabled={students.length === 0}
                  style={{
                    padding: "10px 15px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#dcfce7",
                    color: "#166534",
                    cursor: "pointer",
                  }}
                >
                  Mark All Present
                </button>

                <button
                  type="button"
                  onClick={() => markAll("Absent")}
                  disabled={students.length === 0}
                  style={{
                    padding: "10px 15px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    color: "#991b1b",
                    cursor: "pointer",
                  }}
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {loading ? (
              <p>Loading students...</p>
            ) : students.length === 0 ? (
              <p>
                No enrolled students found for this course.
              </p>
            ) : (
              <form onSubmit={handleSave}>
                <p>
                  Total: <strong>{students.length}</strong>
                  {" | "}
                  Present:{" "}
                  <strong style={{ color: "#16a34a" }}>
                    {presentCount}
                  </strong>
                  {" | "}
                  Absent:{" "}
                  <strong style={{ color: "#dc2626" }}>
                    {absentCount}
                  </strong>
                </p>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "600px",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#eff6ff" }}>
                        <th style={tableCell}>Roll Number</th>
                        <th style={tableCell}>Student Name</th>
                        <th style={tableCell}>Present</th>
                        <th style={tableCell}>Absent</th>
                      </tr>
                    </thead>

                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td style={tableCell}>
                            {student.rollNumber || "—"}
                          </td>
                          <td style={tableCell}>
                            {student.user?.name ||
                              student.name ||
                              "Unnamed Student"}
                          </td>
                          <td style={tableCell}>
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              checked={
                                attendance[student.id] === "Present"
                              }
                              onChange={() =>
                                markStudent(student.id, "Present")
                              }
                              aria-label={`Mark ${
                                student.user?.name || student.name
                              } present`}
                            />
                          </td>
                          <td style={tableCell}>
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              checked={
                                attendance[student.id] === "Absent"
                              }
                              onChange={() =>
                                markStudent(student.id, "Absent")
                              }
                              aria-label={`Mark ${
                                student.user?.name || student.name
                              } absent`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="submit"
                  disabled={saving || !subjectId}
                  style={{
                    marginTop: "25px",
                    padding: "14px 25px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "16px",
                    cursor: saving ? "wait" : "pointer",
                    opacity: saving || !subjectId ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </form>
            )}
          </section>
        )}

        <Link
          href="/teacher/dashboard"
          style={{
            display: "inline-block",
            background: "#ffffff",
            color: "#2563eb",
            padding: "12px 20px",
            borderRadius: "8px",
            textDecoration: "none",
            boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          ← Back to Teacher Dashboard
        </Link>
      </div>
    </main>
  );
}

const tableCell = {
  padding: "14px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
};
