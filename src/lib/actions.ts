"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { books, swapRequests, communityMembers, communities } from "./schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addBook(formData: {
  title: string;
  author: string;
  genre: string;
  condition: string;
  description: string;
  isbn?: string;
  openLibraryKey?: string;
  coverUrl?: string;
  uploadedCoverUrl?: string;
  publishYear?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  await db.insert(books).values({
    userId,
    title: formData.title,
    author: formData.author,
    genre: formData.genre || null,
    condition: formData.condition,
    description: formData.description || null,
    isbn: formData.isbn || null,
    openLibraryKey: formData.openLibraryKey || null,
    coverUrl: formData.coverUrl || null,
    uploadedCoverUrl: formData.uploadedCoverUrl || null,
    publishYear: formData.publishYear || null,
    availableForSwap: true,
  });

  revalidatePath("/library");
}

export async function searchOpenLibrary(query: string) {
  if (!query.trim()) return [];

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=key,title,author_name,isbn,cover_i,subject,first_publish_year&limit=10`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = await res.json();

  return (data.docs ?? []).map((doc: Record<string, unknown>) => {
    const coverId = doc.cover_i as number | undefined;
    const subjects = (doc.subject as string[] | undefined) ?? [];
    const isbns = (doc.isbn as string[] | undefined) ?? [];

    return {
      key: doc.key as string,
      title: doc.title as string,
      author: ((doc.author_name as string[] | undefined)?.[0]) ?? "Unknown Author",
      isbn: isbns[0] ?? null,
      coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
      publishYear: (doc.first_publish_year as number | undefined) ?? null,
      genre: subjects[0] ?? null,
    };
  });
}

export async function searchOpenLibraryByIsbn(isbn: string) {
  const clean = isbn.replace(/[^0-9Xx]/g, "");
  if (clean.length !== 10 && clean.length !== 13) return [];
  return searchOpenLibrary(`isbn:${clean}`);
}

type VisionVertex = { x?: number; y?: number };
type VisionAnnotation = {
  description?: string;
  boundingPoly?: { vertices?: VisionVertex[] };
};

const COVER_NOISE = /^(a novel|a memoir|stories|poems|essays|the\b.*bestseller|.*bestselling.*|winner of\b.*|author of\b.*|now a major\b.*|translated (by|from)\b.*|edited by\b.*|introduction by\b.*|foreword\b.*|afterword\b.*|book \d+|volume \d+)$/i;

function findIsbnInText(text: string): string | null {
  const isbn13 = text.match(/97[89][\d\- ]{10,16}/);
  if (isbn13) {
    const digits = isbn13[0].replace(/\D/g, "");
    if (digits.length >= 13) return digits.slice(0, 13);
  }
  const isbn10 = text.match(/ISBN[-\s:]*((?:\d[-\s]?){9}[\dXx])/i);
  if (isbn10) return isbn10[1].replace(/[-\s]/g, "");
  return null;
}

/**
 * Groups Vision word annotations into visual lines, then guesses title/author
 * by glyph height: the tallest text on a cover is almost always the title.
 */
function guessQueryFromWords(words: VisionAnnotation[]): string | null {
  const measured = words.flatMap((w) => {
    const v = w.boundingPoly?.vertices ?? [];
    const ys = v.map((p) => p.y ?? 0);
    const xs = v.map((p) => p.x ?? 0);
    if (!w.description || ys.length < 4) return [];
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    return [{
      text: w.description,
      xMin: Math.min(...xs),
      yCenter: (yMin + yMax) / 2,
      height: yMax - yMin,
    }];
  });
  if (measured.length === 0) return null;

  const heights = measured.map((w) => w.height).sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)];

  // Cluster words into lines by vertical center proximity
  const sorted = [...measured].sort((a, b) => a.yCenter - b.yCenter);
  const lines: (typeof measured)[] = [];
  for (const word of sorted) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(word.yCenter - line[line.length - 1].yCenter) < medianHeight * 0.6) {
      line.push(word);
    } else {
      lines.push([word]);
    }
  }

  const candidates = lines
    .map((line) => {
      const inOrder = [...line].sort((a, b) => a.xMin - b.xMin);
      const lineHeights = line.map((w) => w.height).sort((a, b) => a - b);
      return {
        text: inOrder.map((w) => w.text).join(" ").trim(),
        height: lineHeights[Math.floor(lineHeights.length / 2)],
        yCenter: line[0].yCenter,
      };
    })
    .filter(
      (l) =>
        l.text.length > 1 &&
        /[a-z]/i.test(l.text) &&
        !COVER_NOISE.test(l.text)
    );
  if (candidates.length === 0) return null;

  const tallest = Math.max(...candidates.map((l) => l.height));
  // Title may wrap across lines set at the same size — merge near-tallest lines in reading order
  const titleLines = candidates
    .filter((l) => l.height >= tallest * 0.75)
    .sort((a, b) => a.yCenter - b.yCenter)
    .slice(0, 3);
  const title = titleLines.map((l) => l.text).join(" ");

  const rest = candidates.filter((l) => !titleLines.includes(l));
  const byLine = rest.find((l) => /^by\s+\S/i.test(l.text));
  const author = byLine
    ? byLine.text.replace(/^by\s+/i, "")
    : rest.sort((a, b) => b.height - a.height)[0]?.text ?? "";

  return `${title} ${author}`.trim();
}

export type CoverScanResult =
  | {
      ok: true;
      results: Awaited<ReturnType<typeof searchOpenLibrary>>;
      query: string;
      via: "isbn" | "text";
    }
  | { ok: false; error: string; notConfigured?: boolean };

type VisionOcr =
  | { ok: true; annotations: VisionAnnotation[] }
  | { ok: false; error: string; notConfigured?: boolean };

async function annotateImage(imageBase64: string): Promise<VisionOcr> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Cover scanning is not configured", notConfigured: true };
  }

  // ~1MB server-action body limit upstream; reject anything suspiciously large
  if (imageBase64.length > 900_000) return { ok: false, error: "Image too large" };

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );
  if (!res.ok) return { ok: false, error: "Text recognition failed" };

  const data = await res.json();
  return { ok: true, annotations: data.responses?.[0]?.textAnnotations ?? [] };
}

/**
 * Digits-only fallback for when the barcode won't decode (glare, damage):
 * OCR the frame and look for the ISBN printed next to the bars.
 */
export async function extractIsbnFromPhoto(imageBase64: string): Promise<CoverScanResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const vision = await annotateImage(imageBase64);
  if (!vision.ok) return vision;

  const fullText = vision.annotations[0]?.description ?? "";
  const isbn = fullText ? findIsbnInText(fullText) : null;
  if (!isbn) return { ok: false, error: "No ISBN number found" };

  const results = await searchOpenLibraryByIsbn(isbn);
  if (results.length === 0) {
    return { ok: false, error: `No Open Library match for ISBN ${isbn}` };
  }
  return { ok: true, results, query: `isbn:${isbn}`, via: "isbn" };
}

export async function extractBookFromCover(imageBase64: string): Promise<CoverScanResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated" };

  const vision = await annotateImage(imageBase64);
  if (!vision.ok) return vision;

  const annotations = vision.annotations;
  if (annotations.length === 0) {
    return { ok: false, error: "No text found in the photo" };
  }

  const fullText = annotations[0]?.description ?? "";

  // An ISBN printed on the cover beats any title guessing — exact match
  const isbn = findIsbnInText(fullText);
  if (isbn) {
    const results = await searchOpenLibraryByIsbn(isbn);
    if (results.length > 0) return { ok: true, results, query: `isbn:${isbn}`, via: "isbn" };
  }

  const query = guessQueryFromWords(annotations.slice(1));
  if (!query) return { ok: false, error: "Couldn't read a title from the photo" };

  const results = await searchOpenLibrary(query);
  if (results.length === 0) {
    return { ok: false, error: `No matches found for "${query}"` };
  }
  return { ok: true, results, query, via: "text" };
}

export async function sendSwapRequest(
  bookId: string,
  offeredBookId: string,
  message: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const [book] = await db
    .select({ userId: books.userId, availableForSwap: books.availableForSwap })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);
  if (!book) throw new Error("Book not found");
  if (book.userId === userId) throw new Error("You can't request a swap for your own book");
  if (!book.availableForSwap) throw new Error("This book is no longer available for swap");

  const [offeredBook] = await db
    .select({ userId: books.userId, availableForSwap: books.availableForSwap })
    .from(books)
    .where(eq(books.id, offeredBookId))
    .limit(1);
  if (!offeredBook) throw new Error("Offered book not found");
  if (offeredBook.userId !== userId) throw new Error("You can only offer a book you own");
  if (!offeredBook.availableForSwap) throw new Error("The book you're offering isn't available for swap");

  const [existing] = await db
    .select({ id: swapRequests.id })
    .from(swapRequests)
    .where(
      and(
        eq(swapRequests.requesterId, userId),
        eq(swapRequests.bookId, bookId),
        inArray(swapRequests.status, ["pending", "accepted"])
      )
    )
    .limit(1);
  if (existing) throw new Error("You already have an active request for this book");

  await db.insert(swapRequests).values({
    requesterId: userId,
    ownerId: book.userId,
    bookId,
    offeredBookId,
    message,
    status: "pending",
  });

  revalidatePath("/library");
  revalidatePath("/explore");
}

export async function respondToSwap(requestId: string, action: "accepted" | "declined") {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  await db
    .update(swapRequests)
    .set({ status: action })
    .where(and(eq(swapRequests.id, requestId), eq(swapRequests.ownerId, userId)));

  revalidatePath("/library");
}

export async function joinCommunity(communityId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const existing = await db
    .select({ id: communityMembers.id })
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(communityMembers).values({ communityId, userId });

  await db
    .update(communities)
    .set({ memberCount: db.$count(communityMembers, eq(communityMembers.communityId, communityId)) })
    .where(eq(communities.id, communityId));

  revalidatePath("/explore");
}
