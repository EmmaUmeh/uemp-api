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

## API endpoints

Base URL: `http://localhost:5000/v1`. Except for health and login, endpoints require the session cookie created by login. Send the cookie on subsequent requests; browser clients should use `credentials: "include"`. API errors are returned through the common error handler.

| Method | Endpoint                                                  | Authentication / allowed roles                                                          | Purpose                                                   |
| ------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| GET    | `/health`                                                 | Public                                                                                  | Health status; returns `503` when MongoDB is disconnected |
| POST   | `/auth/login`                                             | Public; rate-limited                                                                    | Sign in any account using `emailAddress` and `password`   |
| GET    | `/auth/me`                                                | Any authenticated role                                                                  | Return the current user                                   |
| POST   | `/auth/logout`                                            | Any authenticated role                                                                  | End the current session                                   |
| GET    | `/academics/faculties`                                    | Any authenticated role                                                                  | List faculties (department-scoped where applicable)       |
| GET    | `/academics/departments`                                  | Any authenticated role                                                                  | List departments                                          |
| GET    | `/academics/programs`                                     | Any authenticated role                                                                  | List programs (department-scoped for department admins)   |
| GET    | `/academics/periods`                                      | Any authenticated role                                                                  | List academic periods                                     |
| POST   | `/academics/{faculties,departments,programs,periods}`     | Super admin; department admin for permitted department resources                        | Create academic records                                   |
| PATCH  | `/academics/{faculties,departments,programs,periods}/:id` | Super admin; department admin for permitted department resources                        | Update an academic record                                 |
| GET    | `/users`                                                  | Super admin; department admin sees own department                                       | List users                                                |
| POST   | `/users`                                                  | Super admin; department admin can create students and lecturers in own department       | Create a user                                             |
| PATCH  | `/users/:id`                                              | Super admin; department admin can update users in own department                        | Update a user                                             |
| GET    | `/courses`                                                | Student, lecturer, department admin, or super admin; results are role/department scoped | List available/assigned courses                           |
| POST   | `/courses`                                                | Super admin or department admin in own department                                       | Create a course                                           |
| PATCH  | `/courses/:id`                                            | Super admin or department admin in own department                                       | Update a course                                           |
| GET    | `/registrations`                                          | All roles; returns role-specific registrations                                          | List registrations                                        |
| POST   | `/registrations`                                          | Student                                                                                 | Register for eligible courses                             |
| GET    | `/results`                                                | All roles; returns role-specific results                                                | List results                                              |
| PUT    | `/results/registration/:registrationId`                   | Lecturer assigned to the course                                                         | Save a result draft                                       |
| POST   | `/results/:id/submit`                                     | Lecturer who manages the result                                                         | Submit a result for review                                |
| POST   | `/results/:id/review`                                     | Department admin for the department or super admin                                      | Approve or return a submitted result                      |
| GET    | `/activities`                                             | Super admin                                                                             | View activity records                                     |

Use the exact resource names and parameter values shown. Route authorization is enforced by the API; hiding controls in a client does not grant access.

### Login example

```http
POST /v1/auth/login
Content-Type: application/json

{"emailAddress":"test.student@example.com","password":"your-test-password"}
```

The same login route is used for student, lecturer, department-admin, and super-admin accounts. The stored role determines which protected operations are available.

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

There is no backend dashboard endpoint; dashboard views and summary presentation belong to the frontend. Result scores use CA out of 40 and examination out of 60. Students only see approved results. Department-scoped administrative actions are limited to the caller's department.

## Docker

The production image uses a multi-stage build, installs only production dependencies in the runtime image, runs as the unprivileged `node` user, has a read-only root filesystem in Compose, drops Linux capabilities, and does not copy `.env` into the image. MongoDB is external to this container; configure `MONGODB_URI` to point to a reachable MongoDB instance (Atlas or your own secured MongoDB deployment).

1. Copy `.env.example` to `.env`; set `MONGODB_URI`, a long random `SESSION_SECRET`, and `CLIENT_ORIGIN`. Never commit `.env` or put secrets in the Dockerfile.
2. Start the API with Docker Compose:

   ```powershell
   docker compose up --build -d
   docker compose ps
   ```

3. Check `http://localhost:5000/v1/health`. Compose binds the port to loopback only; put a TLS reverse proxy in front of it for remote/browser production access.
4. Stop the container with `docker compose down`. The API has no local database volume; the configured external MongoDB owns persistence.

The Docker health check calls `/v1/health`; it reports unhealthy if MongoDB is disconnected. For production, inject secrets from the deployment platform's secret manager instead of relying on a developer `.env` file, restrict MongoDB network access, and serve the API over HTTPS so secure session cookies work as intended.

## Result grading and audit

The grading scale is A (70-100, 5 points), B (60-69, 4), C (50-59, 3), D (45-49, 2), E (40-44, 1), and F (0-39, 0). GPA/CGPA is credit-unit weighted: `sum(course units * grade points) / sum(course units)` across approved results. Student result responses include the computed CGPA.

Course registrations are tied to the current academic period and only match courses for the student's department, program, level, and semester. Unique indexes prevent duplicate course registrations within a period. Result records identify `createdBy`, `updatedBy`, `submittedBy`, and `reviewedBy`; each draft save, submission, approval, and return also creates an indexed activity-log entry with the actor and relevant change details.
