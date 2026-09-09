"use client";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function NavBar() {
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
          <span className="hidden sm:inline-flex items-center bg-[#b9eeab] text-[#3b6934] px-3 py-1 rounded-full text-xs font-semibold">
            Coming Soon
          </span>
        </div>

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
