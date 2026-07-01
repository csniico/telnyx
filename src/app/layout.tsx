import type { Metadata } from "next";
import HeaderNav from "@/components/HeaderNav";
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
          <HeaderNav />
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
