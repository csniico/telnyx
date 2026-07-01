"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();

  // No nav / logout on the sign-in screen.
  if (pathname === "/signin") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/signin");
    router.refresh();
  }

  return (
    <nav>
      <Link href="/">Dashboard</Link>
      <Link href="/numbers">Numbers</Link>
      <Link href="/conversations">Conversations</Link>
      <button
        onClick={logout}
        style={{ background: "transparent", color: "#111", padding: 0 }}
      >
        Sign out
      </button>
    </nav>
  );
}
