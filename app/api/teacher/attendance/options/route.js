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

    const courses = await db.orm.public.Course
      .where({ teacherId: teacher.id })
      .include("department")
      .all();

    const { searchParams } = new URL(request.url);
    const courseId = Number(searchParams.get("courseId"));

    let subjects = [];

    if (Number.isInteger(courseId) && courseId > 0) {
      const selectedCourse = courses.find(
        (course) => course.id === courseId
      );

      if (!selectedCourse) {
        return Response.json(
          { message: "Course not assigned to this teacher." },
          { status: 403 }
        );
      }

      subjects = await db.orm.public.Subject
        .where({ courseId })
        .all();
    }

    return Response.json({ courses, subjects });
  } catch (error) {
    console.error("Attendance options error:", error);

    return Response.json(
      { message: "Unable to load courses and subjects." },
      { status: 500 }
    );
  }
}