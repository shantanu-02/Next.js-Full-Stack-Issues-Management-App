import Database from 'better-sqlite3';
import { hash } from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  password: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_by: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  author?: User;
  assignee?: User;
}

export interface Comment {
  id: number;
  issue_id: number;
  user_id: number;
  content: string;
  created_at: string;
  author?: User;
}

const db = new Database(':memory:');

// Initialize database schema
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Issues table
  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
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
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_created_by ON issues(created_by);
    CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
  `);

  seedDatabase();
}

async function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCount.count > 0) return; // Already seeded

  // Seed users
  const adminPassword = await hash('admin123', 12);
  const userPassword = await hash('user123', 12);

  db.prepare(`
    INSERT INTO users (email, password, role) VALUES 
    ('admin@example.com', ?, 'admin'),
    ('user@example.com', ?, 'user'),
    ('john@example.com', ?, 'user')
  `).run(adminPassword, userPassword, userPassword);

  // Seed issues
  db.prepare(`
    INSERT INTO issues (title, description, status, priority, created_by, assigned_to) VALUES 
    ('Login page not responsive', 'The login page breaks on mobile devices', 'open', 'high', 2, 1),
    ('Add dark mode support', 'Users are requesting dark mode functionality', 'open', 'medium', 3, NULL),
    ('Database connection timeout', 'Getting timeout errors during peak hours', 'closed', 'high', 2, 1),
    ('Improve search performance', 'Search queries are taking too long to execute', 'open', 'low', 3, NULL)
  `).run();

  // Seed comments
  db.prepare(`
    INSERT INTO comments (issue_id, user_id, content) VALUES 
    (1, 1, 'I will look into this issue and provide a fix soon.'),
    (1, 2, 'This is affecting our mobile users significantly.'),
    (2, 1, 'This is a great suggestion. We should prioritize this.'),
    (3, 1, 'Fixed by optimizing database connections.'),
    (4, 2, 'We should also consider adding search result caching.')
  `).run();
}

export { db };