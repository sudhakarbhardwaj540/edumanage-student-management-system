
import { NextResponse } from "next/server";
import { db } from "../../../../../src/prisma/db";
import { getSession } from "../../../../../lib/session";

export async function GET(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    if (session.role !== "teacher") {
      return NextResponse.json(
        { error: "Teacher access required." },
        { status: 403 }
      );
    }

    const teacher = await db.orm.public.Teacher
      .where({ userId: session.userId })
      .first();

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = Number(searchParams.get("courseId"));

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json(
        { error: "A valid courseId is required." },
        { status: 400 }
      );
    }

    const course = await db.orm.public.Course
      .where({
        id: courseId,
        teacherId: teacher.id,
      })
      .first();

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or not assigned to you." },
        { status: 403 }
      );
    }

    const enrollments = await db.orm.public.Enrollment
      .where({
        courseId,
        status: "Active",
      })
      .all();

    const students = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await db.orm.public.Student
          .where({ id: enrollment.studentId })
          .include("user")
          .first();

        if (!student) return null;

        return {
          id: student.id,
          rollNumber: student.rollNumber,
          name: student.user?.name || "Unknown Student",
          email: student.user?.email || "",
        };
      })
    );

    return NextResponse.json({
      students: students.filter(Boolean),
    });
  } catch (error) {
    console.error("Teacher examination students API error:", error);

    return NextResponse.json(
      { error: "Unable to load enrolled students." },
      { status: 500 }
    );
  }
}
