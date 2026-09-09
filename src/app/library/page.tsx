import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { books, bookImages, swapRequests, users } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import AddBookButton from "./AddBookButton";
import SwapActions from "./SwapActions";
import BookCard from "./BookCard";

export default async function LibraryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  const [myBooks, incomingRequests] = await Promise.all([
    db.select().from(books).where(eq(books.userId, userId)).orderBy(books.createdAt),
    db
      .select({
        id: swapRequests.id,
        status: swapRequests.status,
        message: swapRequests.message,
        createdAt: swapRequests.createdAt,
        bookTitle: books.title,
        requesterName: users.displayName,
        requesterEmail: users.email,
      })
      .from(swapRequests)
      .innerJoin(books, eq(swapRequests.bookId, books.id))
      .leftJoin(users, eq(swapRequests.requesterId, users.clerkUserId))
      .where(eq(swapRequests.ownerId, userId))
      .orderBy(swapRequests.createdAt),
  ]);

  const imageRows = myBooks.length > 0
    ? await db
        .select({ bookId: bookImages.bookId, url: bookImages.url })
        .from(bookImages)
        .where(inArray(bookImages.bookId, myBooks.map((b) => b.id)))
        .orderBy(bookImages.position)
    : [];

  const imagesByBook = new Map<string, string[]>();
  for (const row of imageRows) {
    const list = imagesByBook.get(row.bookId) ?? [];
    list.push(row.url);
    imagesByBook.set(row.bookId, list);
  }

  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || "Reader";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const swapCount = myBooks.filter((b) => b.availableForSwap).length;
  const pendingCount = incomingRequests.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#fbf9f4]">
      {/* Profile Header */}
      <div className="bg-[#1b1c19] text-white">
        <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#a44a3f] flex items-center justify-center text-white font-serif font-bold text-3xl border-4 border-[#85332a] shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-[32px] font-bold mb-1">{displayName}&apos;s Library</h1>
              <p className="text-[#88726f] mb-4">{clerkUser?.emailAddresses?.[0]?.emailAddress}</p>
              <div className="flex gap-6">
                <div>
                  <p className="font-bold text-xl text-white">{myBooks.length}</p>
                  <p className="text-xs text-[#88726f]">Books Listed</p>
                </div>
                <div>
                  <p className="font-bold text-xl text-white">{swapCount}</p>
                  <p className="text-xs text-[#88726f]">Available to Swap</p>
                </div>
                <div>
                  <p className="font-bold text-xl text-white">{pendingCount}</p>
                  <p className="text-xs text-[#88726f]">Pending Requests</p>
                </div>
              </div>
            </div>
            <AddBookButton />
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Collection */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-[#1b1c19]">My Collection</h2>
              <span className="text-sm text-[#554240]">{myBooks.length} book{myBooks.length !== 1 ? "s" : ""}</span>
            </div>

            {myBooks.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#dbc1bd] p-12 text-center">
                <p className="text-5xl mb-4">📚</p>
                <p className="font-serif text-lg font-semibold text-[#1b1c19] mb-2">Your library is empty</p>
                <p className="text-sm text-[#554240] mb-6">Start adding books from your shelf to share with the community.</p>
                <AddBookButton />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myBooks.map((book) => (
                  <BookCard key={book.id} book={book} images={imagesByBook.get(book.id) ?? []} />
                ))}
              </div>
            )}
          </div>

          {/* Swap Requests */}
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#1b1c19] mb-6">Swap Requests</h2>
            <div className="space-y-4">
              {incomingRequests.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#dbc1bd] p-8 text-center">
                  <p className="text-4xl mb-3">📬</p>
                  <p className="text-[#554240] text-sm">No swap requests yet. List your books to start swapping!</p>
                </div>
              ) : (
                incomingRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl border border-[#dbc1bd] shadow-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#1b1c19] text-sm">
                        {req.requesterName ?? req.requesterEmail ?? "Someone"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          req.status === "accepted"
                            ? "bg-[#b9eeab] text-[#3b6934]"
                            : req.status === "declined"
                            ? "bg-[#f0eee9] text-[#88726f]"
                            : "bg-[#ffdad5] text-[#85332a]"
                        }`}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-[#88726f] mb-2">
                      Wants: <span className="text-[#554240] font-medium">{req.bookTitle}</span>
                    </p>
                    {req.message && (
                      <p className="text-sm text-[#554240] italic mb-4 leading-relaxed">&ldquo;{req.message}&rdquo;</p>
                    )}
                    {req.status === "pending" && <SwapActions requestId={req.id} />}
                    {req.status === "accepted" && (
                      <p className="text-xs text-[#3b6934] font-medium">✓ Swap arranged — connect to exchange!</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 bg-[#f5f3ee] rounded-xl p-5 border border-[#dbc1bd]">
              <h3 className="font-semibold text-[#1b1c19] mb-3 text-sm">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/explore" className="flex items-center gap-2 text-sm text-[#554240] hover:text-[#85332a] transition-colors">
                  <span>🔍</span> Browse available books
                </Link>
                <Link href="/explore" className="flex items-center gap-2 text-sm text-[#554240] hover:text-[#85332a] transition-colors">
                  <span>👥</span> Find communities
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
