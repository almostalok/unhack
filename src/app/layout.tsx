import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UnHack",
  description: "Fair by design. Transparent by default.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[radial-gradient(circle_at_top_left,_rgba(83,74,183,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(29,158,117,0.14),_transparent_35%)]">
        {children}
      </body>
    </html>
  );
}
