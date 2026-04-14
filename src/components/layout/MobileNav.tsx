"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type NavGroup = {
  heading?: string;
  items: NavItem[];
};

// 会員メニューグループ定義
const MEMBER_NAV_GROUPS: NavGroup[] = [
  {
    heading: "契約・同意書類",
    items: [
      { href: "/documents", label: "iPS作製・保管書類一覧", icon: "🧬" },
      { href: "/culture-fluid/documents", label: "iPS培養上清液書類一覧", icon: "🧪" },
    ],
  },
  {
    heading: "その他規約等",
    items: [
      { href: "/settings/terms", label: "会員規約", icon: "📜" },
      { href: "/settings/legal", label: "特定商取引法に基づく表記", icon: "⚖️" },
      { href: "/settings/privacy", label: "プライバシーポリシー", icon: "🔒" },
    ],
  },
  {
    heading: "アカウント",
    items: [
      { href: "/settings/profile", label: "登録情報", icon: "👤" },
      { href: "/settings/password", label: "パスワード変更", icon: "🔑" },
    ],
  },
];

const adminNav = [
  { href: "/admin", label: "ダッシュボード", icon: "◈" },
  { href: "/admin/members", label: "会員一覧", icon: "◉" },
  { href: "/admin/agencies", label: "代理店管理", icon: "🤝" },
  { href: "/admin/staff", label: "従業員管理", icon: "👔" },
  { href: "/admin/print-requests", label: "印刷依頼管理", icon: "🖨️" },
  { href: "/admin/access-logs", label: "アクセスログ", icon: "📊" },
  { href: "/admin/bank-accounts", label: "振込先管理", icon: "🏦" },
  { href: "/admin/clinics", label: "クリニック管理", icon: "🏥" },
  { href: "/admin/glossary", label: "iPSとは？管理", icon: "🧬" },
];

export default function MobileNav({
  isAdmin,
  userName,
  userRole,
  // 後方互換のため受け取るが、新メニュー構造では使用しない
  signedDocTypes: _signedDocTypes = [],
}: {
  isAdmin: boolean;
  userName: string;
  userRole?: string;
  signedDocTypes?: string[];
}) {
  // ESLint未使用警告を避けるため明示的に void
  void _signedDocTypes;

  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* ヘッダーバー */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border lg:hidden">
        <Link href="/mypage" className="hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="BioVault" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-muted">{userName} 様</span>
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
            {isAdmin ? (
              // 管理者: フラットリスト + SUPER_ADMINのみ設定メニュー
              <>
                {adminNav.map((item, idx) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={`${item.href}-${idx}`}
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
                {userRole === "SUPER_ADMIN" && (
                  <Link
                    href="/admin/settings"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 w-full px-4 py-4 mb-0.5 rounded transition-all duration-200 text-base mt-2 border-t border-border pt-4 ${
                      pathname.startsWith("/admin/settings")
                        ? "bg-bg-tertiary border border-border-gold text-gold"
                        : "border border-transparent text-text-secondary active:bg-bg-elevated"
                    }`}
                  >
                    <span className={`text-base ${pathname.startsWith("/admin/settings") ? "opacity-100" : "opacity-50"}`}>&#x2699;&#xFE0F;</span>
                    設定
                  </Link>
                )}
              </>
            ) : (
              // 会員: グループ別表示
              MEMBER_NAV_GROUPS.map((group, gIdx) => (
                <div
                  key={`group-${gIdx}`}
                  className={gIdx === 0 ? "" : "mt-5 pt-4 border-t border-border"}
                >
                  {group.heading && (
                    <div className="text-[10px] text-text-muted tracking-[2px] px-4 mb-2 uppercase">
                      {group.heading}
                    </div>
                  )}
                  {group.items.map((item, idx) => {
                    const active =
                      pathname === item.href || pathname.startsWith(item.href);
                    return (
                      <Link
                        key={`${item.href}-${idx}`}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 w-full px-4 py-3.5 mb-0.5 rounded transition-all duration-200 text-[13px] leading-snug ${
                          active
                            ? "bg-bg-tertiary border border-border-gold text-gold"
                            : "border border-transparent text-text-secondary active:bg-bg-elevated"
                        }`}
                      >
                        <span className={`text-base shrink-0 ${active ? "opacity-100" : "opacity-50"}`}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))
            )}
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
