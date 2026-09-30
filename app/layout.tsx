import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealTrip AI",
  description: "AI Patient Decision Assistant Prototype"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
