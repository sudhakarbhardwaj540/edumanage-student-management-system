
import { db } from "../../../../../src/prisma/db";
import { getSession } from "../../../../../lib/session";

export async function GET(request) {
  try {
    const session = await getSession();

    if (!session) {
      return Response.json(
        { message: "Please log in first." },
        { status: 401 }
      );
    }

    if (session.role !== "teacher") {
      return Response.json(
        { message: "Teacher access required." },
        { status: 403 }
      );
    }

    const teacher = await db.orm.public.Teacher
      .where({ userId: session.userId })
      .first();

    if (!teacher) {
      return Response.json(
        { message: "Teacher profile not found." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = Number(searchParams.get("courseId"));

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return Response.json(
        { message: "A valid course is required." },
        { status: 400 }
      );
    }

    const course = await db.orm.public.Course
      .where({ id: courseId, teacherId: teacher.id })
      .first();

    if (!course) {
      return Response.json(
        { message: "This course is not assigned to you." },
        { status: 403 }
      );
    }

    const subjects = await db.orm.public.Subject
      .where({ courseId })
      .all();

    const enrollments = await db.orm.public.Enrollment
      .where({ courseId })
      .all();

    const students = [];

    for (const enrollment of enrollments) {
      const student = await db.orm.public.Student
        .where({ id: enrollment.studentId })
        .include("user")
        .first();

      if (student) {
        students.push({
          id: student.id,
          rollNumber: student.rollNumber,
          name: student.user.name,
          email: student.user.email,
        });
      }
    }

    return Response.json({
      success: true,
      subjects,
      students,
    });
  } catch (error) {
    console.error("Load attendance students error:", error);

    return Response.json(
      { message: "Could not load students and subjects." },
      { status: 500 }
    );
  }
}
