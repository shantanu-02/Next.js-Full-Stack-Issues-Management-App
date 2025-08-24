import { NextResponse } from "next/server";
import { resetDatabase } from "@/lib/database";

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Reset not allowed in production" },
        { status: 403 }
      );
    }

    await resetDatabase();

    return NextResponse.json({ message: "Database reset successfully" });
  } catch (error) {
    console.error("Error resetting database:", error);
    return NextResponse.json(
      { error: "Failed to reset database" },
      { status: 500 }
    );
  }
}
