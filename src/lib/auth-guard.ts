import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Call at the top of every protected Route Handler.
 * Returns the session userId or sends a 401 response.
 */
export async function requireAuth(): Promise<
  { userId: string } | NextResponse
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id };
}