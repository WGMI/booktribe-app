import { currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export async function ensureUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUser.id))
    .limit(1);

  if (existing.length === 0) {
    const displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;

    await db.insert(users).values({
      clerkUserId: clerkUser.id,
      displayName,
      email,
      avatarUrl: clerkUser.imageUrl ?? null,
    });
  }

  return clerkUser;
}
