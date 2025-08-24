import { NextResponse } from "next/server";
import { supabase } from "@/lib/database";

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, role");

    if (error) {
      throw error;
    }

    return NextResponse.json(users || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
