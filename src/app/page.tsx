import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import ComingSoon from "@/components/ComingSoon";

// A head start so the waitlist counter feels alive before real signups accumulate.
const WAITLIST_BASE_COUNT = 840;

export default async function HomePage() {
  const [clerkUser, count] = await Promise.all([currentUser(), db.$count(users)]);

  return (
    <ComingSoon
      waitlistCount={WAITLIST_BASE_COUNT + count}
      firstName={clerkUser?.firstName ?? null}
    />
  );
}
