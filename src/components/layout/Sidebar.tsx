"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const memberNav = [
  { href: "/dashboard", label: "マイページ", icon: "◈" },
  { href: "/status", label: "ステータス詳細", icon: "◉" },
  { href: "/documents", label: "契約書類", icon: "◇" },
  { href: "/about-ips", label: "About iPS", icon: "🧬" },
  { href: "/treatment", label: "醸成器申込", icon: "◆" },
  { href: "/concierge", label: "コンシェルジュ", icon: "◎" },
  { href: "/settings", label: "設定", icon: "⚙" },
];

const adminNav = [
  { href: "/admin", label: "ダッシュボード", icon: "◈" },
  { href: "/admin/members", label: "会員一覧", icon: "◉" },
  { href: "/admin/create-account", label: "アカウント発行", icon: "◇" },
  { href: "/admin/status-update", label: "ステータス更新", icon: "◆" },
  { href: "/admin/articles", label: "iPS ニュース管理", icon: "📰" },
];

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const nav = isAdmin ? adminNav : memberNav;

  return (
    <div className="w-60 bg-bg-secondary border-r border-border flex flex-col shrink-0 h-screen sticky top-0">
      {/* ロゴ */}
      <div className="px-6 py-7 border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="BioVault"
          className="h-8 w-auto"
        />
        <div className="text-[9px] tracking-[3px] text-text-muted mt-2">
          {isAdmin ? "ADMIN CONSOLE" : "MEMBER'S PORTAL"}
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 w-full px-3.5 py-3 mb-0.5 rounded transition-all duration-200 text-[13px] tracking-wide ${
                active
                  ? "bg-bg-tertiary border border-border-gold text-gold"
                  : "border border-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              }`}
            >
              <span className={`text-sm ${active ? "opacity-100" : "opacity-50"}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* フッター */}
      <div className="px-5 py-4 border-t border-border text-[10px] text-text-muted tracking-wider">
        &copy; 2025 SCPP Inc.
      </div>
    </div>
  );
}
