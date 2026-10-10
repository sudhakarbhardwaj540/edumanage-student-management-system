import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../src/prisma/db";
import { getSession } from "../../lib/session";

export default async function AttendancePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const student = await db.orm.public.Student
    .where({ userId: session.userId })
    .include("user")
    .first();

  if (!student) {
    redirect("/login");
  }

  const attendanceRecords = await db.orm.public.Attendance
    .where({ studentId: student.id })
    .include("subject")
    .all();

  // Overall attendance
  const totalClasses = attendanceRecords.length;

  const presentClasses = attendanceRecords.filter(
    (record) => record.status === "Present"
  ).length;

  const attendancePercentage =
    totalClasses > 0
      ? Math.round((presentClasses / totalClasses) * 100)
      : 0;

  // Subject-wise attendance
  const subjectMap = {};

  attendanceRecords.forEach((record) => {
    const subjectId =
      record.subject?.id ||
      record.subjectId ||
      record.subject?.code ||
      record.subject?.name ||
      `record-${record.id}`;

    if (!subjectMap[subjectId]) {
      subjectMap[subjectId] = {
        id: subjectId,
        subject: record.subject,
        total: 0,
        present: 0,
      };
    }

    subjectMap[subjectId].total += 1;

    if (record.status === "Present") {
      subjectMap[subjectId].present += 1;
    }
  });

  const subjectAttendance = Object.values(subjectMap).map(
    (item) => {
      const percentage =
        item.total > 0
          ? Math.round((item.present / item.total) * 100)
          : 0;

      return {
        ...item,
        percentage,
      };
    }
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#2563eb",
            color: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                opacity: 0.9,
              }}
            >
              Attendance
            </p>

            <h1
              style={{
                margin: "10px 0",
                fontSize: "32px",
              }}
            >
              {student.user.name}'s Attendance
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: "16px",
                opacity: 0.9,
              }}
            >
              Roll Number: {student.rollNumber}
            </p>
          </div>

          <Link
            href="/dashboard"
            style={{
              background: "white",
              color: "#2563eb",
              padding: "13px 22px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Overall Attendance */}
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  color: "#2563eb",
                  margin: 0,
                }}
              >
                Overall Attendance
              </h2>

              <p
                style={{
                  color: "#6b7280",
                  marginBottom: "10px",
                }}
              >
                Attendance Percentage
              </p>

              <div
                style={{
                  fontSize: "42px",
                  color:
                    attendancePercentage >= 75
                      ? "#16a34a"
                      : "#dc2626",
                  fontWeight: "bold",
                }}
              >
                {attendancePercentage}%
              </div>
            </div>

            <div
              style={{
                color: "#6b7280",
                fontSize: "16px",
              }}
            >
              {presentClasses} of {totalClasses} classes present
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "14px",
              background: "#e5e7eb",
              borderRadius: "10px",
              marginTop: "25px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${attendancePercentage}%`,
                height: "100%",
                background:
                  attendancePercentage >= 75
                    ? "#16a34a"
                    : "#dc2626",
                borderRadius: "10px",
              }}
            />
          </div>
        </div>

        {/* Subject-wise Attendance */}
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              color: "#2563eb",
              marginTop: 0,
            }}
          >
            Subject-wise Attendance
          </h2>

          {subjectAttendance.length === 0 ? (
            <div
              style={{
                padding: "25px",
                background: "#f8fafc",
                borderRadius: "10px",
                color: "#6b7280",
              }}
            >
              No attendance records available.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "18px",
              }}
            >
              {subjectAttendance.map((item) => {
                const subjectName =
                  item.subject?.name ||
                  item.subject?.code ||
                  "Unknown Subject";

                const subjectCode =
                  item.subject?.code || "";

                const progressColor =
                  item.percentage >= 75
                    ? "#16a34a"
                    : "#dc2626";

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#f8fafc",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "15px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            color: "#374151",
                          }}
                        >
                          {subjectName}
                        </h3>

                        {subjectCode && (
                          <p
                            style={{
                              margin:
                                "8px 0 0",
                              color: "#6b7280",
                            }}
                          >
                            {subjectCode}
                          </p>
                        )}
                      </div>

                      <strong
                        style={{
                          fontSize: "22px",
                          color: progressColor,
                        }}
                      >
                        {item.percentage}%
                      </strong>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "12px",
                        background: "#e5e7eb",
                        borderRadius: "10px",
                        marginTop: "15px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${item.percentage}%`,
                          height: "100%",
                          background: progressColor,
                          borderRadius: "10px",
                        }}
                      />
                    </div>

                    <p
                      style={{
                        margin: "10px 0 0",
                        color: "#6b7280",
                        fontSize: "14px",
                      }}
                    >
                      {item.present} of {item.total} classes
                      present
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              color: "#2563eb",
              marginTop: 0,
            }}
          >
            Attendance History
          </h2>

          {attendanceRecords.length === 0 ? (
            <p
              style={{
                color: "#6b7280",
              }}
            >
              No attendance history available.
            </p>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "650px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#eff6ff",
                    }}
                  >
                    <th style={headerStyle}>
                      #
                    </th>

                    <th style={headerStyle}>
                      Date
                    </th>

                    <th style={headerStyle}>
                      Subject
                    </th>

                    <th style={headerStyle}>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceRecords.map(
                    (record, index) => {
                      const subjectName =
                        record.subject?.name ||
                        record.subject?.code ||
                        "Unknown Subject";

                      const isPresent =
                        record.status ===
                        "Present";

                      return (
                        <tr key={record.id}>
                          <td
                            style={cellStyle}
                          >
                            {index + 1}
                          </td>

                          <td
                            style={cellStyle}
                          >
                            {record.date}
                          </td>

                          <td
                            style={cellStyle}
                          >
                            {subjectName}
                          </td>

                          <td
                            style={cellStyle}
                          >
                            <span
                              style={{
                                display:
                                  "inline-block",
                                padding:
                                  "6px 14px",
                                borderRadius:
                                  "20px",
                                fontWeight:
                                  "bold",
                                background:
                                  isPresent
                                    ? "#dcfce7"
                                    : "#fee2e2",
                                color:
                                  isPresent
                                    ? "#166534"
                                    : "#991b1b",
                              }}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Student Services */}
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              color: "#2563eb",
              marginTop: 0,
            }}
          >
            Student Services
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <ServiceLink
              href="/dashboard"
              text="Dashboard"
            />

            <ServiceLink
              href="/profile"
              text="My Profile"
            />

            <ServiceLink
              href="/examinations"
              text="Examinations"
            />

            <ServiceLink
              href="/results"
              text="Results"
            />

            <ServiceLink
              href="/fees"
              text="Fees"
            />
          </div>
        </div>
      </div>
    </main>
  );
}


/* Service Link */

function ServiceLink({ href, text }) {
  return (
    <Link
      href={href}
      style={{
        background: "#2563eb",
        color: "white",
        padding: "11px 18px",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      {text}
    </Link>
  );
}


/* Table Header */

const headerStyle = {
  padding: "15px",
  textAlign: "left",
  borderBottom: "2px solid #dbeafe",
  color: "#1e40af",
  fontSize: "14px",
};


/* Table Cell */

const cellStyle = {
  padding: "15px",
  borderBottom: "1px solid #e5e7eb",
  color: "#374151",
  fontSize: "14px",
};