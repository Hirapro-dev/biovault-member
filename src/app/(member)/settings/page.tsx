import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
export default async function SettingsPage() {
  const user = await requireAuth();

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { membership: true },
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        設定
      </h2>

      {/* プロフィールサマリー */}
      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
          <div className="w-14 h-14 rounded-full bg-bg-elevated border border-border-gold flex items-center justify-center text-xl text-gold shrink-0">
            {fullUser?.name?.charAt(0) || "U"}
          </div>
          <div>
            <div className="text-base text-text-primary font-medium">{fullUser?.name}</div>
            <div className="text-[11px] text-text-muted font-mono mt-0.5">
              {fullUser?.loginId} ・ {fullUser?.membership?.memberNumber || "---"}
            </div>
          </div>
        </div>
        <Link
          href="/settings/profile"
          className="flex items-center justify-between py-3 text-sm text-text-primary hover:text-gold transition-colors border-b border-border"
        >
          <span>登録情報</span>
          <span className="text-text-muted">→</span>
        </Link>
        <Link
          href="/settings/password"
          className="flex items-center justify-between py-3 text-sm text-text-primary hover:text-gold transition-colors"
        >
          <span>パスワード変更</span>
          <span className="text-text-muted">→</span>
        </Link>
      </div>

      {/* 規約・ポリシー */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        <SettingsLink href="/settings/terms" label="利用規約" />
        <SettingsLink href="/settings/legal" label="特定商取引法に基づく表記" />
        <SettingsLink href="/settings/privacy" label="プライバシーポリシー" last />
      </div>
    </div>
  );
}

function SettingsLink({ href, label, last = false }: { href: string; label: string; last?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-5 sm:px-6 py-5 text-base text-text-primary hover:bg-bg-elevated hover:text-gold transition-all ${
        !last ? "border-b border-border" : ""
      }`}
    >
      <span>{label}</span>
      <span className="text-text-muted text-xs">→</span>
    </Link>
  );
}
