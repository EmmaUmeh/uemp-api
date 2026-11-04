# University Portal API

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