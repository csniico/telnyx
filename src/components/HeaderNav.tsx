"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Phone, MessagesSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/numbers", label: "Numbers", icon: Phone },
  { href: "/conversations", label: "Conversations", icon: MessagesSquare },
];

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
    <nav className="flex items-center gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Button
            key={href}
            asChild
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className={cn(active && "font-medium")}
          >
            <Link href={href}>
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          </Button>
        );
      })}
      <Button variant="ghost" size="sm" onClick={logout} className="ml-1">
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </nav>
  );
}
