"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/staff", label: "ダッシュボード", icon: "◈" },
  { href: "/staff/members", label: "会員一覧", icon: "👥" },
  { href: "/staff/access-logs", label: "アクセスログ", icon: "📊" },
  { href: "/staff/settings", label: "設定", icon: "⚙" },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  return (
    <div className="w-68 bg-bg-secondary border-r border-border flex flex-col shrink-0 h-screen sticky top-0">
      <Link href="/staff" className="block px-6 py-7 border-b border-border hover:opacity-80 transition-opacity">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BioVault" className="h-10 w-auto" />
        <div className="text-[9px] tracking-[3px] text-text-muted mt-2">STAFF PORTAL</div>
      </Link>
      <nav className="flex-1 p-3 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/staff" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 w-full px-3.5 py-3 mb-0.5 rounded transition-all duration-200 text-[13px] tracking-wide ${active ? "bg-bg-tertiary border border-border-gold text-gold" : "border border-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary"}`}>
              <span className={`text-sm ${active ? "opacity-100" : "opacity-50"}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border text-[10px] text-text-muted tracking-wider">&copy; 2025 SCPP Inc.</div>
    </div>
  );
}
