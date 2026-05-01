# Team Task Manager

A full-stack team task management application with authentication, project/team management, task assignment, progress tracking, dashboard analytics, and role-based access control for `ADMIN` and `MEMBER` users.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite
- Auth: JWT + bcrypt
- Deployment target: Railway

## Features

- User signup and login
- Role-based access control
- Create and manage projects
- Add team members to projects
- Create and assign tasks
- Track task status as `TODO`, `IN_PROGRESS`, and `DONE`
- Dashboard for total, open, completed, and overdue tasks

## Roles

- `ADMIN`
  - Can create projects
  - Can add members to projects
  - Can create, edit, and delete tasks
  - Can view all projects and tasks
- `MEMBER`
  - Can view only projects they belong to
  - Can view only accessible tasks
  - Can update the status of tasks assigned to them

## Project Structure

```text
backend/
frontend/
package.json
README.md
```

## Environment Variables

Create `backend/.env` with:

```env
PORT=5000
DATABASE_FILE=backend/data/app.db
JWT_SECRET=replace-with-a-secure-secret
NODE_ENV=development
```

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add the `backend/.env` file.
3. Run the app:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173`.

The backend auto-creates the SQLite database and schema on startup.
If `JWT_SECRET` is omitted locally, the app falls back to a development-only secret. Set a real `JWT_SECRET` for production.

## API Overview

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `DELETE /api/projects/:projectId/members/:userId`
- `GET /api/projects/members`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId/status`
- `DELETE /api/tasks/:taskId`

### Dashboard

- `GET /api/dashboard`

## Railway Deployment

1. Push the project to GitHub.
2. Create a new Railway project from the GitHub repo.
3. Add a Railway volume and mount it to a path such as `/data`.
4. Add environment variables:
   - `DATABASE_FILE=/data/app.db`
   - `JWT_SECRET`
   - `NODE_ENV=production`
5. Railway will run:
   - `npm install`
   - `npm run build`
   - `npm start`
6. Open the generated Railway domain.

In production, the Express backend serves the built React frontend from `frontend/dist`.

## Submission Checklist

- Live Railway URL
- GitHub repository URL
- README with setup and deployment steps
