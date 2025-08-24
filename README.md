# Issues Tracker - Full Stack Next.js Application

A comprehensive issue tracking system built with Next.js 13, featuring authentication, role-based access control, and a modern UI.

## Features

- **Authentication**: JWT-based auth with secure signup/login
- **Role-Based Access Control**: Admin and user roles with different permissions
- **Issue Management**: Full CRUD operations for issues
- **Comments System**: Real-time commenting on issues
- **Advanced Filtering**: Search, status, and priority filtering
- **Pagination**: Efficient data loading with pagination
- **Optimistic UI**: Smooth user experience with optimistic updates
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 13 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod schema validation
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd issues-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses SQLite with the following tables:

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Issues Table
```sql
CREATE TABLE issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  created_by INTEGER NOT NULL,
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

### Comments Table
```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Seed Data

The application automatically seeds the database with sample data:

### Users
- **Admin**: admin@example.com / admin123 (role: admin)
- **User**: user@example.com / user123 (role: user)
- **John**: john@example.com / user123 (role: user)

### Sample Issues
- Login page responsive issues
- Dark mode feature request
- Database connection timeout (closed)
- Search performance improvement

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Issues
- `GET /api/issues` - Get issues with pagination and filtering
- `POST /api/issues` - Create new issue
- `GET /api/issues/[id]` - Get specific issue
- `PUT /api/issues/[id]` - Update issue (owner or admin)
- `DELETE /api/issues/[id]` - Delete issue (owner or admin)

### Comments
- `GET /api/issues/[id]/comments` - Get issue comments
- `POST /api/issues/[id]/comments` - Add comment to issue

### Users
- `GET /api/users` - Get all users (for assignment)

## Example cURL Commands

### Authentication
```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  -c cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### Issues Management
```bash
# Get issues with filtering
curl -X GET "http://localhost:3000/api/issues?status=open&page=1&page_size=10" \
  -b cookies.txt

# Create new issue
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "New Bug Report",
    "description": "Description of the bug",
    "priority": "high"
  }'

# Update issue
curl -X PUT http://localhost:3000/api/issues/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Updated Issue Title",
    "description": "Updated description",
    "status": "closed",
    "priority": "medium"
  }'

# Delete issue
curl -X DELETE http://localhost:3000/api/issues/1 \
  -b cookies.txt

# Get specific issue
curl -X GET http://localhost:3000/api/issues/1 \
  -b cookies.txt
```

### Comments
```bash
# Get comments for an issue
curl -X GET http://localhost:3000/api/issues/1/comments \
  -b cookies.txt

# Add comment to issue
curl -X POST http://localhost:3000/api/issues/1/comments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"content": "This is a comment on the issue"}'
```

### Query Parameters for Issues

- `status` - Filter by status: `open` or `closed`
- `priority` - Filter by priority: `low`, `medium`, or `high`
- `search` - Search in title and description
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 10)

## Role-Based Permissions

### Admin Users
- View all issues
- Create, edit, and delete any issue
- Assign issues to other users
- Close/reopen any issue
- Comment on any issue

### Regular Users
- View all issues
- Create new issues
- Edit and delete only their own issues
- Close/reopen only their own issues
- Comment on any issue