# University Portal API

A TypeScript Node.js/Express monolith using MongoDB and Mongoose. The only server entry point is `server.ts`. Feature handlers are separated by user role under `handlers/`.

```text
handlers/
  auth/
  student/
  lecturer/
  department-admin/
  super-admin/
  shared/
validators/
  auth/
middleware/
models/
  user.model.ts
  course.model.ts
  registration.model.ts
  result.model.ts
  activity-log.model.ts
  academic.model.ts
  enums.ts
routes/
services/
types/
utils/
server.ts
```

## Setup

1. Install Node.js 20 or newer and MongoDB.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set a strong `SESSION_SECRET` and your MongoDB connection string. `MONGODB_DNS_SERVERS` optionally overrides the system DNS resolver for MongoDB SRV lookups; use DNS servers approved for your network.
4. If upgrading an existing database, back it up and run the one-time email-field migration below.
5. Create the first `super_admin` directly in MongoDB with a bcrypt-hashed password. There is intentionally no public account-registration endpoint.
6. Run `npm run dev` for development. Run `npm run build` then `npm start` for production.

The API listens on port `5000` by default. Login creates a server-side session stored in MongoDB; send the session cookie with requests (`credentials: "include"` in browser clients).

If Atlas startup fails with `querySrv ETIMEOUT` or `ECONNREFUSED`, check that the SRV record for your Atlas hostname resolves on your network. As a local workaround, set `MONGODB_DNS_SERVERS=1.1.1.1,1.0.0.1` in `.env` when those public DNS servers are reachable and permitted.

Login request bodies are validated with Joi before the handler runs. Send `emailAddress` and `password`. Each user's role is stored on the account and assigned by an administrator; all roles sign in through the same `/v1/auth/login` endpoint. After login, role-based authorization limits which routes and actions the account can access.

### Existing database migration

The user model stores email addresses in `emailAddress`. If your database was created with the former `email` field, back it up first, then run this one-time migration from PowerShell:

```powershell
$env:CONFIRM_USER_EMAIL_MIGRATION = "yes"
npm run migrate:users-email
```

The migration checks for missing, conflicting, or duplicate addresses before changing records, renames the field, and updates the unique index. It does not print email addresses.

### Test accounts

For local development, set `TEST_ACCOUNTS_PASSWORD` in `.env` to a password of at least 12 characters, then run `npm run seed:test-users`. The script creates or refreshes these active accounts:

| Role             | Email                               |
| ---------------- | ----------------------------------- |
| Student          | `test.student@example.com`          |
| Lecturer         | `test.lecturer@example.com`         |
| Department admin | `test.department-admin@example.com` |
| Super admin      | `test.super-admin@example.com`      |

Use the password from `TEST_ACCOUNTS_PASSWORD` to log in to all four accounts. Set `TEST_DEPARTMENT_ID` and `TEST_PROGRAM_ID` to a department and a program belonging to that department so the student, lecturer, and department-admin accounts can access department-scoped academic data. Without these IDs, the script still creates the accounts, but department-scoped features will not be available to them. The script refuses to run when `NODE_ENV=production`; do not point it at a production database.

## Main endpoints

| Method         | Endpoint                                   | Purpose                                       |
| -------------- | ------------------------------------------ | --------------------------------------------- |
| POST           | `/v1/auth/login`                           | Sign in (all roles)                           |
| GET            | `/v1/auth/me`                              | Current account                               |
| POST           | `/v1/auth/logout`                          | End the current session                       |
| GET/POST       | `/v1/users`                                | List or create accounts (admins only)         |
| PATCH          | `/v1/users/:id`                            | Update permitted account fields               |
| GET/POST/PATCH | `/v1/academics/:resource`                  | Faculties, departments, programs, and periods |
| GET/POST/PATCH | `/v1/courses`                              | Course catalogue and administration           |
| GET/POST       | `/v1/registrations`                        | View registrations or register as a student   |
| GET            | `/v1/results`                              | View results allowed for the current role     |
| PUT            | `/v1/results/registration/:registrationId` | Save lecturer result draft                    |
| POST           | `/v1/results/:id/submit`                   | Submit a draft for review                     |
| POST           | `/v1/results/:id/review`                   | Approve or return a submitted result          |
| GET            | `/v1/health`                               | API and MongoDB status                        |

There is no backend dashboard endpoint; dashboard views and summary presentation belong to the frontend. Result scores use CA out of 40 and examination out of 60. Students only see approved results. Department-scoped administrative actions are limited to the caller's department.

## Result grading and audit

The grading scale is A (70-100, 5 points), B (60-69, 4), C (50-59, 3), D (45-49, 2), E (40-44, 1), and F (0-39, 0). GPA/CGPA is credit-unit weighted: `sum(course units * grade points) / sum(course units)` across approved results. Student result responses include the computed CGPA.

Course registrations are tied to the current academic period and only match courses for the student's department, program, level, and semester. Unique indexes prevent duplicate course registrations within a period. Result records identify `createdBy`, `updatedBy`, `submittedBy`, and `reviewedBy`; each draft save, submission, approval, and return also creates an indexed activity-log entry with the actor and relevant change details.
