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
4. Create the first `super_admin` directly in MongoDB with a bcrypt-hashed password. There is intentionally no public account-registration endpoint.
5. Run `npm run dev` for development. Run `npm run build` then `npm start` for production.

The API listens on port `5000` by default. Login creates a server-side session stored in MongoDB; send the session cookie with requests (`credentials: "include"` in browser clients).

If Atlas startup fails with `querySrv ETIMEOUT` or `ECONNREFUSED`, check that the SRV record for your Atlas hostname resolves on your network. As a local workaround, set `MONGODB_DNS_SERVERS=1.1.1.1,1.0.0.1` in `.env` when those public DNS servers are reachable and permitted.

Login request bodies are validated with Joi before the handler runs. Send `emailAddress` and `password`; the legacy `email` field is also accepted.

## Main endpoints

| Method         | Endpoint                                    | Purpose                                       |
| -------------- | ------------------------------------------- | --------------------------------------------- |
| POST           | `/api/auth/login`                           | Sign in                                       |
| GET            | `/api/auth/me`                              | Current account                               |
| POST           | `/api/auth/logout`                          | End the current session                       |
| GET/POST       | `/api/users`                                | List or create accounts (admins only)         |
| PATCH          | `/api/users/:id`                            | Update permitted account fields               |
| GET/POST/PATCH | `/api/academics/:resource`                  | Faculties, departments, programs, and periods |
| GET/POST/PATCH | `/api/courses`                              | Course catalogue and administration           |
| GET/POST       | `/api/registrations`                        | View registrations or register as a student   |
| GET            | `/api/results`                              | View results allowed for the current role     |
| PUT            | `/api/results/registration/:registrationId` | Save lecturer result draft                    |
| POST           | `/api/results/:id/submit`                   | Submit a draft for review                     |
| POST           | `/api/results/:id/review`                   | Approve or return a submitted result          |
| GET            | `/api/health`                               | API and MongoDB status                        |

There is no backend dashboard endpoint; dashboard views and summary presentation belong to the frontend. Result scores use CA out of 40 and examination out of 60. Students only see approved results. Department-scoped administrative actions are limited to the caller's department.

## Result grading and audit

The grading scale is A (70-100, 5 points), B (60-69, 4), C (50-59, 3), D (45-49, 2), E (40-44, 1), and F (0-39, 0). GPA/CGPA is credit-unit weighted: `sum(course units * grade points) / sum(course units)` across approved results. Student result responses include the computed CGPA.

Course registrations are tied to the current academic period and only match courses for the student's department, program, level, and semester. Unique indexes prevent duplicate course registrations within a period. Result records identify `createdBy`, `updatedBy`, `submittedBy`, and `reviewedBy`; each draft save, submission, approval, and return also creates an indexed activity-log entry with the actor and relevant change details.
