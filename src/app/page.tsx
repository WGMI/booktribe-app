import { Show, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

const FEATURED_BOOKS = [
  { title: "Weep Not, Child", author: "Ngũgĩ wa Thiong'o", color: "#a44a3f" },
  { title: "Half of a Yellow Sun", author: "Chimamanda Ngozi Adichie", color: "#3b6934" },
  { title: "Things Fall Apart", author: "Chinua Achebe", color: "#6c4500" },
  { title: "Purple Hibiscus", author: "Chimamanda Ngozi Adichie", color: "#85332a" },
  { title: "The River Between", author: "Ngũgĩ wa Thiong'o", color: "#3b6934" },
  { title: "So Long a Letter", author: "Mariama Bâ", color: "#6c4500" },
];

const COMMUNITIES = [
  { name: "Nairobi Readers Circle", members: 142, genre: "All Genres", location: "Nairobi" },
  { name: "Afrofuturism Collective", members: 89, genre: "Sci-Fi / Fantasy", location: "Mombasa" },
  { name: "East African Lit Hub", members: 214, genre: "African Literature", location: "Online" },
];

export default function HomePage() {
  return (
    <main className="hearth-pattern min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-24 px-5 md:px-16 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-[#b9eeab] text-[#3b6934] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <span>🌍</span> Kenya&apos;s Book Exchange Community
            </div>
            <h1 className="font-serif text-[48px] leading-[56px] tracking-tight font-bold text-[#1b1c19] mb-6">
              Turn Your Bookshelf into a{" "}
              <span className="text-[#85332a] italic">Community Library.</span>
            </h1>
            <p className="text-lg text-[#554240] leading-relaxed mb-10 max-w-xl">
              Gather around the digital hearth. Connect with fellow readers in Nairobi, Mombasa, and beyond to swap
              stories, trade knowledge, and build your tribe through the power of books.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <button className="bg-[#85332a] text-white px-8 py-4 rounded-lg font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shadow-md">
                    Join the Tribe — It&apos;s Free
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/library"
                  className="bg-[#85332a] text-white px-8 py-4 rounded-lg font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shadow-md text-center"
                >
                  Go to My Library
                </Link>
              </Show>
              <Link
                href="/explore"
                className="border-2 border-[#3b6934] text-[#3b6934] px-8 py-4 rounded-lg font-semibold text-sm hover:bg-[#3b6934] hover:text-white transition-all active:scale-95 text-center"
              >
                Browse Communities
              </Link>
            </div>
            <div className="flex items-center gap-8 mt-10">
              {[["2,400+", "Books Available"], ["840+", "Active Readers"], ["38", "Communities"]].map(([num, label]) => (
                <div key={label} className="flex items-center gap-8">
                  <div>
                    <p className="font-serif text-2xl font-bold text-[#85332a]">{num}</p>
                    <p className="text-sm text-[#554240]">{label}</p>
                  </div>
                  {label !== "Communities" && <div className="w-px h-10 bg-[#dbc1bd]" />}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:block">
            <div className="grid grid-cols-3 gap-3">
              {FEATURED_BOOKS.map((book, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-lg shadow-lg flex flex-col justify-end p-2 text-white overflow-hidden relative"
                  style={{ backgroundColor: book.color }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold leading-tight">{book.title}</p>
                    <p className="text-[8px] opacity-80 mt-0.5">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-5 md:px-16 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-[32px] font-semibold text-[#1b1c19] mb-4">How Booktribe Works</h2>
            <p className="text-[#554240] max-w-xl mx-auto">Three simple steps to start sharing and discovering books with your community.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: "📚", title: "List Your Books", desc: "Add books from your shelf that you're ready to share. Set availability, condition, and your preferred swap genres." },
              { step: "02", icon: "🔍", title: "Discover & Request", desc: "Browse libraries from readers near you. Find a book you love and send a swap request with a personal note." },
              { step: "03", icon: "🤝", title: "Meet & Exchange", desc: "Coordinate with your new reading friend, exchange books, and leave a review. Build lasting literary friendships." },
            ].map((item) => (
              <div key={item.step} className="bg-[#f5f3ee] rounded-xl p-8 border border-[#dbc1bd]">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-serif text-4xl font-bold text-[#dbc1bd]">{item.step}</span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#1b1c19] mb-3">{item.title}</h3>
                <p className="text-[#554240] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Communities */}
      <section className="py-20 px-5 md:px-16 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-serif text-[32px] font-semibold text-[#1b1c19]">Active Communities</h2>
            <p className="text-[#554240] mt-1">Find your reading tribe across Kenya</p>
          </div>
          <Link href="/explore" className="text-sm font-semibold text-[#3b6934] hover:underline">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMMUNITIES.map((c) => (
            <div key={c.name} className="bg-white rounded-xl p-6 border border-[#dbc1bd] shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-[#b9eeab] flex items-center justify-center mb-4 text-2xl">📖</div>
              <h3 className="font-serif text-lg font-semibold text-[#1b1c19] mb-1 group-hover:text-[#85332a] transition-colors">{c.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-[#b9eeab] text-[#3b6934] px-2 py-0.5 rounded-full font-medium">{c.genre}</span>
                <span className="text-xs text-[#554240]">📍 {c.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#554240]">{c.members} members</span>
                <button className="text-xs font-semibold text-[#3b6934] border border-[#3b6934] px-3 py-1 rounded-full hover:bg-[#3b6934] hover:text-white transition-colors">
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 md:px-16 bg-[#85332a] text-white">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="font-serif text-[40px] font-bold mb-4">Ready to build your tribe?</h2>
          <p className="text-[#ffdcd7] mb-8 text-lg max-w-xl mx-auto">
            Join hundreds of readers across Kenya who are already swapping books, sharing stories, and discovering new voices.
          </p>
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <button className="bg-white text-[#85332a] px-10 py-4 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg">
                Get Started — It&apos;s Free
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/library" className="inline-block bg-white text-[#85332a] px-10 py-4 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg">
              Go to My Library
            </Link>
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
          <div className="flex gap-6">
            <Link href="/explore" className="text-sm text-[#88726f] hover:text-white transition-colors">Explore</Link>
            <Link href="/library" className="text-sm text-[#88726f] hover:text-white transition-colors">Library</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
