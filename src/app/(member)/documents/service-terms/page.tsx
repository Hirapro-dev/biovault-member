import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";

export default async function ServiceTermsPage() {
  await requireAuth();

  return (
    <div className="max-w-[700px]">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/documents" className="hover:text-gold transition-colors">契約・同意事項書類一覧</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">iPSサービス利用規約</span>
      </div>

      <h1 className="font-serif-jp text-lg sm:text-xl font-normal text-text-primary tracking-[2px] mb-6">
        iPSサービス利用規約
      </h1>

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-8">
        <div className="space-y-6 text-xs text-text-secondary leading-relaxed">
          <TS t="第1条（目的）"><p>本規約は、株式会社SCPP（以下「当社」という。）が運営する「BioVault」に関し、会員に適用される利用条件、会員資格、運営上の取扱いその他必要事項を定めるものです。</p></TS>
          <TS t="第2条（定義）"><p>「本サービス」とは、当社が「BioVault」の名称で運営するBioVaultメンバーシップサービスおよびこれに付随する一切のサービスをいいます。</p><p>「会員」とは、当社所定の手続きにより本サービスの申込みを行い、当社が承認し、会員資格を付与された個人または法人をいいます。</p><p>「会員権」とは、本サービスの利用資格として当社が付与する地位をいいます。</p></TS>
          <TS t="第3条（本規約の適用）"><p>本規約は、会員と当社との間の本サービス利用に関する一切の関係に適用されます。</p></TS>
          <TS t="第4条（本サービスの位置付け）"><p>当社は、本サービスの運営主体であり、会員に対し医療行為を行うものではありません。</p></TS>
          <TS t="第5条（会員資格）"><p>会員資格は、当社が申込みを承認した時点で発生します。会員資格は会員本人に専属し、第三者へ譲渡できません。</p></TS>
          <TS t="第6条（本サービスの内容）"><p>本サービスの中核は、CellAssetに関する案内、申込管理、連絡調整、提供連携および関連する会員向け付随サービスとします。</p></TS>
          <TS t="第7条（会員限定サービス）"><p>当社は、会員に対し、情報配信サービス、個別相談またはコンシェルジュ案内、会員限定イベント等を提供することがあります。</p></TS>
          <TS t="第8条（会員情報の管理）"><p>会員は、届出情報に変更があった場合、速やかに届け出るものとします。</p></TS>
          <TS t="第9条（利用条件）"><p>本サービスは、会員本人のために提供されるものであり、第三者に利用させることはできません。</p></TS>
          <TS t="第10条（禁止事項）"><p>会員は、法令違反、虚偽申告、権利侵害、業務妨害、反社会的勢力への利益供与等を行ってはなりません。</p></TS>
          <TS t="第11条（知的財産権）"><p>本サービスに関連する知的財産権は、当社または正当な権利者に帰属します。</p></TS>
          <TS t="第12条（秘密保持）"><p>会員は、本サービスに関連して知り得た非公知情報を第三者に開示してはなりません。</p></TS>
          <TS t="第13条（個人情報等の取扱い）"><p>当社は、会員の個人情報を法令およびプライバシーポリシーに従って取り扱います。</p></TS>
          <TS t="第14条（情報配信）"><p>当社は、運営上必要な通知を電子メール等により行うことができます。</p></TS>
          <TS t="第15条（会員資格の停止・喪失）"><p>規約違反、虚偽申告、料金未払い等の場合、会員資格を停止または喪失させることができます。</p></TS>
          <TS t="第16条（退会）"><p>会員は、当社所定の方法により退会を申し出ることができます。</p></TS>
          <TS t="第17条（死亡時の取扱い）"><p>会員が死亡したときは、会員資格は当然に終了します。</p></TS>
          <TS t="第18条（規約の変更）"><p>当社は、法令改正等の事由がある場合、本規約を変更することができます。</p></TS>
          <TS t="第19条（免責）"><p>当社は、特定の結果、効果、効能を保証しません。天災等による損害について責任を負いません。</p></TS>
          <TS t="第20条（反社会的勢力の排除）"><p>会員は、反社会的勢力に該当しないことを表明し、保証します。</p></TS>
          <TS t="第21条（協議事項）"><p>本規約に定めのない事項は、誠実に協議して解決するものとします。</p></TS>
          <TS t="第22条（準拠法・管轄）"><p>本規約は日本法に準拠します。紛争が生じた場合、当社本店所在地を管轄する裁判所を専属的合意管轄裁判所とします。</p></TS>
        </div>
      </div>
    </div>
  );
}

function TS({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-sm text-text-primary font-medium mb-1">{t}</h4>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}
