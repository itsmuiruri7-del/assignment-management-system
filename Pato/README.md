# School Assignment Management System

This is a simple, fully working School Assignment Management System built with a Node.js/Express backend and a Next.js frontend. It's designed as a clean, well-documented project suitable for a university project demo.

## Features

- **User Roles**: Admin, Instructor, Student.
- **Authentication**: JWT-based authentication. Students can register, but Admin and Instructor accounts are created via a database seed script.
- **Role-Based Access Control**: Protected routes and functionality for each role.
- **Students**: Can view assignments, upload submissions with a progress bar, and see their grades/feedback.
- **Instructors**: Can create assignments, view submissions for their assignments, and grade them.
- **Admins**: Can view all users, assignments, and submissions in the system.

## Tech Stack

- **Backend**: Node.js, Express, Prisma (with SQLite), JWT
- **Frontend**: Next.js, React, React-Bootstrap, Axios
- **Database**: SQLite (for development)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- [SQLite](https://www.sqlite.org/index.html) command-line tools installed on your system.

### 1. Clone the Repository

```bash
# (Assuming you have the project files)
cd path/to/Pato
```

### 2. Setup the Backend

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create the environment file
# (This will copy the example file)
cp .env.example .env
```

**Important**: Open the new `backend/.env` file and change the `JWT_SECRET` to a unique, random string.

```bash
# Run database migrations and seed the database
# This creates the database file and populates it with sample data.
npm run seed
```

### 3. Setup the Frontend

```bash
# Navigate to the frontend directory from the root
cd ../frontend

# Install dependencies
npm install

# Create the environment file
cp .env.local.example .env.local
```

The `frontend/.env.local` file is already configured to connect to the backend running on port 5001, so no changes are needed.

### 4. Run the Application

You will need two separate terminal windows to run both the backend and frontend servers simultaneously.

**In Terminal 1 (Backend):**

```bash
cd backend
npm run dev
```

The backend API will be running at `http://localhost:5001`.

**In Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev
```

The frontend application will be running at `http://localhost:3000`.

Open your browser and navigate to `http://localhost:3000`.

---

## Demo Credentials

The database is seeded with the following users. The password for all users is `password`.

- **Admin**
  - Email: `admin@example.com`
- **Instructors**
  - Email: `inst1@example.com`
  - Email: `inst2@example.com`
- **Students**
  - Email: `student1@example.com`
  - Email: `student2@example.com`
