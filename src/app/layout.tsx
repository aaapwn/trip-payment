import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";

const inter = Inter({
  variable: "--font-latin-sans",
  subsets: ["latin"],
  display: "swap",
});

// Inter carries no Thai glyphs, so without these every Thai string — nearly the
// whole UI — fell back to an arbitrary system font.
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-thai-sans",
  weight: ["400", "500", "600"],
  subsets: ["thai", "latin"],
  display: "swap",
});

// Display face for headings and money: covers Thai, Latin digits and ฿ in one
// font, so an amount is never half serif and half fallback.
const notoSerifThai = Noto_Serif_Thai({
  variable: "--font-serif-display",
  weight: ["400", "600"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "หารตัง - แชร์ค่าใช้จ่ายอย่างชัดเจน",
  description: "ระบบคำนวณการแชร์ค่าใช้จ่าย บันทึกรายการและคำนวณว่าใครต้องจ่ายใครเท่าไหร่",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#211f1d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${plexThai.variable} ${notoSerifThai.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="min-h-screen md:flex">
          <AppSidebar />
          {/* pb makes room for the mobile tab bar, which is fixed to the bottom. */}
          <main className="min-w-0 flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
