"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendSwapRequest } from "@/lib/actions";
import { bookColor } from "@/lib/bookColor";

type MyBook = { id: string; title: string; author: string };
type BookDetail = {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  condition: string;
  coverUrl: string | null;
  publishYear: number | null;
  ownerName: string | null;
  ownerLocation: string | null;
  ownerBooks: MyBook[];
};

const BOOKS_VISIBLE_STEP = 6;

export default function SwapForm({
  book,
  myBooks,
}: {
  book: BookDetail;
  myBooks: MyBook[];
}) {
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [bookSearch, setBookSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(BOOKS_VISIBLE_STEP);

  function handleBookSearchChange(value: string) {
    setBookSearch(value);
    setVisibleCount(BOOKS_VISIBLE_STEP);
  }

  const filteredMyBooks = myBooks.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase())
  );
  const visibleMyBooks = filteredMyBooks.slice(0, visibleCount);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook) return;
    setError("");
    startTransition(async () => {
      try {
        await sendSwapRequest(book.id, selectedBook, message);
        setSubmitted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send request. Please try again.");
      }
    });
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#fbf9f4] flex items-center justify-center px-5">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full text-center border border-[#dbc1bd]">
          <div className="w-16 h-16 bg-[#b9eeab] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
          <h2 className="font-serif text-2xl font-bold text-[#1b1c19] mb-3">Swap Request Sent!</h2>
          <p className="text-[#554240] mb-6 leading-relaxed">
            Your request has been sent to <strong>{book.ownerName ?? "the owner"}</strong>. They&apos;ll review your offer and respond within a few days.
          </p>
          <div className="bg-[#f5f3ee] rounded-xl p-4 mb-8 text-left">
            <p className="text-xs text-[#88726f] font-medium mb-1">REQUESTED BOOK</p>
            <p className="font-semibold text-[#1b1c19]">{book.title}</p>
            <p className="text-sm text-[#554240]">{book.author}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/library" className="flex-1 bg-[#85332a] text-white py-3 rounded-lg font-semibold text-sm text-center hover:opacity-90 transition-opacity">
              My Library
            </Link>
            <Link href="/explore" className="flex-1 border-2 border-[#dbc1bd] text-[#554240] py-3 rounded-lg font-semibold text-sm text-center hover:border-[#85332a] hover:text-[#85332a] transition-colors">
              Keep Browsing
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf9f4]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-10">
        <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-[#554240] hover:text-[#85332a] transition-colors mb-8">
          ← Back to Explore
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Book Detail */}
          <div className="lg:col-span-2">
            <div
              className="h-64 rounded-2xl flex items-end p-6 relative mb-6 shadow-lg overflow-hidden"
              style={{ backgroundColor: bookColor(book.id) }}
            >
              {book.coverUrl && (
                <img src={book.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/70 to-transparent" />
              <div className="relative z-10 text-white">
                <p className="font-serif text-2xl font-bold leading-tight mb-1">{book.title}</p>
                <p className="text-lg opacity-80">{book.author}</p>
                {book.publishYear && <p className="text-sm opacity-60">{book.publishYear}</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#dbc1bd] shadow-sm p-6">
              <h3 className="font-semibold text-[#1b1c19] mb-4">Book Details</h3>
              <div className="space-y-3">
                {book.genre && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#88726f]">Genre</span>
                    <span className="text-[#1b1c19] font-medium">{book.genre}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#88726f]">Condition</span>
                  <span className="bg-[#b9eeab] text-[#3b6934] px-2 py-0.5 rounded-full text-xs font-medium capitalize">{book.condition}</span>
                </div>
                {book.ownerName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#88726f]">Owner</span>
                    <span className="text-[#1b1c19] font-medium">{book.ownerName}</span>
                  </div>
                )}
                {book.ownerLocation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#88726f]">Location</span>
                    <span className="text-[#1b1c19] font-medium">📍 {book.ownerLocation}</span>
                  </div>
                )}
              </div>

              {book.ownerBooks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#f0eee9]">
                  <p className="text-sm font-semibold text-[#1b1c19] mb-3">
                    Also from {book.ownerName?.split(" ")[0] ?? "this owner"}
                  </p>
                  {book.ownerBooks.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 py-2 border-b border-[#f0eee9] last:border-0">
                      <div className="w-6 h-6 rounded bg-[#f0eee9] flex items-center justify-center text-xs">📚</div>
                      <div>
                        <p className="text-sm text-[#554240]">{b.title}</p>
                        <p className="text-xs text-[#88726f]">{b.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Swap Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#dbc1bd] shadow-sm p-8">
              <h1 className="font-serif text-3xl font-bold text-[#1b1c19] mb-2">Request a Swap</h1>
              <p className="text-[#554240] mb-8">
                Offer one of your books in exchange for <strong>{book.title}</strong>. Include a personal message to increase your chances of a successful swap.
              </p>

              {error && (
                <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-4 py-2 rounded-lg mb-6">{error}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#1b1c19] mb-3">
                    Offer One of Your Books *
                  </label>
                  {myBooks.length === 0 ? (
                    <div className="text-center py-8 bg-[#f5f3ee] rounded-xl border border-[#dbc1bd]">
                      <p className="text-sm text-[#554240] mb-3">You have no books available to offer yet.</p>
                      <Link href="/library" className="text-[#85332a] font-semibold text-sm hover:underline">
                        Add books to your library first →
                      </Link>
                    </div>
                  ) : (
                    <>
                      {myBooks.length > BOOKS_VISIBLE_STEP && (
                        <div className="relative mb-3">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#88726f] text-sm">🔍</span>
                          <input
                            type="text"
                            value={bookSearch}
                            onChange={(e) => handleBookSearchChange(e.target.value)}
                            placeholder="Search your books..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] placeholder:text-[#88726f] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm"
                          />
                        </div>
                      )}

                      {filteredMyBooks.length === 0 ? (
                        <p className="text-sm text-[#88726f] text-center py-4">No books match your search.</p>
                      ) : (
                        <div className="space-y-3">
                          {visibleMyBooks.map((b) => (
                            <label
                              key={b.id}
                              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedBook === b.id
                                  ? "border-[#85332a] bg-[#ffdad5]/20"
                                  : "border-[#dbc1bd] hover:border-[#85332a]/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name="offeredBook"
                                value={b.id}
                                checked={selectedBook === b.id}
                                onChange={() => setSelectedBook(b.id)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                selectedBook === b.id ? "border-[#85332a] bg-[#85332a]" : "border-[#dbc1bd]"
                              }`}>
                                {selectedBook === b.id && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <div>
                                <p className="font-semibold text-[#1b1c19] text-sm">{b.title}</p>
                                <p className="text-xs text-[#554240]">{b.author}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      {filteredMyBooks.length > visibleCount && (
                        <button
                          type="button"
                          onClick={() => setVisibleCount((c) => c + BOOKS_VISIBLE_STEP)}
                          className="w-full text-sm text-[#85332a] font-semibold py-2.5 mt-2 hover:underline"
                        >
                          Show more ({filteredMyBooks.length - visibleCount} more)
                        </button>
                      )}
                    </>
                  )}
                  {myBooks.length > 0 && (
                    <p className="text-xs text-[#88726f] mt-2">
                      Don&apos;t see your book?{" "}
                      <Link href="/library" className="text-[#85332a] font-medium hover:underline">
                        Add it to your library first
                      </Link>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1b1c19] mb-2">
                    Personal Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Hi ${book.ownerName?.split(" ")[0] ?? "there"}, I've been looking for this book for a while...`}
                    className="w-full px-4 py-3 rounded-xl border border-[#dbc1bd] bg-[#f5f3ee] text-[#1b1c19] placeholder:text-[#88726f] outline-none focus:border-[#3b6934] focus:bg-white transition-colors text-sm resize-none leading-relaxed"
                  />
                  <p className="text-xs text-[#88726f] mt-1">{message.length}/500 characters</p>
                </div>

                {book.ownerLocation && (
                  <div className="bg-[#f5f3ee] rounded-xl p-5 border border-[#dbc1bd]">
                    <h3 className="text-sm font-semibold text-[#1b1c19] mb-3">📍 Exchange Details</h3>
                    <p className="text-sm text-[#554240] mb-2">
                      This swap will be coordinated near <strong>{book.ownerLocation}</strong>. Both parties will arrange the handoff once the request is accepted.
                    </p>
                    <p className="text-xs text-[#88726f]">Booktribe recommends meeting in a safe public place like a café or library.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedBook || !message || isPending || myBooks.length === 0}
                  className="w-full bg-[#85332a] text-white py-4 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isPending ? "Sending Request..." : "Send Swap Request"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
