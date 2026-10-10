
# EduManage — Student Management System

A web-based Student Management System built with Next.js and PostgreSQL to manage student information, attendance, examinations, results, and fees.

## Features

### Student Portal
- Student dashboard
- Student profile
- Attendance records
- Examination schedule
- Examination results, grades, and remarks
- Fee details and payment status

### Teacher Portal
- Teacher dashboard
- Assigned course and student information
- Attendance management
- Examination marks entry
- Loading and updating existing marks

### Security and Validation
- Login and session management
- Role-based access for students and teachers
- Protected teacher pages and APIs
- Marks validation against examination maximums
- Active enrollment verification
- Duplicate result prevention using a database constraint

## Technology Stack

- Next.js
- React
- JavaScript
- PostgreSQL
- Prisma
- Tailwind CSS
- Node.js

## Project Structure

```text
student-management-system/
├── app/
│   ├── api/
│   ├── dashboard/
│   ├── profile/
│   ├── attendance/
│   ├── examinations/
│   ├── results/
│   ├── fees/
│   └── teacher/
├── lib/
├── src/
│   └── prisma/
├── public/
├── package.json
├── prisma.config.ts
└── README.md
```

## Prerequisites

- Node.js and npm
- PostgreSQL
- A configured database
- Required environment variables

## Installation

Clone or copy the project into your local machine, then open a terminal in the project directory.

Install dependencies:

```bash
npm install
```

## Environment Configuration

Create or update the `.env` file in the project root using your local configuration.

Required values include:

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Secret used for session security

Never commit `.env` or publish database passwords and session secrets.

## Database Setup

1. Start PostgreSQL.
2. Create the project database.
3. Configure `DATABASE_URL`.
4. Ensure the database schema and required tables are set up.
5. Ensure the Prisma configuration points to the correct schema.

Use the database setup procedure configured for this project. Do not reset the database if it contains existing project data.

## Run the Application

Start the development server:

```bash
npm run dev
```

Open:

http://localhost:3000

## Production Build

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Testing

The following checks have been performed during development:

- Student and teacher pages load successfully.
- Teacher attendance can be saved.
- Examination marks can be saved and loaded.
- Marks above the examination maximum are rejected.
- Negative marks are rejected.
- Student access to teacher marks endpoints is denied.
- Duplicate result records were checked.
- A unique database constraint was added for student and examination results.
- The production build completed successfully.

## Database Integrity

The Result table uses a unique constraint on:

`studentId + examId`

This prevents multiple result records for the same student and examination.

## Future Improvements

- Administrative management dashboard
- Student and teacher profile editing
- Fee payment integration
- Attendance and academic reports
- Automated testing
- Production deployment and monitoring

## Project Status

Core student and teacher workflows are implemented. Final documentation and deployment preparation are in progress.
