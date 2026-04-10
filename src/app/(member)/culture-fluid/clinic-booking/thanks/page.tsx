import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

export default async function ClinicBookingThanksPage() {
  await requireAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-bg-secondary border border-border-gold rounded-md p-8 sm:p-12 text-center">
        <div className="text-5xl mb-6">✓</div>
        <h2 className="font-serif-jp text-xl text-gold tracking-wider mb-4">
          クリニックの予約を申し込みました
        </h2>
        <GoldDivider />
        <p className="text-text-secondary text-sm leading-relaxed mt-6 mb-2">
          担当スタッフより折り返しご連絡いたします。
        </p>
        <p className="text-text-secondary text-sm leading-relaxed mb-2">
          施術日やクリニックの詳細が確定しましたら、
        </p>
        <p className="text-text-secondary text-sm leading-relaxed mb-8">
          マイページでご確認いただけます。
        </p>
        <Link
          href="/culture-fluid"
          className="inline-flex items-center gap-2 px-8 py-3 rounded tracking-wider text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #BFA04B, #D4B856)", color: "#070709" }}
        >
          培養上清液サービスへ戻る
        </Link>
      </div>
    </div>
  );
}
