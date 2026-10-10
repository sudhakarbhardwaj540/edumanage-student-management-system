
import { NextResponse } from "next/server";
import { db } from "../../../../src/prisma/db";
import { getSession } from "../../../../lib/session";

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
    const subjectId = Number(searchParams.get("subjectId"));

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      return NextResponse.json(
        { error: "A valid subjectId is required." },
        { status: 400 }
      );
    }

    const subject = await db.orm.public.Subject
      .where({ id: subjectId })
      .first();

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found." },
        { status: 404 }
      );
    }

    const assignedCourse = await db.orm.public.Course
      .where({
        id: subject.courseId,
        teacherId: teacher.id,
      })
      .first();

    if (!assignedCourse) {
      return NextResponse.json(
        { error: "This subject is not in your assigned courses." },
        { status: 403 }
      );
    }

    const exams = await db.orm.public.Exam
      .where({ subjectId })
      .all();

    return NextResponse.json({ exams });
  } catch (error) {
    console.error("Teacher examinations API error:", error);

    return NextResponse.json(
      { error: "Unable to load examinations." },
      { status: 500 }
    );
  }
}
