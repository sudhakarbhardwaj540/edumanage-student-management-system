import { db } from '../../../src/prisma/db';

export async function GET() {
  try {
    const users = await db.orm.public.User.all();

    return Response.json({
      success: true,
      message: 'Database connected successfully!',
      userCount: users.length,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
