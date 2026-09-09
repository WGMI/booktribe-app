"use client";

import { useEffect, useMemo, useState } from "react";
import { Show, SignUpButton } from "@clerk/nextjs";

const FEATURES = [
  {
    id: "swap",
    icon: "📚",
    title: "Book Swapping",
    teaser: "Trade a book you've finished for one you can't wait to start.",
    detail:
      "List what's on your shelf, browse what's on everyone else's, and send a swap request in one tap. No shipping fees, no middleman — just readers trading directly.",
  },
  {
    id: "scan",
    icon: "📷",
    title: "Scan-to-List",
    teaser: "Snap a photo of a cover and let it fill in the details.",
    detail:
      "Point your camera at a barcode or the cover itself. We recognize the title, author, and edition automatically, so listing a book takes seconds, not minutes.",
  },
  {
    id: "communities",
    icon: "🌍",
    title: "Reading Communities",
    teaser: "Find your people — by genre, by city, by obsession.",
    detail:
      "Join circles like the Nairobi Readers Circle or the Afrofuturism Collective. Swap inside a community you trust, and discover books your tribe is already loving.",
  },
  {
    id: "chat",
    icon: "🤝",
    title: "Swap Negotiation",
    teaser: "Offer a trade, add a note, and work out the details together.",
    detail:
      "Every swap request comes with a message thread so you can agree on which book, where to meet, and when — all before you commit.",
  },
  {
    id: "profile",
    icon: "⭐",
    title: "Reader Profiles",
    teaser: "Your shelf, your stats, your reputation.",
    detail:
      "Track how many books you've swapped, show off your favorite genres, and build a reader profile other members can trust.",
  },
  {
    id: "nearby",
    icon: "📍",
    title: "Nearby Matching",
    teaser: "See who's swapping within walking distance.",
    detail:
      "Booktribe surfaces readers and books near you first, so trading feels like meeting a neighbor — not shipping a parcel across the country.",
  },
] as const;

const QUOTES = [
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "Until the lions have their own historians, the hunter will always be the hero.", author: "Chinua Achebe" },
  { text: "A book is a garden, an orchard, a storehouse, a party, a company by the way.", author: "Proverb" },
  { text: "We are what we pretend to be, so we must be careful about what we pretend to be.", author: "Kurt Vonnegut" },
  { text: "Books are the quietest and most constant of friends.", author: "Charles W. Eliot" },
];

const ROADMAP = [
  { label: "Concept", state: "done" },
  { label: "Building", state: "active" },
  { label: "Private Beta", state: "upcoming" },
  { label: "Launch", state: "upcoming" },
] as const;

const VOTE_STORAGE_KEY = "booktribe-coming-soon-vote";

// Illustrative starting counts so the poll feels alive from the very first visit.
const BASE_VOTES: Record<string, number> = {
  swap: 84,
  scan: 61,
  communities: 97,
  chat: 42,
  profile: 38,
  nearby: 55,
};

function useCountUp(target: number, durationMs = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export default function ComingSoon({
  waitlistCount,
  firstName,
}: {
  waitlistCount: number;
  firstName: string | null;
}) {
  const displayedCount = useCountUp(waitlistCount);

  const [votes, setVotes] = useState<Record<string, number>>(BASE_VOTES);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VOTE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { featureId: string };
        setMyVote(parsed.featureId);
        setVotes((v) => ({ ...v, [parsed.featureId]: v[parsed.featureId] + 1 }));
      }
    } catch {
      // localStorage unavailable — poll still works, just won't remember the vote
    }
  }, []);

  const totalVotes = useMemo(() => Object.values(votes).reduce((a, b) => a + b, 0), [votes]);

  function toggleFlip(id: string) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function castVote(id: string) {
    if (myVote === id) return;
    setVotes((prev) => {
      const next = { ...prev };
      if (myVote) next[myVote] = Math.max(0, next[myVote] - 1);
      next[id] = next[id] + 1;
      return next;
    });
    setMyVote(id);
    try {
      localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify({ featureId: id }));
    } catch {
      // ignore — vote still reflected in this session
    }
  }

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const quote = QUOTES[quoteIndex];

  function shuffleQuote() {
    setSpinning(true);
    let next = quoteIndex;
    while (next === quoteIndex) next = Math.floor(Math.random() * QUOTES.length);
    setTimeout(() => {
      setQuoteIndex(next);
      setSpinning(false);
    }, 220);
  }

  return (
    <main className="hearth-pattern min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 px-5 md:px-16 max-w-[1000px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-[#b9eeab] text-[#3b6934] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b6934] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3b6934]" />
          </span>
          Building in public — launching soon
        </div>

        <h1 className="font-serif text-[40px] md:text-[56px] leading-[1.05] tracking-tight font-bold text-[#1b1c19] mb-6">
          {firstName ? (
            <>
              Good to have you here,{" "}
              <span className="text-[#85332a] italic">{firstName}.</span>
            </>
          ) : (
            <>
              Your bookshelf is about to become a{" "}
              <span className="text-[#85332a] italic">Community Library.</span>
            </>
          )}
        </h1>

        <p className="text-lg text-[#554240] leading-relaxed mb-10 max-w-xl mx-auto">
          {firstName
            ? "You're on the list. Booktribe is still being built — but you'll be the first to swap, scan, and connect the moment we open the doors."
            : "Booktribe is where readers across Kenya swap books, scan covers into instant listings, and find their reading tribe. We're not open yet — join the waitlist to get in on day one."}
        </p>

        <div className="flex flex-col items-center gap-4 mb-10">
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <button className="bg-[#85332a] text-white px-8 py-4 rounded-lg font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shadow-md">
                Join the Waitlist — It&apos;s Free
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <div className="bg-white border border-[#dbc1bd] rounded-lg px-6 py-3 text-sm font-semibold text-[#3b6934] shadow-sm">
              ✅ You&apos;re on the waitlist — we&apos;ll email you the moment we launch.
            </div>
          </Show>

          <div className="font-serif text-3xl font-bold text-[#85332a] tabular-nums">
            {displayedCount.toLocaleString()}+
          </div>
          <p className="text-sm text-[#554240]">readers already waiting</p>
        </div>

        {/* Roadmap stepper */}
        <div className="flex items-center justify-center gap-1 md:gap-2 max-w-lg mx-auto">
          {ROADMAP.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 ${
                    step.state === "done"
                      ? "bg-[#3b6934] border-[#3b6934]"
                      : step.state === "active"
                      ? "bg-[#85332a] border-[#85332a] animate-pulse"
                      : "bg-transparent border-[#dbc1bd]"
                  }`}
                />
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    step.state === "upcoming" ? "text-[#88726f]" : "text-[#1b1c19]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < ROADMAP.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 mb-5 ${
                    step.state === "done" ? "bg-[#3b6934]" : "bg-[#dbc1bd]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Feature flip cards */}
      <section className="py-16 px-5 md:px-16 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-4">
            <h2 className="font-serif text-[32px] font-semibold text-[#1b1c19] mb-3">What We&apos;re Building</h2>
            <p className="text-[#554240] max-w-xl mx-auto">
              Tap a card to see what it does, then vote for the feature you&apos;re most excited about.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10" style={{ perspective: "1200px" }}>
            {FEATURES.map((feature) => {
              const isFlipped = flipped.has(feature.id);
              const pct = totalVotes > 0 ? Math.round((votes[feature.id] / totalVotes) * 100) : 0;
              const isMyPick = myVote === feature.id;
              return (
                <div key={feature.id} className="h-[240px]" style={{ perspective: "1200px" }}>
                  <div
                    className="relative w-full h-full transition-transform duration-500"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front */}
                    <button
                      onClick={() => toggleFlip(feature.id)}
                      className="absolute inset-0 w-full h-full bg-[#f5f3ee] rounded-xl p-6 border border-[#dbc1bd] text-left hover:border-[#85332a] transition-colors"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-3xl">{feature.icon}</span>
                        {isMyPick && (
                          <span className="text-[10px] font-bold bg-[#b9eeab] text-[#3b6934] px-2 py-0.5 rounded-full">
                            YOUR PICK
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-[#1b1c19] mb-2">{feature.title}</h3>
                      <p className="text-[#554240] text-sm leading-relaxed">{feature.teaser}</p>
                      <p className="text-xs text-[#88726f] mt-4 font-medium">Tap to explore →</p>
                    </button>

                    {/* Back */}
                    <div
                      className="absolute inset-0 w-full h-full bg-[#85332a] rounded-xl p-6 text-white flex flex-col"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <p className="text-sm leading-relaxed flex-1 overflow-hidden">{feature.detail}</p>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{pct}% most excited</span>
                          <span className="opacity-75">{votes[feature.id]} votes</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => castVote(feature.id)}
                          disabled={isMyPick}
                          className="flex-1 text-xs font-semibold bg-white text-[#85332a] rounded-lg py-2 disabled:opacity-60 disabled:cursor-default hover:opacity-90 transition-opacity"
                        >
                          {isMyPick ? "Voted ✓" : "I'm excited!"}
                        </button>
                        <button
                          onClick={() => toggleFlip(feature.id)}
                          className="text-xs font-semibold border border-white/40 rounded-lg px-3 hover:bg-white/10 transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quote shuffle */}
      <section className="py-16 px-5 md:px-16 max-w-[800px] mx-auto text-center">
        <p
          className={`font-serif text-2xl md:text-3xl italic text-[#1b1c19] leading-snug mb-4 transition-opacity duration-200 ${
            spinning ? "opacity-0" : "opacity-100"
          }`}
        >
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className={`text-[#554240] mb-6 transition-opacity duration-200 ${spinning ? "opacity-0" : "opacity-100"}`}>
          — {quote.author}
        </p>
        <button
          onClick={shuffleQuote}
          className="text-sm font-semibold text-[#3b6934] border border-[#3b6934] px-5 py-2.5 rounded-full hover:bg-[#3b6934] hover:text-white transition-colors"
        >
          🔀 Another quote
        </button>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-5 md:px-16 bg-[#85332a] text-white">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="font-serif text-[36px] md:text-[40px] font-bold mb-4">
            {firstName ? "Thanks for being early." : "Be first through the door."}
          </h2>
          <p className="text-[#ffdcd7] mb-8 text-lg max-w-xl mx-auto">
            {firstName
              ? "We'll let you know the moment Booktribe opens — no spam, just the launch email."
              : "Join the waitlist now and we'll email you the moment Booktribe opens for swapping."}
          </p>
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <button className="bg-white text-[#85332a] px-10 py-4 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg">
                Join the Waitlist
              </button>
            </SignUpButton>
          </Show>
        </div>
      </section>

      <footer className="py-12 px-5 md:px-16 bg-[#1b1c19] text-[#e4e2dd]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#85332a] flex items-center justify-center">
              <span className="text-white font-bold text-xs">BT</span>
            </div>
            <span className="font-serif font-bold text-[#85332a]">Booktribe</span>
          </div>
          <p className="text-sm text-[#88726f]">© 2026 Booktribe. Built for readers across Kenya.</p>
        </div>
      </footer>
    </main>
  );
}
