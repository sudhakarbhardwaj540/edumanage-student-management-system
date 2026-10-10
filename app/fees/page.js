
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../src/prisma/db";
import { getSession } from "../../lib/session";

export default async function FeesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const student = await db.orm.public.Student
    .where({ userId: session.userId })
    .first();

  if (!student) {
    redirect("/login");
  }

  const fees = await db.orm.public.Fee
    .where({ studentId: student.id })
    .all();

  const totalFees = fees.reduce(
    (sum, fee) => sum + Number(fee.amount),
    0
  );

  const paidFees = fees
    .filter((fee) => fee.status === "Paid")
    .reduce((sum, fee) => sum + Number(fee.amount), 0);

  const pendingFees = fees
    .filter((fee) => fee.status !== "Paid")
    .reduce((sum, fee) => sum + Number(fee.amount), 0);

  const formatCurrency = (amount) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date instanceof Date) return date.toLocaleDateString("en-CA");
    return String(date);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "32px 20px",
        fontFamily: "Arial, sans-serif",
        color: "#1e293b",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header
          style={{
            background: "#1d4ed8",
            color: "#ffffff",
            padding: "30px",
            borderRadius: "16px",
            marginBottom: "24px",
            boxShadow: "0 8px 24px rgba(37, 99, 235, 0.15)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "30px" }}>Fees</h1>
          <p style={{ color: "#dbeafe", marginBottom: 0, lineHeight: 1.6 }}>
            View your fee details and payment status
          </p>
        </header>

        <section
          aria-label="Fee summary"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          {[
            { label: "Total Fees", amount: totalFees, color: "#1d4ed8" },
            { label: "Paid", amount: paidFees, color: "#15803d" },
            { label: "Pending", amount: pendingFees, color: "#b91c1c" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#ffffff",
                padding: "24px",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.05)",
              }}
            >
              <p
                style={{
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: 600,
                  margin: "0 0 12px",
                }}
              >
                {item.label}
              </p>
              <h2
                style={{
                  color: item.color,
                  fontSize: "27px",
                  margin: 0,
                }}
              >
                {formatCurrency(item.amount)}
              </h2>
            </div>
          ))}
        </section>

        <section
          style={{
            background: "#ffffff",
            padding: "26px",
            borderRadius: "14px",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
          }}
        >
          <h2
            style={{
              color: "#0f172a",
              fontSize: "21px",
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            Fee Details
          </h2>

          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "20px" }}>
            Review your fee amounts, payment status, and due dates.
          </p>

          {fees.length === 0 ? (
            <p style={{ color: "#475569" }}>No fee records found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "580px",
                  borderCollapse: "collapse",
                  color: "#334155",
                }}
              >
                <thead>
                  <tr style={{ background: "#eff6ff" }}>
                    {["Description", "Amount", "Status", "Due Date"].map(
                      (heading) => (
                        <th
                          key={heading}
                          style={{
                            textAlign: "left",
                            padding: "15px 12px",
                            color: "#1e40af",
                            fontSize: "14px",
                            fontWeight: 700,
                            borderBottom: "2px solid #dbeafe",
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {fees.map((fee) => {
                    const isPaid = fee.status === "Paid";

                    return (
                      <tr key={fee.id}>
                        <td
                          style={{
                            padding: "16px 12px",
                            color: "#0f172a",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          {fee.description || "Fee"}
                        </td>

                        <td
                          style={{
                            padding: "16px 12px",
                            color: "#0f172a",
                            fontWeight: 600,
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          {formatCurrency(Number(fee.amount))}
                        </td>

                        <td
                          style={{
                            padding: "16px 12px",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 11px",
                              borderRadius: "20px",
                              background: isPaid ? "#dcfce7" : "#fee2e2",
                              color: isPaid ? "#166534" : "#991b1b",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            {fee.status}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: "16px 12px",
                            color: "#475569",
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          {formatDate(fee.dueDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: "26px",
              background: "#1d4ed8",
              color: "#ffffff",
              padding: "13px 22px",
              borderRadius: "9px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to Dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}
