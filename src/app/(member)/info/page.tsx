import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";

const menuItems = [
  {
    href: "/apply-service",
    icon: "✍️",
    label: "iPSサービス利用申込",
    description: "iPSサービスへのお申込み",
  },
  {
    href: "/settings/terms",
    icon: "📜",
    label: "会員規約",
    description: "利用規約のご確認",
  },
  {
    href: "/settings/product",
    icon: "📋",
    label: "商品定義",
    description: "BioVaultメンバーシップの商品内容",
  },
  {
    href: "/settings/legal",
    icon: "⚖️",
    label: "特商法に基づく表記",
    description: "特定商取引法に基づく表記",
  },
  {
    href: "/settings/privacy",
    icon: "🔒",
    label: "プライバシーポリシー",
    description: "個人情報の取り扱いについて",
  },
];

export default async function InfoPage() {
  await requireAuth();

  return (
    <div>
      <h2 className="font-serif-jp text-lg font-normal text-text-primary tracking-wider mb-5">
        サービス詳細
      </h2>

      {/* iPSサービス利用申込（目立つカード） */}
      <Link
        href={menuItems[0].href}
        className="block mb-4 rounded-xl border border-border-gold overflow-hidden group hover:shadow-[0_0_20px_rgba(191,160,75,0.1)] transition-all"
        style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.10) 0%, rgba(191,160,75,0.02) 100%)" }}
      >
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.20) 0%, rgba(191,160,75,0.08) 100%)", border: "1px solid rgba(191,160,75,0.25)" }}>
            {menuItems[0].icon}
          </div>
          <div className="flex-1">
            <div className="text-sm text-gold font-semibold tracking-wide">
              {menuItems[0].label}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">
              {menuItems[0].description}
            </div>
          </div>
          <span className="text-gold text-xs group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </Link>

      {/* その他のメニュー */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {menuItems.slice(1).map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-5 py-5 hover:bg-bg-elevated transition-all group ${
              i < menuItems.length - 2 ? "border-b border-border" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-lg shrink-0">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm text-text-primary group-hover:text-gold transition-colors font-medium">
                {item.label}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {item.description}
              </div>
            </div>
            <span className="text-text-muted group-hover:text-gold transition-colors text-xs">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
