import { db } from "../../../../../src/prisma/db";
import { getSession } from "../../../../../lib/session";

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session) {
      return Response.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    if (session.role !== "teacher") {
      return Response.json(
        { success: false, message: "Teacher access required." },
        { status: 403 }
      );
    }

    const teacher = await db.orm.public.Teacher
      .where({ userId: session.userId })
      .first();

    if (!teacher) {
      return Response.json(
        { success: false, message: "Teacher profile not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { courseId, subjectId, date, attendance } = body;

    const numericCourseId = Number(courseId);
    const numericSubjectId = Number(subjectId);

    if (
      !Number.isSafeInteger(numericCourseId) ||
      numericCourseId <= 0 ||
      !Number.isSafeInteger(numericSubjectId) ||
      numericSubjectId <= 0 ||
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Array.isArray(attendance) ||
      attendance.length === 0
    ) {
      return Response.json(
        { success: false, message: "Invalid attendance details." },
        { status: 400 }
      );
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return Response.json(
        { success: false, message: "Invalid attendance date." },
        { status: 400 }
      );
    }

    const course = await db.orm.public.Course
      .where({
        id: numericCourseId,
        teacherId: teacher.id,
      })
      .first();

    if (!course) {
      return Response.json(
        { success: false, message: "This course is not assigned to you." },
        { status: 403 }
      );
    }

    const subject = await db.orm.public.Subject
      .where({
        id: numericSubjectId,
        courseId: numericCourseId,
      })
      .first();

    if (!subject) {
      return Response.json(
        { success: false, message: "Subject does not belong to this course." },
        { status: 400 }
      );
    }

    const validStatuses = ["Present", "Absent"];
    const seenStudentIds = new Set();

    // Validate all students before saving any attendance.
    for (const item of attendance) {
      const studentId = Number(item?.studentId);

      if (
        !Number.isSafeInteger(studentId) ||
        studentId <= 0 ||
        !validStatuses.includes(item?.status)
      ) {
        return Response.json(
          { success: false, message: "Invalid student ID or status." },
          { status: 400 }
        );
      }

      if (seenStudentIds.has(studentId)) {
        return Response.json(
          { success: false, message: "Duplicate student in request." },
          { status: 400 }
        );
      }

      seenStudentIds.add(studentId);

      const enrollment = await db.orm.public.Enrollment
        .where({
          studentId,
          courseId: numericCourseId,
        })
        .first();

      if (!enrollment) {
        return Response.json(
          {
            success: false,
            message: `Student ID ${studentId} is not enrolled in this course.`,
          },
          { status: 400 }
        );
      }
    }

    let created = 0;
    let updated = 0;

    for (const item of attendance) {
      const studentId = Number(item.studentId);

      const existing = await db.orm.public.Attendance
        .where({
          studentId,
          courseId: numericCourseId,
          subjectId: numericSubjectId,
          date,
        })
        .first();

      if (existing) {
        await db.orm.public.Attendance
          .where({ id: existing.id })
          .update({ status: item.status });

        updated++;
      } else {
        await db.orm.public.Attendance.create({
          studentId,
          courseId: numericCourseId,
          subjectId: numericSubjectId,
          date,
          status: item.status,
        });

        created++;
      }
    }

    return Response.json({
      success: true,
      message: "Attendance saved successfully.",
      count: created + updated,
      created,
      updated,
    });
  } catch (error) {
    console.error("Save attendance error:", error);

    return Response.json(
      { success: false, message: "Unable to save attendance." },
      { status: 500 }
    );
  }
}