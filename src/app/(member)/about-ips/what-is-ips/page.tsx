import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

export default async function WhatIsIpsPage() {
  await requireAuth();

  return (
    <div className="max-w-[860px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-6">
        <Link href="/dashboard" className="hover:text-gold transition-colors">
          トップ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">iPS細胞とは？</span>
      </div>

      {/* ヘッダー */}
      <div className="text-center mb-10">
        <div className="text-4xl mb-4">🧬</div>
        <h1 className="font-serif text-3xl font-light tracking-[3px] text-gold-gradient mb-3">
          What are iPS Cells?
        </h1>
        <GoldDivider width={80} className="mx-auto mb-4" />
        <p className="font-serif-jp text-lg text-text-primary">iPS細胞とは？</p>
      </div>

      {/* 本文 */}
      <article className="space-y-10">
        {/* セクション1: 定義 */}
        <Section title="iPS細胞（人工多能性幹細胞）">
          <p>
            iPS細胞（induced Pluripotent Stem Cell：人工多能性幹細胞）は、2006年に京都大学の山中伸弥教授によって世界で初めて作製された画期的な細胞です。
          </p>
          <p>
            皮膚や血液などの体細胞に少数の因子を導入し培養することで、さまざまな組織や臓器の細胞に分化する能力（多能性）と、ほぼ無限に増殖する能力をもつ多能性幹細胞へと変化させることができます。
          </p>
          <HighlightBox>
            山中伸弥教授は2012年、ジョン・ガードン博士とともにノーベル生理学・医学賞を受賞。「成熟した細胞を多能性を持つ状態に初期化できることの発見」が評価されました。
          </HighlightBox>
        </Section>

        {/* セクション2: 再生医療 */}
        <Section title="再生医療への応用">
          <p>
            iPS細胞は、自身の細胞から作製できるため、移植時の拒絶反応が起こりにくいという大きな利点があります。病気やケガで失われた機能を回復させる再生医療において、iPS細胞から分化誘導した細胞を移植する治療法の開発が進んでいます。
          </p>
          <p>
            現在、以下の疾患に対して臨床研究や治験が進行しています：
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <DiseaseCard icon="👁️" name="加齢黄斑変性" detail="網膜色素上皮シートの移植" />
            <DiseaseCard icon="🧠" name="パーキンソン病" detail="ドーパミン神経前駆細胞の移植" />
            <DiseaseCard icon="💗" name="重症心不全" detail="iPS細胞由来の心筋シート" />
            <DiseaseCard icon="🦴" name="脊髄損傷" detail="神経前駆細胞の移植" />
          </div>
        </Section>

        {/* セクション3: 創薬 */}
        <Section title="創薬・疾患研究への貢献">
          <p>
            難治性疾患の方自身の細胞からiPS細胞を作り、それを患部の細胞に分化させることで、病気の原因解明に役立てる研究が進んでいます。
          </p>
          <p>
            また、iPS細胞由来の細胞を使えば、人体では実施できない薬剤の有効性や副作用のテストが可能になり、新薬の開発が飛躍的に進むと期待されています。FOP、ALS、家族性アルツハイマー病などの難病に対する創薬治験もすでに始まっています。
          </p>
        </Section>

        {/* セクション4: BioVaultのサービスとの関係 */}
        <Section title="BioVault の「細胞資産」という考え方">
          <p>
            BioVaultでは、お客様の血液から作製したiPS細胞を「細胞資産」と捉えています。今の健康な状態の細胞情報を保管することで、将来の再生医療や個別化医療に備えることができます。
          </p>
          <HighlightBox>
            iPS細胞は若い時の細胞ほど品質が高いとされています。今この瞬間が、あなたの細胞資産を確保する最良のタイミングです。
          </HighlightBox>
          <p>
            培養上清液は、iPS細胞を培養する過程で得られるさまざまな成長因子やサイトカインを含む液体です。これをハイリポソーム化して投与することで、全身のエイジングケアや組織修復が期待されています。
          </p>
        </Section>
      </article>

      {/* 下部ナビゲーション */}
      <div className="mt-12 pt-8 border-t border-border flex justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-text-secondary hover:text-gold transition-colors"
        >
          ← トップへ戻る
        </Link>
        <Link
          href="/about-ips/history"
          className="text-sm text-gold hover:text-gold-light transition-colors"
        >
          iPS細胞の歴史 →
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif-jp text-lg font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        {title}
      </h2>
      <div className="text-sm text-text-primary leading-[1.9] space-y-4">
        {children}
      </div>
    </section>
  );
}

function HighlightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gold/5 border-l-2 border-gold px-5 py-4 rounded-r-md my-4">
      <p className="text-[13px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function DiseaseCard({
  icon,
  name,
  detail,
}: {
  icon: string;
  name: string;
  detail: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 flex items-start gap-3">
      <span className="text-xl">{icon}</span>
      <div>
        <div className="text-[13px] text-text-primary font-medium">{name}</div>
        <div className="text-[11px] text-text-muted mt-0.5">{detail}</div>
      </div>
    </div>
  );
}
