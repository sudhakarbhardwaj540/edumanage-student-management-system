
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../../src/prisma/db";
import { getSession } from "../../../lib/session";
import MarksEntry from "./MarksEntry";

export default async function TeacherExaminationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "teacher") {
    redirect("/dashboard");
  }

  const teacher = await db.orm.public.Teacher
    .where({ userId: session.userId })
    .first();

  if (!teacher) {
    return (
      <main style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
        <h1>Teacher profile not found</h1>
        <p>Please contact the administrator to check your teacher account.</p>
      </main>
    );
  }

  const courses = await db.orm.public.Course
    .where({ teacherId: teacher.id })
    .include("department")
    .all();

  const courseDetails = await Promise.all(
    courses.map(async (course) => {
      const subjects = await db.orm.public.Subject
        .where({ courseId: course.id })
        .all();

      return {
        ...course,
        subjects,
      };
    })
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "35px",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
            Examination &amp; Marks Management
          </h1>
          <p style={{ marginBottom: 0 }}>
            Manage examinations, enter student marks, and review results.
          </p>
        </header>

        <section
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "14px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ color: "#2563eb", marginTop: 0 }}>
            Assigned Courses
          </h2>

          {courseDetails.length === 0 ? (
            <p>No courses are currently assigned to you.</p>
          ) : (
            courseDetails.map((course) => (
              <article
                key={course.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "20px",
                  marginTop: "18px",
                  background: "#ffffff",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{course.name}</h3>

                <p>
                  <strong>Course Code:</strong> {course.code}
                </p>

                <p>
                  <strong>Department:</strong>{" "}
                  {course.department?.name || "Not specified"}
                </p>

                <h4>Subjects</h4>

                {course.subjects.length === 0 ? (
                  <p>No subjects found for this course.</p>
                ) : (
                  <ul>
                    {course.subjects.map((subject) => (
                      <li key={subject.id} style={{ marginBottom: "6px" }}>
                        {subject.name} ({subject.code}) — {subject.credits} credits
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))
          )}
        </section>

        <MarksEntry courses={courseDetails} />

        <div style={{ marginTop: "24px" }}>
          <Link
            href="/teacher/dashboard"
            style={{
              display: "inline-block",
              background: "#2563eb",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            ← Back to Teacher Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
