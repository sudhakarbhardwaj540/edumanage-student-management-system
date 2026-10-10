
"use client";

import { useEffect, useState } from "react";

export default function MarksEntry({ courses = [] }) {
  const [courseId, setCourseId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examId, setExamId] = useState("");
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCourse = courses.find(
    (course) => String(course.id) === String(courseId)
  );

  const subjects = selectedCourse?.subjects || [];

  const selectedExam = exams.find(
    (exam) => String(exam.id) === String(examId)
  );

  // Load examinations when the subject changes.
  useEffect(() => {
    if (!subjectId) return;

    let cancelled = false;

    async function loadExams() {
      setLoadingExams(true);

      try {
        const response = await fetch(
          `/api/teacher/examinations?subjectId=${encodeURIComponent(subjectId)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load examinations.");
        }

        if (!cancelled) {
          setExams(Array.isArray(data.exams) ? data.exams : []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setExams([]);
          setError(err.message || "Could not load examinations.");
        }
      } finally {
        if (!cancelled) {
          setLoadingExams(false);
        }
      }
    }

    loadExams();

    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  // Load enrolled students and, if supported, previously saved marks.
  useEffect(() => {
    if (!examId || !courseId) return;

    let cancelled = false;

    async function loadStudents() {
      setLoadingStudents(true);

      try {
        const response = await fetch(
          `/api/teacher/examinations/students?courseId=${encodeURIComponent(courseId)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Could not load enrolled students."
          );
        }

        const studentList = Array.isArray(data.students)
          ? data.students
          : [];

        if (cancelled) return;

        setStudents(studentList);

        // The marks API needs a GET handler to prefill saved marks.
        // If GET is unavailable, students can still enter and save marks.
        try {
          const marksResponse = await fetch(
            `/api/teacher/examinations/marks?examId=${encodeURIComponent(examId)}`
          );

          const marksData = await marksResponse.json();

          if (marksResponse.ok && Array.isArray(marksData.marks)) {
            const savedMarks = {};

            for (const item of marksData.marks) {
              savedMarks[String(item.studentId)] = String(item.marks);
            }

            if (!cancelled) {
              setMarks(savedMarks);
            }
          } else if (!cancelled) {
            setMarks({});
          }
        } catch {
          if (!cancelled) {
            setMarks({});
          }
        }

        if (!cancelled) {
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setStudents([]);
          setMarks({});
          setError(err.message || "Could not load students.");
        }
      } finally {
        if (!cancelled) {
          setLoadingStudents(false);
        }
      }
    }

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [examId, courseId]);

  function handleCourseChange(event) {
    setCourseId(event.target.value);
    setSubjectId("");
    setExamId("");
    setExams([]);
    setStudents([]);
    setMarks({});
    setMessage("");
    setError("");
  }

  function handleSubjectChange(event) {
    setSubjectId(event.target.value);
    setExamId("");
    setExams([]);
    setStudents([]);
    setMarks({});
    setMessage("");
    setError("");
  }

  function handleExamChange(event) {
    setExamId(event.target.value);
    setStudents([]);
    setMarks({});
    setMessage("");
    setError("");
  }

  function handleMarkChange(studentId, value) {
    setMarks((previous) => ({
      ...previous,
      [String(studentId)]: value,
    }));

    setMessage("");
    setError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!examId || students.length === 0) {
      setError("Select an examination with enrolled students first.");
      return;
    }

    const maxMarks = Number(selectedExam?.totalMarks);

    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
      setError("The examination has an invalid maximum marks value.");
      return;
    }

    const entries = [];

    for (const student of students) {
      const rawValue = marks[String(student.id)];

      if (rawValue === undefined || String(rawValue).trim() === "") {
        setError(
          `Enter marks for ${student.name || student.rollNumber}.`
        );
        return;
      }

      const value = Number(rawValue);

      if (
        !Number.isFinite(value) ||
        value < 0 ||
        value > maxMarks
      ) {
        setError(
          `Marks for ${student.name || student.rollNumber} must be between 0 and ${maxMarks}.`
        );
        return;
      }

      entries.push({
        studentId: Number(student.id),
        marks: value,
      });
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/teacher/examinations/marks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            examId: Number(examId),
            marks: entries,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save marks.");
      }

      setMessage(data.message || "Marks saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save marks.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
    color: "#1f2937",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontWeight: 600,
    marginBottom: "8px",
    color: "#374151",
  };

  const cellStyle = {
    padding: "13px 12px",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "left",
  };

  return (
    <section
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "14px",
        boxShadow: "0 4px 18px rgba(15, 23, 42, 0.05)",
        marginTop: "24px",
      }}
    >
      <h2 style={{ fontSize: "22px", marginBottom: "8px", color: "#1d4ed8" }}>
        Student Marks Entry
      </h2>

      <p style={{ color: "#64748b", marginBottom: "24px" }}>
        Select a course, subject, and examination, then enter each student&apos;s marks 
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        <div>
          <label htmlFor="marks-course" style={labelStyle}>
            Course
          </label>
          <select
            id="marks-course"
            value={courseId}
            onChange={handleCourseChange}
            style={inputStyle}
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="marks-subject" style={labelStyle}>
            Subject
          </label>
          <select
            id="marks-subject"
            value={subjectId}
            onChange={handleSubjectChange}
            disabled={!courseId}
            style={inputStyle}
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
          <label htmlFor="marks-exam" style={labelStyle}>
            Examination
          </label>
          <select
            id="marks-exam"
            value={examId}
            onChange={handleExamChange}
            disabled={!subjectId || loadingExams}
            style={inputStyle}
          >
            <option value="">
              {loadingExams ? "Loading examinations..." : "Select examination"}
            </option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} — {exam.totalMarks} marks
              </option>
            ))}
          </select>
        </div>
      </div>

      {subjectId && !loadingExams && exams.length === 0 && !error && (
        <p style={{ color: "#64748b", marginBottom: "18px" }}>
          No examinations were found for this subject.
        </p>
      )}

      {selectedExam && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#1e40af",
          }}
        >
          <strong>{selectedExam.name}</strong>
          <div style={{ marginTop: "5px" }}>
            Maximum marks: {selectedExam.totalMarks}
            {selectedExam.examDate ? ` · Date: ${selectedExam.examDate}` : ""}
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: "#fef2f2",
            color: "#b91c1c",
            marginBottom: "18px",
          }}
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: "#f0fdf4",
            color: "#166534",
            marginBottom: "18px",
          }}
        >
          {message}
        </p>
      )}

      {loadingStudents && (
        <p>Loading enrolled students and saved marks...</p>
      )}

      {examId && !loadingStudents && students.length === 0 && !error && (
        <p style={{ color: "#64748b" }}>
          No enrolled students were found for this course.
        </p>
      )}

      {examId && !loadingStudents && students.length > 0 && (
        <form onSubmit={handleSave}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "560px",
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Roll Number", "Student Name", "Email", "Marks"].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          ...cellStyle,
                          fontSize: "13px",
                          color: "#475569",
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={cellStyle}>{student.rollNumber}</td>
                    <td style={cellStyle}>{student.name}</td>
                    <td style={cellStyle}>{student.email}</td>
                    <td style={cellStyle}>
                      <input
                        type="number"
                        min="0"
                        max={selectedExam?.totalMarks ?? 0}
                        step="0.01"
                        required
                        aria-label={`Marks for ${student.name}`}
                        value={marks[String(student.id)] ?? ""}
                        onChange={(event) =>
                          handleMarkChange(student.id, event.target.value)
                        }
                        style={{ ...inputStyle, maxWidth: "120px" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "22px",
              background: saving ? "#93c5fd" : "#2563eb",
              color: "#fff",
              border: "none",
              padding: "12px 22px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving Marks..." : "Save Marks"}
          </button>
        </form>
      )}
    </section>
  );
}
