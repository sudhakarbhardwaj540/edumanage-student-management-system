
import { NextResponse } from "next/server";
import { db } from "../../../../../src/prisma/db";
import { getSession } from "../../../../../lib/session";

export async function POST(request) {
  try {
    // 1. Check login
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    // 2. Check teacher role
    if (session.role !== "teacher") {
      return NextResponse.json(
        { error: "Teacher access required." },
        { status: 403 }
      );
    }

    // 3. Find teacher profile
    const teacher = await db.orm.public.Teacher
      .where({ userId: session.userId })
      .first();

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found." },
        { status: 404 }
      );
    }

    // 4. Read request body safely
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { examId, marks } = body ?? {};
    const numericExamId = Number(examId);

    if (
      examId === null ||
      examId === undefined ||
      examId === "" ||
      !Number.isInteger(numericExamId) ||
      numericExamId <= 0 ||
      !Array.isArray(marks) ||
      marks.length === 0
    ) {
      return NextResponse.json(
        { error: "A valid examId and non-empty marks list are required." },
        { status: 400 }
      );
    }

    // 5. Find examination
    const exam = await db.orm.public.Exam
      .where({ id: numericExamId })
      .first();

    if (!exam) {
      return NextResponse.json(
        { error: "Examination not found." },
        { status: 404 }
      );
    }

    const maxMarks = Number(exam.totalMarks);

    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
      return NextResponse.json(
        { error: "Invalid examination maximum marks configuration." },
        { status: 500 }
      );
    }

    // 6. Find subject
    const subject = await db.orm.public.Subject
      .where({ id: exam.subjectId })
      .first();

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found." },
        { status: 404 }
      );
    }

    // 7. Verify teacher assignment
    const course = await db.orm.public.Course
      .where({
        id: subject.courseId,
        teacherId: teacher.id,
      })
      .first();

    if (!course) {
      return NextResponse.json(
        { error: "You are not assigned to this examination's course." },
        { status: 403 }
      );
    }

    // 8. Validate all marks before saving
    const seenStudents = new Set();
    const validatedMarks = [];

    for (const entry of marks) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return NextResponse.json(
          { error: "Each marks entry must be an object." },
          { status: 400 }
        );
      }

      if (
        entry.studentId === "" ||
        entry.studentId === null ||
        entry.studentId === undefined
      ) {
        return NextResponse.json(
          { error: "A valid student ID is required." },
          { status: 400 }
        );
      }

      const studentId = Number(entry.studentId);

      if (!Number.isInteger(studentId) || studentId <= 0) {
        return NextResponse.json(
          { error: "Invalid student ID." },
          { status: 400 }
        );
      }

      if (seenStudents.has(studentId)) {
        return NextResponse.json(
          { error: `Student ${studentId} appears more than once.` },
          { status: 400 }
        );
      }

      if (
        entry.marks === "" ||
        entry.marks === null ||
        entry.marks === undefined
      ) {
        return NextResponse.json(
          { error: `Marks are required for student ${studentId}.` },
          { status: 400 }
        );
      }

      const score = Number(entry.marks);

      if (
        !Number.isFinite(score) ||
        score < 0 ||
        score > maxMarks
      ) {
        return NextResponse.json(
          {
            error: `Marks must be between 0 and ${maxMarks}.`,
          },
          { status: 400 }
        );
      }

      // Verify active enrollment
      const enrollment = await db.orm.public.Enrollment
        .where({
          studentId,
          courseId: course.id,
          status: "Active",
        })
        .first();

      if (!enrollment) {
        return NextResponse.json(
          {
            error: `Student ${studentId} is not actively enrolled in this course.`,
          },
          { status: 400 }
        );
      }

      seenStudents.add(studentId);
      validatedMarks.push({ studentId, score });
    }

    // 9. Update existing results or create new results
    let created = 0;
    let updated = 0;

    for (const entry of validatedMarks) {
      const { studentId, score } = entry;

      const percentage = (score / maxMarks) * 100;

      const grade =
  percentage >= 90 ? "A+" :
  percentage >= 80 ? "A" :
  percentage >= 70 ? "B+" :
  percentage >= 60 ? "B" :
  percentage >= 50 ? "C" :
  percentage >= 40 ? "D" : "F";


  const remarks =
  percentage >= 90 ? "Outstanding" :
  percentage >= 80 ? "Very Good" :
  percentage >= 70 ? "Good" :
  percentage >= 60 ? "Satisfactory" :
  percentage >= 50 ? "Needs Improvement" :
  percentage >= 40 ? "Pass" : "Fail";

      const existing = await db.orm.public.Result
        .where({
          studentId,
          examId: numericExamId,
        })
        .first();

      if (existing) {
        await db.orm.public.Result
          .where({ id: existing.id })
          .update({
  marks: score,
  grade,
  remarks,
});

        updated++;
      } else {
       await db.orm.public.Result.create({
  studentId,
  examId: numericExamId,
  marks: score,
  grade,
  remarks,
});

        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Examination marks saved successfully.",
      created,
      updated,
    });
  } catch (error) {
    console.error("Save examination marks error:", error);

    return NextResponse.json(
      { error: "Unable to save marks. Check the server terminal." },
      { status: 500 }
    );
  }
}



export async function GET(request) {
  try {
    // 1. Check login
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    // 2. Check teacher role
    if (session.role !== "teacher") {
      return NextResponse.json(
        { error: "Teacher access required." },
        { status: 403 }
      );
    }

    // 3. Find teacher profile
    const teacher = await db.orm.public.Teacher
      .where({ userId: session.userId })
      .first();

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher profile not found." },
        { status: 404 }
      );
    }

    // 4. Read exam ID
    const { searchParams } = new URL(request.url);
    const examIdValue = searchParams.get("examId");
    const examId = Number(examIdValue);

    if (
      !examIdValue ||
      !Number.isInteger(examId) ||
      examId <= 0
    ) {
      return NextResponse.json(
        { error: "A valid examId is required." },
        { status: 400 }
      );
    }

    // 5. Find examination
    const exam = await db.orm.public.Exam
      .where({ id: examId })
      .first();

    if (!exam) {
      return NextResponse.json(
        { error: "Examination not found." },
        { status: 404 }
      );
    }

    // 6. Verify subject and teacher assignment
    const subject = await db.orm.public.Subject
      .where({ id: exam.subjectId })
      .first();

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found." },
        { status: 404 }
      );
    }

    const course = await db.orm.public.Course
      .where({
        id: subject.courseId,
        teacherId: teacher.id,
      })
      .first();

    if (!course) {
      return NextResponse.json(
        { error: "You are not assigned to this examination's course." },
        { status: 403 }
      );
    }

    // 7. Load saved marks for this examination
    const results = await db.orm.public.Result
      .where({ examId })
      .all();

    return NextResponse.json({
      success: true,
      marks: results.map((result) => ({
        studentId: result.studentId,
        marks: result.marks,
        grade: result.grade,
        remarks: result.remarks,
      })),
    });
  } catch (error) {
    console.error("Load examination marks error:", error);

    return NextResponse.json(
      { error: "Unable to load saved marks." },
      { status: 500 }
    );
  }
}
