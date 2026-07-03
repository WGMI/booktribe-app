"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { joinCommunity } from "@/lib/actions";
import { bookColor } from "@/lib/bookColor";

const GENRES = ["All", "African Literature", "Afrofuturism", "History", "Romance", "Sci-Fi", "Self-Help", "Children's"];

type Community = {
  id: string;
  name: string;
  description: string | null;
  genre: string | null;
  location: string | null;
  memberCount: number;
  isMember: boolean;
};

type Book = {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  condition: string;
  coverUrl: string | null;
  publishYear: number | null;
  ownerName: string | null;
  ownerLocation: string | null;
};

export default function ExploreClient({
  communities,
  books,
}: {
  communities: Community[];
  books: Book[];
}) {
  const [activeTab, setActiveTab] = useState<"communities" | "books">("communities");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [search, setSearch] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filteredCommunities = communities.filter((c) => {
    const matchesGenre = selectedGenre === "All" || c.genre === selectedGenre;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.location ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  function handleJoin(communityId: string) {
    setJoiningId(communityId);
    startTransition(async () => {
      await joinCommunity(communityId);
      setJoiningId(null);
    });
  }

  return (
    <main className="min-h-screen bg-[#fbf9f4]">
      {/* Hero */}
      <div className="bg-[#85332a] text-white py-16 px-5 md:px-16">
        <div className="max-w-[1280px] mx-auto">
          <h1 className="font-serif text-[40px] font-bold mb-3">Discover Clubs & Stories</h1>
          <p className="text-[#ffdcd7] text-lg mb-8 max-w-xl">
            Find your reading community, browse books available to swap, and connect with fellow bibliophiles across Kenya.
          </p>
          <div className="relative max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#554240]">🔍</span>
            <input
              type="text"
              placeholder="Search communities, books, authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-xl bg-white text-[#1b1c19] placeholder:text-[#88726f] font-medium shadow-md outline-none focus:ring-2 focus:ring-[#ffdcd7]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-10">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#f0eee9] rounded-xl p-1 w-fit mb-8">
          <button
            onClick={() => setActiveTab("communities")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "communities" ? "bg-white text-[#85332a] shadow-sm" : "text-[#554240]"}`}
          >
            Communities ({communities.length})
          </button>
          <button
            onClick={() => setActiveTab("books")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "books" ? "bg-white text-[#85332a] shadow-sm" : "text-[#554240]"}`}
          >
            Available Books ({books.length})
          </button>
        </div>

        {/* Genre Filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedGenre === g
                  ? "bg-[#85332a] text-white"
                  : "bg-white text-[#554240] border border-[#dbc1bd] hover:border-[#85332a]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {activeTab === "communities" && (
          <>
            {filteredCommunities.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-[#554240] font-medium">No communities found. Try a different search or genre.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommunities.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl border border-[#dbc1bd] shadow-sm hover:shadow-md transition-shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#b9eeab] flex items-center justify-center text-2xl">📖</div>
                      {c.isMember && (
                        <span className="text-xs bg-[#b9eeab] text-[#3b6934] px-2 py-0.5 rounded-full font-medium">Joined</span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-[#1b1c19] mb-1">{c.name}</h3>
                    {c.description && (
                      <p className="text-sm text-[#554240] mb-3 leading-relaxed line-clamp-2">{c.description}</p>
                    )}
                    <div className="flex gap-2 flex-wrap mb-4">
                      {c.genre && <span className="text-xs bg-[#f0eee9] text-[#554240] px-2 py-0.5 rounded-full">{c.genre}</span>}
                      {c.location && <span className="text-xs text-[#88726f]">📍 {c.location}</span>}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-[#f0eee9]">
                      <span className="text-sm text-[#554240] font-medium">{c.memberCount} member{c.memberCount !== 1 ? "s" : ""}</span>
                      {c.isMember ? (
                        <span className="text-xs text-[#3b6934] font-semibold">✓ Member</span>
                      ) : (
                        <button
                          onClick={() => handleJoin(c.id)}
                          disabled={joiningId === c.id}
                          className="bg-[#3b6934] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {joiningId === c.id ? "Joining..." : "Join Community"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "books" && (
          <>
            {filteredBooks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-[#554240] font-medium">No books available yet. Be the first to add one!</p>
                <Link href="/library" className="inline-block mt-4 bg-[#85332a] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                  Add a Book
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book) => (
                  <div key={book.id} className="bg-white rounded-xl border border-[#dbc1bd] shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div
                      className="h-40 flex items-end p-4 relative overflow-hidden"
                      style={{ backgroundColor: bookColor(book.id) }}
                    >
                      {book.coverUrl && (
                        <img src={book.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="relative z-10 text-white">
                        <p className="font-serif font-bold text-base leading-tight">{book.title}</p>
                        <p className="text-sm opacity-80">{book.author}</p>
                        {book.publishYear && <p className="text-xs opacity-60">{book.publishYear}</p>}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex gap-2 mb-3">
                        {book.genre && <span className="text-xs bg-[#f0eee9] text-[#554240] px-2 py-0.5 rounded-full">{book.genre}</span>}
                        <span className="text-xs bg-[#b9eeab] text-[#3b6934] px-2 py-0.5 rounded-full capitalize">{book.condition}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-[#f0eee9] flex items-center justify-center text-xs">👤</div>
                        <span className="text-sm text-[#554240] font-medium">{book.ownerName ?? "Anonymous"}</span>
                      </div>
                      {book.ownerLocation && (
                        <p className="text-xs text-[#88726f] mb-4">📍 {book.ownerLocation}</p>
                      )}
                      <Link
                        href={`/swap/${book.id}`}
                        className="block w-full bg-[#85332a] text-white text-sm font-semibold py-2.5 rounded-lg text-center hover:opacity-90 transition-opacity mt-3"
                      >
                        Request Swap
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
