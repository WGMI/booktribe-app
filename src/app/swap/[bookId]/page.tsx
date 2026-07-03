import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { books, users } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";
import SwapForm from "./SwapForm";

export default async function SwapPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { bookId } = await params;

  const [bookRow] = await db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      condition: books.condition,
      coverUrl: books.coverUrl,
      publishYear: books.publishYear,
      ownerId: books.userId,
      ownerName: users.displayName,
      ownerLocation: users.location,
    })
    .from(books)
    .leftJoin(users, eq(books.userId, users.clerkUserId))
    .where(eq(books.id, bookId))
    .limit(1);

  if (!bookRow) notFound();
  if (bookRow.ownerId === userId) redirect("/library");

  const ownerOtherBooks = await db
    .select({ id: books.id, title: books.title, author: books.author })
    .from(books)
    .where(and(eq(books.userId, bookRow.ownerId), ne(books.id, bookRow.id)))
    .limit(5);

  const myBooks = await db
    .select({ id: books.id, title: books.title, author: books.author })
    .from(books)
    .where(and(eq(books.userId, userId), eq(books.availableForSwap, true)))
    .limit(200);

  const book = {
    id: bookRow.id,
    title: bookRow.title,
    author: bookRow.author,
    genre: bookRow.genre,
    condition: bookRow.condition,
    coverUrl: bookRow.coverUrl,
    publishYear: bookRow.publishYear,
    ownerName: bookRow.ownerName,
    ownerLocation: bookRow.ownerLocation,
    ownerBooks: ownerOtherBooks,
  };

  return <SwapForm book={book} myBooks={myBooks} />;
}
