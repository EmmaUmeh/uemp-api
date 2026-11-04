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

All routes start with `/v1`. Only login is public; the other routes require a signed-in user.

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/auth/login` | Public |
| `GET` | `/auth/me` | Any signed-in user |
| `POST` | `/auth/logout` | Any signed-in user |
| `GET` | `/academics/:resource` | Any signed-in user; resource is `faculties`, `departments`, `programs`, or `periods` |
| `POST`, `PATCH` | `/academics/:resource` and `/academics/:resource/:id` | Super admin or department admin |
| `GET`, `POST`, `PATCH` | `/users`, `/users/:id` | Super admin or department admin |
| `GET`, `POST`, `PATCH` | `/courses`, `/courses/:id` | All roles can list; admins can create or update |
| `GET` | `/registrations` | Any signed-in role |
| `POST` | `/registrations` | Student |
| `GET` | `/results` | Any signed-in role |
| `PUT` | `/results/registration/:registrationId` | Lecturer |
| `POST` | `/results/:id/submit` | Lecturer |
| `POST` | `/results/:id/review` | Department admin or super admin |
| `GET` | `/activities` | Super admin |

Login takes JSON with `emailAddress` and `password`. Use your own test account credentials; passwords do not belong in this README.

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
