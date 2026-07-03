import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { books, communities, communityMembers, users } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";
import ExploreClient from "./ExploreClient";

export default async function ExplorePage() {
  const { userId } = await auth();

  const [allCommunities, availableBooks] = await Promise.all([
    db.select().from(communities).orderBy(communities.memberCount),
    db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        condition: books.condition,
        coverUrl: books.coverUrl,
        publishYear: books.publishYear,
        ownerName: users.displayName,
        ownerLocation: users.location,
      })
      .from(books)
      .leftJoin(users, eq(books.userId, users.clerkUserId))
      .where(
        userId
          ? and(eq(books.availableForSwap, true), ne(books.userId, userId))
          : eq(books.availableForSwap, true)
      )
      .orderBy(books.createdAt),
  ]);

  // Mark which communities the current user has joined
  let memberSet = new Set<string>();
  if (userId) {
    const memberships = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));
    memberSet = new Set(memberships.map((m) => m.communityId));
  }

  const communitiesWithMembership = allCommunities.map((c) => ({
    ...c,
    isMember: memberSet.has(c.id),
  }));

  return (
    <ExploreClient
      communities={communitiesWithMembership}
      books={availableBooks}
    />
  );
}
