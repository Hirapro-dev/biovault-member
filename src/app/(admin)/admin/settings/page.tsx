import { requireAdmin } from "@/lib/auth-helpers";
import Link from "next/link";

export default async function SettingsPage() {
  await requireAdmin();

  const settingsMenu = [
    { href: "/admin/settings/users", label: "ユーザー管理", icon: "👤", description: "管理者アカウントの追加・ロール変更・削除" },
  ];

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        設定
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {settingsMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6 hover:border-border-gold transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-serif-jp text-sm text-text-primary group-hover:text-gold transition-colors">{item.label}</h3>
            </div>
            <p className="text-xs text-text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
