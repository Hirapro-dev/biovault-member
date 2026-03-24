import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

export default function TermsPage() {
  return (
    <div className="max-w-[700px]">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/settings" className="hover:text-gold transition-colors">設定</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">利用規約</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="font-serif-jp text-lg sm:text-xl font-normal text-text-primary tracking-[2px] mb-2">
          利用規約
        </h1>
        <GoldDivider width={60} className="mx-auto" />
      </div>

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-8">
        <article className="text-[13px] text-text-secondary leading-[2] space-y-6">
          <Section title="第1条（適用）">
            <p>本規約は、株式会社SCPP（以下「当社」）が運営するBioVaultメンバーサイト（以下「本サービス」）の利用に関する条件を定めるものです。会員は本規約に同意の上、本サービスを利用するものとします。</p>
          </Section>

          <Section title="第2条（会員資格）">
            <p>本サービスの会員資格は、当社が提供するBioVault会員権を購入し、当社がアカウントを発行した方に限り付与されます。会員資格の譲渡・貸与はできません。</p>
          </Section>

          <Section title="第3条（アカウント管理）">
            <p>会員は、自己の責任においてログインID・パスワードを管理するものとします。第三者による不正使用が判明した場合は、速やかに当社までご連絡ください。</p>
          </Section>

          <Section title="第4条（サービス内容）">
            <p>本サービスは、iPS細胞の作製・保管状況の確認、契約書類の閲覧、培養上清液の投与履歴確認、およびiPS細胞に関する情報提供を行うものです。医療行為そのものは提携クリニックにおいて実施されます。</p>
          </Section>

          <Section title="第5条（禁止事項）">
            <p>会員は、以下の行為を行ってはなりません。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>法令または公序良俗に反する行為</li>
              <li>当社または第三者の権利を侵害する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>アカウント情報を第三者に提供する行為</li>
              <li>本サービスから取得した情報を無断で転載・公開する行為</li>
            </ul>
          </Section>

          <Section title="第6条（免責事項）">
            <p>当社は、本サービスの内容の正確性・完全性を保証するものではありません。本サービスの利用により生じた損害について、当社の故意または重大な過失による場合を除き、責任を負いません。</p>
          </Section>

          <Section title="第7条（規約の変更）">
            <p>当社は、必要と判断した場合に本規約を変更できるものとします。変更後の規約は、本サービス上に掲示した時点から効力を生じます。</p>
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
