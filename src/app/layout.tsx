import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Telnyx Admin",
  description: "Admin console for Telnyx messaging profiles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <strong>Telnyx Admin</strong>
          <nav>
            <Link href="/">Dashboard</Link>
            <Link href="/numbers">Numbers</Link>
            <Link href="/conversations">Conversations</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
