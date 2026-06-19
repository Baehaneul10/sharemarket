import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${BRAND} | 공동구매 픽업`,
  description: "오늘 주문하면 D+2에 가까운 매장에서 픽업하는 공동구매 마켓",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-sky-50 text-gray-900">{children}</body>
    </html>
  );
}
