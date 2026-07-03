import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Libre_Caslon_Text, Plus_Jakarta_Sans } from "next/font/google";
import NavBar from "@/components/NavBar";
import { ensureUser } from "@/lib/ensureUser";
import "./globals.css";

const libreCalson = Libre_Caslon_Text({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Booktribe | Turn Your Bookshelf into a Community Library",
  description:
    "Connect with fellow readers in Nairobi, Mombasa, and beyond to swap stories, trade knowledge, and build your tribe through the power of books.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureUser();
  return (
    <html lang="en" className={`${libreCalson.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-[#fbf9f4] text-[#1b1c19] font-sans antialiased">
        <ClerkProvider>
          <NavBar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
