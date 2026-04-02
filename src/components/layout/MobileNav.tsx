"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

// 会員用トグルメニュー
const memberNav = [
  { href: "/settings/profile", label: "登録情報", icon: "👤" },
  { href: "/settings/password", label: "パスワード変更", icon: "🔑" },
  { href: "/settings/notifications", label: "通知設定", icon: "🔔" },
];

const adminNav = [
  { href: "/admin", label: "ダッシュボード", icon: "◈" },
  { href: "/admin/members", label: "会員一覧", icon: "◉" },
  { href: "/admin/agencies", label: "代理店管理", icon: "🤝" },
  { href: "/admin/print-requests", label: "印刷依頼管理", icon: "🖨️" },
  { href: "/admin/articles", label: "記事管理", icon: "📰" },
  { href: "/admin/news", label: "ニュース管理", icon: "📡" },
  { href: "/admin/videos", label: "動画管理", icon: "🎬" },
  { href: "/admin/settings", label: "規約・書類管理", icon: "⚙" },
];

export default function MobileNav({
  isAdmin,
  userName,
}: {
  isAdmin: boolean;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const nav = isAdmin ? adminNav : memberNav;

  return (
    <>
      {/* ヘッダーバー */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BioVault" className="h-10 w-auto" />
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 text-text-secondary"
          aria-label="メニュー"
        >
          <span
            className={`block w-5 h-[1.5px] bg-current transition-all duration-300 ${
              open ? "rotate-45 translate-y-[4.5px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-current transition-all duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-[1.5px] bg-current transition-all duration-300 ${
              open ? "-rotate-45 -translate-y-[4.5px]" : ""
            }`}
          />
        </button>
      </div>

      {/* オーバーレイ */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ドロワーメニュー */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[280px] bg-bg-secondary border-l border-border transform transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ドロワーヘッダー */}
          <div className="px-5 py-5 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-xs text-text-secondary">{userName} 様</div>
              <div className="text-[9px] text-text-muted mt-0.5">
                {isAdmin ? "ADMIN CONSOLE" : "MEMBER'S PORTAL"}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 p-3 overflow-y-auto">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 w-full px-4 py-4 mb-0.5 rounded transition-all duration-200 text-base ${
                    active
                      ? "bg-bg-tertiary border border-border-gold text-gold"
                      : "border border-transparent text-text-secondary active:bg-bg-elevated"
                  }`}
                >
                  <span className={`text-base ${active ? "opacity-100" : "opacity-50"}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* ログアウト */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-3 bg-transparent border border-border text-text-secondary rounded text-xs hover:border-border-gold hover:text-gold transition-all cursor-pointer"
            >
              ログアウト
            </button>
            <div className="text-center text-[9px] text-text-muted mt-3 tracking-wider">
              &copy; 2025 SCPP Inc.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
