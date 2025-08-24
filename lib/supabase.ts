import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jqgspblypbkowyullpxj.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxZ3NwYmx5cGJrb3d5dWxscHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNDAxMjksImV4cCI6MjA3MTYxNjEyOX0.7aUCWfmfROLQk_atdDfYz0qTlsuQ4HzXgntlmUEB314";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface User {
  id: string; // UUID
  email: string;
  password: string;
  role: "user" | "admin";
  created_at: string;
}

export interface Issue {
  id: string; // UUID
  title: string;
  description: string;
  status: "open" | "closed";
  priority: "low" | "medium" | "high";
  created_by: string; // UUID
  assigned_to?: string; // UUID
  created_at: string;
  updated_at: string;
  author?: User;
  assignee?: User;
}

export interface Comment {
  id: string; // UUID
  issue_id: string; // UUID
  user_id: string; // UUID
  content: string;
  created_at: string;
  author?: User;
}

// Database initialization and seeding
export async function initDatabase() {
  try {
    // Only seed if explicitly requested via environment variable
    if (process.env.SEED_DATABASE === "true") {
      console.log("Seeding database as requested by SEED_DATABASE=true");
      await seedDatabase();
    } else {
      console.log(
        "Skipping database seeding. Set SEED_DATABASE=true to enable."
      );
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Function to reset database (useful for development)
export async function resetDatabase() {
  try {
    console.log("Resetting database...");

    // Delete all data in reverse order (respecting foreign keys)
    const { error: commentsError } = await supabase
      .from("comments")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (commentsError) console.error("Error deleting comments:", commentsError);

    const { error: issuesError } = await supabase
      .from("issues")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (issuesError) console.error("Error deleting issues:", issuesError);

    const { error: usersError } = await supabase
      .from("users")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (usersError) console.error("Error deleting users:", usersError);

    console.log("Database reset complete");

    // Wait a moment then seed
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await seedDatabase();
  } catch (error) {
    console.error("Error resetting database:", error);
  }
}

async function seedDatabase() {
  try {
    // Check if users already exist by checking for specific emails
    const { data: existingUsers, error: usersError } = await supabase
      .from("users")
      .select("email")
      .in("email", [
        "admin@example.com",
        "user@example.com",
        "john@example.com",
      ]);

    if (usersError) {
      console.error("Error checking existing users:", usersError);
      return;
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log(
        "Database already seeded - users exist:",
        existingUsers.map((u) => u.email)
      );
      return;
    }

    console.log("Seeding database with initial data...");

    // Insert users into the users table
    const { error: insertUsersError } = await supabase.from("users").insert([
      { email: "admin@example.com", password: "admin123", role: "admin" },
      { email: "user@example.com", password: "user123", role: "user" },
      { email: "john@example.com", password: "user123", role: "user" },
    ]);

    if (insertUsersError) {
      console.error("Error inserting seed users:", insertUsersError);
      return;
    }

    console.log("Users seeded successfully");

    // Wait a moment for the insert to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get user IDs for seeding issues
    const { data: users, error: usersFetchError } = await supabase
      .from("users")
      .select("id, email")
      .in("email", [
        "admin@example.com",
        "user@example.com",
        "john@example.com",
      ]);

    if (usersFetchError || !users) {
      console.error("Error fetching users for seeding:", usersFetchError);
      return;
    }

    const adminId = users.find((u) => u.email === "admin@example.com")?.id;
    const userId = users.find((u) => u.email === "user@example.com")?.id;
    const johnId = users.find((u) => u.email === "john@example.com")?.id;

    if (!adminId || !userId || !johnId) {
      console.error("Could not find user IDs for seeding");
      return;
    }

    // Check if issues already exist
    const { data: existingIssues } = await supabase
      .from("issues")
      .select("id")
      .limit(1);

    if (existingIssues && existingIssues.length > 0) {
      console.log("Issues already exist, skipping issues and comments seeding");
      return;
    }

    // Seed issues
    const { error: issuesError } = await supabase.from("issues").insert([
      {
        title: "Login page not responsive",
        description: "The login page breaks on mobile devices",
        status: "open",
        priority: "high",
        created_by: userId,
        assigned_to: adminId,
      },
      {
        title: "Add dark mode support",
        description: "Users are requesting dark mode functionality",
        status: "open",
        priority: "medium",
        created_by: johnId,
      },
      {
        title: "Database connection timeout",
        description: "Getting timeout errors during peak hours",
        status: "closed",
        priority: "high",
        created_by: userId,
        assigned_to: adminId,
      },
      {
        title: "Improve search performance",
        description: "Search queries are taking too long to execute",
        status: "open",
        priority: "low",
        created_by: johnId,
      },
    ]);

    if (issuesError) {
      console.error("Error seeding issues:", issuesError);
      return;
    }

    console.log("Issues seeded successfully");

    // Wait a moment for the insert to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get issue IDs for seeding comments
    const { data: issues, error: issuesFetchError } = await supabase
      .from("issues")
      .select("id")
      .limit(4);

    if (issuesFetchError || !issues) {
      console.error(
        "Error fetching issues for seeding comments:",
        issuesFetchError
      );
      return;
    }

    // Seed comments
    const { error: commentsError } = await supabase.from("comments").insert([
      {
        issue_id: issues[0].id,
        user_id: adminId,
        content: "I will look into this issue and provide a fix soon.",
      },
      {
        issue_id: issues[0].id,
        user_id: userId,
        content: "This is affecting our mobile users significantly.",
      },
      {
        issue_id: issues[1].id,
        user_id: adminId,
        content: "This is a great suggestion. We should prioritize this.",
      },
      {
        issue_id: issues[2].id,
        user_id: adminId,
        content: "Fixed by optimizing database connections.",
      },
      {
        issue_id: issues[3].id,
        user_id: userId,
        content: "We should also consider adding search result caching.",
      },
    ]);

    if (commentsError) {
      console.error("Error seeding comments:", commentsError);
      return;
    }

    console.log("Comments seeded successfully");
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error during seeding:", error);
  }
}
