import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = data as {
      id: string;
      email_addresses: { email_address: string }[];
      first_name: string | null;
      last_name: string | null;
      image_url: string | null;
    };

    const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;
    const email = email_addresses?.[0]?.email_address ?? null;

    await db.insert(users).values({
      clerkUserId: id,
      displayName,
      email,
      avatarUrl: image_url,
    });
  }

  if (type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = data as {
      id: string;
      email_addresses: { email_address: string }[];
      first_name: string | null;
      last_name: string | null;
      image_url: string | null;
    };

    const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;
    const email = email_addresses?.[0]?.email_address ?? null;

    await db
      .update(users)
      .set({ displayName, email, avatarUrl: image_url, updatedAt: new Date() })
      .where(eq(users.clerkUserId, id));
  }

  if (type === "user.deleted") {
    const { id } = data as { id: string };
    await db.delete(users).where(eq(users.clerkUserId, id));
  }

  return NextResponse.json({ received: true });
}
