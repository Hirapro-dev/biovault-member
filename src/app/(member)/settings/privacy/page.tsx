import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

export default function PrivacyPage() {
  return (
    <div className="max-w-[700px]">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/settings" className="hover:text-gold transition-colors">設定</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">プライバシーポリシー</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="font-serif-jp text-lg sm:text-xl font-normal text-text-primary tracking-[2px] mb-2">
          プライバシーポリシー
        </h1>
        <GoldDivider width={60} className="mx-auto" />
      </div>

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-8">
        <article className="text-[13px] text-text-secondary leading-[2] space-y-6">
          <p>株式会社SCPP（以下「当社」）は、BioVaultメンバーサイトの運営において、お客様の個人情報の保護を重要な責務と認識し、以下のとおりプライバシーポリシーを定めます。</p>

          <Section title="1. 収集する個人情報">
            <p>当社は、サービス提供にあたり以下の個人情報を収集します。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>氏名、フリガナ、生年月日</li>
              <li>住所、電話番号、メールアドレス</li>
              <li>iPS細胞の作製・保管に関する情報</li>
              <li>クリニックでの採血・投与に関する記録</li>
              <li>契約・入金に関する情報</li>
              <li>サービス利用履歴（ログイン日時等）</li>
            </ul>
          </Section>

          <Section title="2. 利用目的">
            <p>収集した個人情報は、以下の目的で利用します。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>会員権サービスの提供・管理</li>
              <li>iPS細胞の作製・保管状況のご報告</li>
              <li>クリニック予約・投与スケジュールの管理</li>
              <li>契約書類の管理・送付</li>
              <li>サービスに関するお知らせ・ご連絡</li>
              <li>サービスの改善・新サービスの開発</li>
            </ul>
          </Section>

          <Section title="3. 第三者への提供">
            <p>当社は、以下の場合を除き、お客様の個人情報を第三者に提供しません。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>お客様の同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>サービス提供に必要な業務委託先（提携クリニック等）に対して、必要な範囲で提供する場合</li>
            </ul>
          </Section>

          <Section title="4. 安全管理措置">
            <p>当社は、個人情報の漏洩・滅失・毀損を防止するため、適切な安全管理措置を講じます。アクセス制限、暗号化通信、定期的なセキュリティ監査を実施しています。</p>
          </Section>

          <Section title="5. 個人情報の開示・訂正・削除">
            <p>お客様は、当社が保有する自己の個人情報について、開示・訂正・削除を請求することができます。ご請求は担当者までご連絡ください。</p>
          </Section>

          <Section title="6. Cookie の利用">
            <p>本サービスでは、セッション管理のためにCookieを使用しています。Cookieの使用を拒否された場合、サービスの一部が利用できなくなる場合があります。</p>
          </Section>

          <Section title="7. ポリシーの改定">
            <p>当社は、必要に応じて本プライバシーポリシーを改定することがあります。改定後のポリシーは、本サービス上に掲示した時点から効力を生じます。</p>
          </Section>

          <Section title="8. お問い合わせ窓口">
            <p>個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。</p>
            <div className="mt-2 p-4 bg-bg-elevated rounded-md text-[12px] space-y-1">
              <p>株式会社SCPP 個人情報保護担当</p>
              <p>〒107-6012 東京都港区赤坂1-12-32 アークヒルズ 森ビル12F</p>
              <p>TEL: 0120-788-839</p>
              <p>MAIL: privacy@biovault.jp</p>
            </div>
          </Section>

          <div className="text-[11px] text-text-muted pt-4 border-t border-border">
            <p>制定日：2025年4月1日</p>
            <p>株式会社SCPP</p>
          </div>
        </article>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm text-text-primary font-medium mb-2">{title}</h2>
      {children}
    </section>
  );
}
