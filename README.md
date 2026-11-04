# University Education Management Portal API

Backend API for managing university users, courses, registrations, academic records, and results.

## Architecture

The Express API is mounted at `/v1`. Routes apply authentication and authorization, handlers implement portal actions, and Mongoose models read and write MongoDB records.

## Database

MongoDB stores:

- **Users** and their roles and academic affiliations.
- **Faculties, departments, programs, and academic periods.**
- **Courses**, linked to departments, programs, and lecturers.
- **Registrations**, linking students, courses, and academic periods.
- **Results**, linked to registrations and reviewed by authorized staff.
- **Activity logs**, recording selected administrative actions.

## Technology

Node.js 20+, TypeScript, Express, MongoDB/Mongoose, Joi, and Winston.

## Security

- Session-based sign-in; sessions are stored in MongoDB.
- Role checks for students, lecturers, department admins, and super admins.
- Additional department and course-assignment checks on relevant actions.
- Passwords are hashed; login attempts are rate-limited.
- Helmet, CORS, request validation, and HTTP-only session cookies are configured.

## Setup

Requirements: Node.js 20+, npm, and MongoDB.

1. Install packages:

   ```sh
   npm ci
   ```

2. Create `.env` in the project root. Add the required settings; keep real secrets and private URLs out of this README and source control:

   ```dotenv
   PORT=5000
   MONGODB_URI=********
   SESSION_SECRET=********
   CLIENT_ORIGIN=********
   NODE_ENV=development
   ```

3. Start MongoDB, then run:

   ```sh
   npm run dev
   ```

   The API runs at `http://localhost:5000/v1`.

Build and run the compiled server:

```sh
npm run build
npm start
```
