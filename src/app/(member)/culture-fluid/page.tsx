import { requireAuth } from "@/lib/auth-helpers";

export default async function CultureFluidPage() {
  await requireAuth();

  return (
    <div>
      <h2 className="font-serif-jp text-lg font-normal text-text-primary tracking-wider mb-5">
        培養上清液サービス詳細
      </h2>

      <div className="flex flex-col items-center justify-center py-16 sm:py-24">
        {/* アイコン */}
        <div className="text-5xl mb-6">🧪</div>

        {/* タイトル */}
        <div className="text-xl sm:text-2xl font-serif-jp text-gold tracking-wider mb-3">
          Coming Soon
        </div>

        {/* 説明 */}
        <div className="text-sm text-text-muted text-center leading-relaxed max-w-sm">
          培養上清液サービスは現在準備中です。<br />
          サービス開始まで今しばらくお待ちください。
        </div>

        {/* 装飾ライン */}
        <div className="mt-8 w-16 h-[1px] bg-border-gold opacity-40" />
      </div>
    </div>
  );
}
