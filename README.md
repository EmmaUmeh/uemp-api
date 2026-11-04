# University Education Management Portal API

This API manages users, courses, registrations, academic records, and results.

## Architecture

The API uses Express. Requests go through routes, then authentication and role checks, then a handler. Handlers use Mongoose to read and write data in MongoDB. API routes start with `/v1`.

## Database

The API stores these records in MongoDB:

- **Users:** students, lecturers, department admins, and super admins.
- **Academic records:** faculties, departments, programs, and academic periods.
- **Courses:** linked to a department, program, and lecturers.
- **Registrations:** link a student to a course and academic period.
- **Results:** linked to a registration.
- **Activity logs:** record selected user actions.

## Technology

- Node.js runs the server.
- TypeScript is used to write the code.
- Express handles API requests.
- MongoDB stores data; Mongoose defines and checks database records.
- Joi checks request data.
- Winston writes application logs.

## Security

- Users sign in with a session stored in MongoDB.
- Passwords are hashed before they are stored.
- Each role can use only its allowed routes.
- Department admins are limited to their department. Lecturers can work with courses assigned to them.
- Login attempts are limited. Helmet, CORS rules, request checks, and HTTP-only session cookies are also used.

## API

All routes start with `/v1`. Send JSON payloads with `Content-Type: application/json`. Routes without a payload are marked `None`.

| Method | Route | Payload |
| --- | --- | --- |
| `POST` | `/auth/login` | `{"emailAddress":"********","password":"********"}` |
| `GET` | `/auth/me` | None |
| `POST` | `/auth/logout` | None |
| `GET` | `/academics/:resource` | None. Resource: `faculties`, `departments`, `programs`, or `periods`. |
| `POST` | `/academics/faculties` | `{"name":"Science","code":"SCI"}` |
| `POST` | `/academics/departments` | `{"name":"Computer Science","code":"CSC","faculty":"<facultyId>"}` |
| `POST` | `/academics/programs` | `{"name":"Computer Science","code":"BSC-CS","department":"<departmentId>"}` |
| `POST` | `/academics/periods` | `{"session":"2025/2026","semester":"first","registrationOpen":true,"isCurrent":true}` |
| `PATCH` | `/academics/:resource/:id` | The fields to change for that resource, using the same fields as its `POST` payload. |
| `GET` | `/users` | None |
| `POST` | `/users` | `{"firstName":"Ada","lastName":"Example","emailAddress":"ada@example.com","password":"********","role":"student","department":"<departmentId>","program":"<programId>","level":100}` |
| `PATCH` | `/users/:id` | Fields to change, for example `{"phone":"********","isActive":true}` |
| `GET` | `/courses` | None |
| `POST` | `/courses` | `{"code":"CSC101","title":"Introduction to Computing","units":3,"department":"<departmentId>","program":"<programId>","level":100,"semester":"first","lecturers":["<lecturerId>"]}` |
| `PATCH` | `/courses/:id` | Fields to change, for example `{"title":"Updated title","lecturers":["<lecturerId>"]}` |
| `GET` | `/registrations` | None |
| `POST` | `/registrations` | `{"courseId":"<courseId>","academicPeriodId":"<academicPeriodId>"}` |
| `GET` | `/results` | None |
| `PUT` | `/results/registration/:registrationId` | `{"continuousAssessment":30,"examination":55}` |
| `POST` | `/results/:id/submit` | None |
| `POST` | `/results/:id/review` | `{"decision":"approved"}` or `{"decision":"returned","feedback":"Please check the score."}` |
| `GET` | `/activities` | None |

Use your own account password in login and user-creation requests. Do not put real passwords in this README.

## Setup

You need Node.js 20 or later, npm, and MongoDB.

1. Install packages:

   ```sh
   npm ci
   ```

2. Create a `.env` file in the project folder:

   ```dotenv
   PORT=5000
   MONGODB_URI=********
   SESSION_SECRET=********
   CLIENT_ORIGIN=********
   NODE_ENV=development
   ```

   Replace each `********` with your own value. Do not put real passwords, secrets, or private URLs in this README or commit them to Git.

3. Start MongoDB, then start the API:

   ```sh
   npm run dev
   ```

   The API address is `http://localhost:5000/v1`.

To build and run the compiled server:

```sh
npm run build
npm start
```
