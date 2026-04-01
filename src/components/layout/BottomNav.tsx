"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/about-ips", label: "トップ", icon: "🏠", activeIcon: "🏠" },
  { href: "/dashboard", label: "基本情報", icon: "📋", activeIcon: "📋" },
  { href: "/favorites", label: "お気に入り", icon: "☆", activeIcon: "★" },
  { href: "/settings", label: "マイページ", icon: "👤", activeIcon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary/95 backdrop-blur-md border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/about-ips"
            ? pathname === "/about-ips" || pathname.startsWith("/about-ips?")
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive ? "text-gold" : "text-text-muted"
              }`}
            >
              <span className="text-lg">{isActive ? item.activeIcon : item.icon}</span>
              <span className="text-[10px] tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
