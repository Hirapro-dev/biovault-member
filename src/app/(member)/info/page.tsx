import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";

const menuItems = [
  {
    href: "/apply-service",
    icon: "✍️",
    label: "メンバーシップサービス申込",
    description: "メンバーシップへのお申込み",
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

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {menuItems.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-5 py-5 hover:bg-bg-elevated transition-all group ${
              i < menuItems.length - 1 ? "border-b border-border" : ""
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
