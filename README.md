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
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod schema validation
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project

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

3. Set up Supabase:

   - Create a new project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from Settings > API
   - Copy `env.example` to `.env.local` and fill in your Supabase credentials:
     ```bash
     cp env.example .env.local
     ```
   - Run the SQL script in `supabase-setup.sql` in your Supabase SQL editor to create tables
   - **Important**: If you already ran a different schema, run `fix-policies.sql` to fix RLS policies

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses Supabase (PostgreSQL) with the following tables:

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Issues Table

```sql
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Comments Table

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Supabase Setup

1. **Create Tables**: Run the `supabase-setup.sql` script in your Supabase SQL editor
2. **Row Level Security**: The script enables RLS with simple policies (authorization is handled in the app layer)
3. **UUID Primary Keys**: All tables use UUID for better scalability and security
4. **Indexes**: Performance indexes are created for common queries
5. **Triggers**: Automatic timestamp updates for the `updated_at` field

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_random_jwt_secret_key
```

### Database Seeding

The application provides multiple ways to seed the database:

1. **Manual seeding**: POST request to `/api/seed`
2. **Reset database**: POST request to `/api/reset` (development only)
3. **Environment variable**: Set `SEED_DATABASE=true` to enable automatic seeding

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

## Production Deployment

For production deployment:

1. Set secure environment variables
2. Use production Supabase project
3. Configure proper CORS settings
4. Enable HTTPS
5. Set secure cookie settings
6. Implement rate limiting
7. Add logging and monitoring

## Development Notes

- Database is hosted on Supabase (PostgreSQL)
- JWT secret should be environment variable in production
- Form validation on both client and server
- Optimistic UI updates for better UX
- Responsive design with mobile-first approach
- Error handling with proper HTTP status codes
- Row Level Security (RLS) enabled for data protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
