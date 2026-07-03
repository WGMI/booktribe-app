"use client";

import { useState } from "react";
import BookCoverImage from "@/components/BookCoverImage";
import BookDetailsDialog from "./BookDetailsDialog";
import { bookColor } from "@/lib/bookColor";
import type { books } from "@/lib/schema";

type Book = typeof books.$inferSelect;

export default function BookCard({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-white rounded-xl border border-[#dbc1bd] shadow-sm overflow-hidden text-left hover:shadow-md transition-shadow"
      >
        <div
          className="h-32 flex items-end p-4 relative overflow-hidden"
          style={{ backgroundColor: bookColor(book.id) }}
        >
          <BookCoverImage apiUrl={book.coverUrl} fallbackUrl={book.uploadedCoverUrl} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative z-10 text-white">
            <p className="font-serif font-bold text-sm leading-tight">{book.title}</p>
            <p className="text-xs opacity-80">{book.author}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-3">
            {book.genre && (
              <span className="text-xs bg-[#f0eee9] text-[#554240] px-2 py-0.5 rounded-full">{book.genre}</span>
            )}
            <span className="text-xs bg-[#b9eeab] text-[#3b6934] px-2 py-0.5 rounded-full capitalize">
              {book.condition}
            </span>
          </div>
          <span className={`text-xs font-medium ${book.availableForSwap ? "text-[#3b6934]" : "text-[#88726f]"}`}>
            {book.availableForSwap ? "✓ Available for swap" : "Not available"}
          </span>
        </div>
      </button>

      {open && <BookDetailsDialog book={book} onClose={() => setOpen(false)} />}
    </>
  );
}
