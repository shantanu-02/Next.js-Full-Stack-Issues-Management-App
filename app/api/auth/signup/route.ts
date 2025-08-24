import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { supabase } from "@/lib/database";
import { signupSchema } from "@/lib/validations";
import { encrypt } from "@/lib/auth";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = signupSchema.parse(body);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hash(password, 12);
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password: hashedPassword,
        role: role || "user",
      })
      .select("id, email, role")
      .single();

    if (insertError) {
      throw insertError;
    }

    // Create session
    const session = await encrypt({ userId: newUser.id });

    const response = NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 201 }
    );

    response.cookies.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error during signup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
