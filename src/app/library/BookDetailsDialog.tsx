"use client";

import BookCoverImage from "@/components/BookCoverImage";
import { bookColor } from "@/lib/bookColor";
import type { books } from "@/lib/schema";

type Book = typeof books.$inferSelect;

export default function BookDetailsDialog({
  book,
  images = [],
  onClose,
}: {
  book: Book;
  images?: string[];
  onClose: () => void;
}) {
  const addedOn = new Date(book.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 shrink-0 overflow-hidden" style={{ backgroundColor: bookColor(book.id) }}>
          <BookCoverImage apiUrl={book.coverUrl} fallbackUrl={book.uploadedCoverUrl} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            ✕
          </button>
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <h2 className="font-serif text-2xl font-bold leading-tight">{book.title}</h2>
            <p className="text-sm opacity-90">{book.author}</p>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <div className="flex gap-2 flex-wrap">
            {book.genre && (
              <span className="text-xs bg-[#f0eee9] text-[#554240] px-2 py-0.5 rounded-full">{book.genre}</span>
            )}
            <span className="text-xs bg-[#b9eeab] text-[#3b6934] px-2 py-0.5 rounded-full capitalize">
              {book.condition}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                book.availableForSwap ? "bg-[#b9eeab] text-[#3b6934]" : "bg-[#f0eee9] text-[#88726f]"
              }`}
            >
              {book.availableForSwap ? "Available for swap" : "Not available"}
            </span>
          </div>

          {images.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#88726f] uppercase tracking-wide mb-2">
                Photos ({images.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="w-20 h-28 rounded-lg object-cover shrink-0 border border-[#dbc1bd]"
                  />
                ))}
              </div>
            </div>
          )}

          {book.description && (
            <div>
              <h3 className="text-xs font-semibold text-[#88726f] uppercase tracking-wide mb-1">Description</h3>
              <p className="text-sm text-[#554240] leading-relaxed">{book.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {book.publishYear && (
              <div>
                <h3 className="text-xs font-semibold text-[#88726f] uppercase tracking-wide mb-1">Published</h3>
                <p className="text-sm text-[#1b1c19]">{book.publishYear}</p>
              </div>
            )}
            {book.isbn && (
              <div>
                <h3 className="text-xs font-semibold text-[#88726f] uppercase tracking-wide mb-1">ISBN</h3>
                <p className="text-sm text-[#1b1c19]">{book.isbn}</p>
              </div>
            )}
            {book.location && (
              <div>
                <h3 className="text-xs font-semibold text-[#88726f] uppercase tracking-wide mb-1">Location</h3>
                <p className="text-sm text-[#1b1c19]">📍 {book.location}</p>
              </div>
            )}
            <div>
              <h3 className="text-xs font-semibold text-[#88726f] uppercase tracking-wide mb-1">Added</h3>
              <p className="text-sm text-[#1b1c19]">{addedOn}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
