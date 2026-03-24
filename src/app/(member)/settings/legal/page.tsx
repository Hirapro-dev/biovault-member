import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

export default function LegalPage() {
  return (
    <div className="max-w-[700px]">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/settings" className="hover:text-gold transition-colors">設定</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">特定商取引法に基づく表記</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="font-serif-jp text-lg sm:text-xl font-normal text-text-primary tracking-[2px] mb-2">
          特定商取引法に基づく表記
        </h1>
        <GoldDivider width={60} className="mx-auto" />
      </div>

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-8">
        <div className="space-y-0">
          <LegalRow label="販売業者" value="株式会社SCPP" />
          <LegalRow label="運営統括責任者" value="代表取締役" />
          <LegalRow label="所在地" value="〒107-6012 東京都港区赤坂1-12-32 アークヒルズ 森ビル12F" />
          <LegalRow label="電話番号" value="0120-788-839" />
          <LegalRow label="メールアドレス" value="info@biovault.jp" />
          <LegalRow label="サービスの対価" value="基本パッケージ：8,800,000円（税込）／追加培養上清液：800,000円（税込・1回10cc）" />
          <LegalRow label="対価以外の必要料金" value="クリニックでの診察料・交通費等は別途お客様のご負担となります" />
          <LegalRow label="お支払い方法" value="銀行振込" />
          <LegalRow label="お支払い時期" value="契約締結後、当社指定の期日までにお支払いください" />
          <LegalRow label="サービス提供時期" value="入金確認後、順次サービスを開始いたします" />
          <LegalRow label="返品・キャンセル" value="iPS細胞作製開始後のキャンセルについては、実費（150〜200万円）を差し引いた金額を返金いたします。詳細は簡易規約をご確認ください" />
          <LegalRow label="申込の撤回" value="契約書面受領日から8日以内であれば、クーリングオフが適用されます" last />
        </div>
      </div>
    </div>
  );
}

function LegalRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex flex-col sm:flex-row py-4 ${!last ? "border-b border-border" : ""}`}>
      <div className="w-full sm:w-40 text-[11px] text-text-muted mb-1 sm:mb-0 shrink-0">{label}</div>
      <div className="text-[13px] text-text-secondary leading-relaxed">{value}</div>
    </div>
  );
}
