import { NextResponse } from "next/server";
import { supabase } from "@/lib/database";
import { hash } from "bcryptjs";

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Seeding not allowed in production" },
        { status: 403 }
      );
    }

    console.log("Starting database seeding...");

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
      return NextResponse.json(
        { error: "Failed to check existing users" },
        { status: 500 }
      );
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({
        message: "Database already seeded",
        existingUsers: existingUsers.map((u) => u.email),
      });
    }

    // Hash passwords properly
    const adminPassword = await hash("admin123", 12);
    const userPassword = await hash("user123", 12);

    // Insert users into the users table
    const { error: insertUsersError } = await supabase.from("users").insert([
      { email: "admin@example.com", password: adminPassword, role: "admin" },
      { email: "user@example.com", password: userPassword, role: "user" },
      { email: "john@example.com", password: userPassword, role: "user" },
    ]);

    if (insertUsersError) {
      console.error("Error inserting seed users:", insertUsersError);
      return NextResponse.json(
        { error: "Failed to insert users", details: insertUsersError },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const adminId = users.find((u) => u.email === "admin@example.com")?.id;
    const userId = users.find((u) => u.email === "user@example.com")?.id;
    const johnId = users.find((u) => u.email === "john@example.com")?.id;

    if (!adminId || !userId || !johnId) {
      return NextResponse.json(
        { error: "Could not find user IDs for seeding" },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: "Failed to seed issues" },
        { status: 500 }
      );
    }

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
      return NextResponse.json(
        { error: "Failed to fetch issues for comments" },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: "Failed to seed comments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      seeded: {
        users: 3,
        issues: 4,
        comments: 5,
      },
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
