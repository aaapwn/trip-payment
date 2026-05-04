import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/AppSidebar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "หารตัง - แชร์ค่าใช้จ่ายอย่างชัดเจน",
  description: "ระบบคำนวณการแชร์ค่าใช้จ่าย บันทึกรายการและคำนวณว่าใครต้องจ่ายใครเท่าไหร่",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${inter.variable} ${dmSerif.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div className="min-h-screen md:flex">
          <AppSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
