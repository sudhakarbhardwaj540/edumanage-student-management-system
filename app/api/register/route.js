import { db } from '../../../src/prisma/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();

    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return Response.json(
        {
          success: false,
          message: 'All fields are required',
        },
        { status: 400 }
      );
    }

    const existingUser = await db.orm.public.User
      .where({ email })
      .first();

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: 'User already exists',
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.orm.public.User.create({
      email,
      password: hashedPassword,
      name,
      role,
    });

    return Response.json(
      {
        success: true,
        message: 'User registered successfully!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: 'Registration failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
