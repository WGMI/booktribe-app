"use client";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/library", label: "My Library" },
];

export default function NavBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 bg-[#fbf9f4]/95 backdrop-blur border-b border-[#dbc1bd] shadow-sm">
      <div className="max-w-[1280px] mx-auto px-5 md:px-16 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#85332a] flex items-center justify-center">
              <span className="text-white font-bold text-sm">BT</span>
            </div>
            <span className="font-serif font-bold text-xl text-[#85332a] tracking-tight">Booktribe</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                isActive(href)
                  ? "text-[#85332a] font-semibold border-b-2 border-[#85332a] pb-1"
                  : "text-[#554240] hover:text-[#85332a]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-sm font-semibold text-[#85332a] hover:opacity-80 transition-opacity px-4 py-2">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-semibold bg-[#85332a] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                Join Tribe
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
