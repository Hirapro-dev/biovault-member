"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 会員用SVGアイコン（BottomNavと統一）
function UserSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ServiceSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function BookSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

// 培養上清液: フラスコ風アイコン
function FlaskSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" />
      <path d="M10 3v7.4a2 2 0 0 1-.5 1.3L4 19a2 2 0 0 0 1.5 3.5h13A2 2 0 0 0 20 19l-5.5-7.3a2 2 0 0 1-.5-1.3V3" />
      <path d="M8.5 16h7" />
    </svg>
  );
}

function DnaSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15c6.667-6 13.333 0 20-6" />
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      <path d="M17 6l-2.5 2.5" />
      <path d="M14 8l-1 1" />
      <path d="M7 18l2.5-2.5" />
      <path d="M10 16l1-1" />
      <path d="M2 9c6.667 6 13.333 0 20 6" />
    </svg>
  );
}

const memberNav = [
  { href: "/mypage", label: "マイページ", Icon: UserSvg },
  { href: "/info", label: "① iPS作製・保管サービス詳細", Icon: ServiceSvg },
  { href: "/culture-fluid", label: "② 培養上清液サービス詳細", Icon: FlaskSvg },
  { href: "https://biovault.biz/doc.pdf", label: "パンフレット", Icon: BookSvg, external: true },
  { href: "/dashboard", label: "iPSとは？", Icon: DnaSvg },
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

export default function Sidebar({ isAdmin, userRole }: { isAdmin: boolean; userRole?: string }) {
  const pathname = usePathname();

  return (
    <div className="w-68 bg-bg-secondary border-r border-border flex flex-col shrink-0 h-screen sticky top-0">
      {/* ロゴ */}
      <Link href={isAdmin ? "/admin" : "/mypage"} className="block px-6 py-7 border-b border-border hover:opacity-80 transition-opacity">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BioVault" className="h-10 w-auto" />
        <div className="text-[9px] tracking-[3px] text-text-muted mt-2">
          {isAdmin ? "ADMIN CONSOLE" : "MEMBER Site"}
        </div>
      </Link>

      {/* ナビゲーション */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {isAdmin ? (
          <>
            {adminNav.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
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
            {userRole === "SUPER_ADMIN" && (
              <Link
                href="/admin/settings"
                className={`flex items-center gap-3 w-full px-3.5 py-3 mb-0.5 rounded transition-all duration-200 text-[13px] tracking-wide mt-2 border-t border-border pt-3 ${
                  pathname.startsWith("/admin/settings")
                    ? "bg-bg-tertiary border border-border-gold text-gold"
                    : "border border-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                }`}
              >
                <span className={`text-sm ${pathname.startsWith("/admin/settings") ? "opacity-100" : "opacity-50"}`}>&#x2699;&#xFE0F;</span>
                設定
              </Link>
            )}
          </>

        ) : (
          memberNav.map((item) => {
            const isExternal = "external" in item && item.external;
            const active = !isExternal && (pathname === item.href || (item.href !== "/mypage" && item.href !== "/dashboard" && pathname.startsWith(item.href)));

            if (isExternal) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-3.5 py-3 mb-0.5 rounded transition-all duration-200 text-[13px] tracking-wide border border-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  <span className="opacity-50"><item.Icon /></span>
                  {item.label}
                </a>
              );
            }

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
                <span className={`${active ? "opacity-100" : "opacity-50"}`}><item.Icon /></span>
                {item.label}
              </Link>
            );
          })
        )}
      </nav>

      {/* フッター */}
      <div className="px-5 py-4 border-t border-border text-[10px] text-text-muted tracking-wider">
        &copy; 2025 SCPP Inc.
      </div>
    </div>
  );
}
