import { deleteSession } from "../../../lib/session";

export async function POST() {
  try {
    await deleteSession();

    return Response.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Logout failed",
      },
      { status: 500 }
    );
  }
}
