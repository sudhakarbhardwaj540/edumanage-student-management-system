import { getSession } from "../../../lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return Response.json(
      {
        authenticated: false,
        message: "No active session",
      },
      { status: 401 }
    );
  }

  return Response.json({
    authenticated: true,
    session,
  });
}
