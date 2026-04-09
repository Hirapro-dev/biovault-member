import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";

// 目次データ
const TOC = [
  { num: "01", icon: "🧬", title: "iPS培養上清液とは何か" },
  { num: "02", icon: "✨", title: "なぜ注目されるのか" },
  { num: "03", icon: "💊", title: "iPS培養上清液には何が入っているのか" },
  { num: "04", icon: "🎯", title: "どのような働きが期待されているのか" },
  { num: "05", icon: "📊", title: "どのような研究結果があるのか" },
  { num: "06", icon: "⚖️", title: "他の培養上清液と何が違うのか" },
  { num: "07", icon: "👁", title: "プロの視点で見ると、何を重視すべきか" },
] as const;

export default async function CultureFluidKnowledgePage() {
  await requireAuth();

  return (
    <div className="max-w-[760px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/dashboard" className="hover:text-gold transition-colors">コンテンツ</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">iPS培養上清液に関する基礎知識</span>
      </div>

      {/* ヒーローヘッダー */}
      <div className="mb-8">
        <div className="text-[10px] tracking-[4px] text-gold mb-3">BASIC KNOWLEDGE / 01</div>
        <h1 className="font-serif-jp text-xl sm:text-3xl font-normal text-text-primary tracking-[2px] leading-[1.6] mb-4">
          iPS培養上清液に関する<br />基礎知識
        </h1>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-[1px] w-12 bg-gold" />
          <div className="text-[10px] text-text-muted tracking-wider">
            全7章 / 読了目安 約8分
          </div>
        </div>
        <p className="text-xs sm:text-sm text-text-secondary leading-[2]">
          iPS培養上清液が持つ性質、研究背景、期待される作用と、その限界について、
          エビデンスに基づいて整理した資料です。
        </p>
      </div>

      {/* 目次カード */}
      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6 mb-8">
        <div className="text-[10px] text-gold tracking-[3px] mb-4 flex items-center gap-2">
          <span className="inline-block w-4 h-[1px] bg-gold" />
          TABLE OF CONTENTS
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TOC.map((item) => (
            <a
              key={item.num}
              href={`#section-${item.num}`}
              className="flex items-center gap-3 p-2.5 rounded hover:bg-bg-elevated transition-colors group"
            >
              <span className="font-mono text-[11px] text-gold shrink-0">{item.num}</span>
              <span className="text-sm shrink-0">{item.icon}</span>
              <span className="text-xs text-text-secondary group-hover:text-gold transition-colors truncate">
                {item.title}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* 本文 */}
      <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-10">
        {/* 01. iPS培養上清液とは何か */}
        <Section num="01" icon="🧬" title="iPS培養上清液とは何か">
          <p>iPS培養上清液とは、iPS細胞を培養した際に、その培養液中に分泌・放出される成分群を含む上澄み液のことです。</p>
          <p>
            中身は単一成分ではなく、<KW>成長因子</KW>、<KW>サイトカイン</KW>、<KW>ケモカイン</KW>、<KW>細胞外小胞（EVs）</KW>、<KW>miRNA</KW>、その他の分泌タンパク質が重なった「複合体」と捉えるのが正確です。研究の世界では、こうした総体を <KW>secretome（セクレトーム）</KW> と呼びます。
          </p>
          <Callout icon="💡" title="ポイント">
            培養上清液は「1種類の完成品」ではなく、どのiPS細胞を使ったか、どの培地で、どれくらい培養し、どのように精製し、EVや可溶性因子をどこまで残したかで大きく変わります。実際には中身の設計と品質管理がかなり重要です。
          </Callout>
        </Section>

        {/* 02. なぜ注目されるのか */}
        <Section num="02" icon="✨" title="なぜ注目されるのか">
          <p>再生医療でiPS細胞そのものが注目される理由は、「さまざまな細胞に分化できる」ことですが、近年はそれに加えて、細胞が外へ出すシグナルそのものにも注目が集まっています。</p>
          <Quote>
            「細胞を入れる」だけでなく、「細胞が出す情報を使う」という発想です。
          </Quote>
          <p>これは、細胞移植と比べて、製造・保管・取り扱いの面で整理しやすい可能性があるため、研究開発上の魅力があります。</p>
          <p>
            現時点の研究では、iPSC由来の培養上清液やEVは、主に <KW>炎症の調整</KW>、<KW>細胞保護</KW>、<KW>血管新生の支援</KW>、<KW>創傷治癒の支援</KW>、<KW>線維化の抑制</KW> の方向での作用が検討されています。
          </p>
        </Section>

        {/* 03. iPS培養上清液には何が入っているのか */}
        <Section num="03" icon="💊" title="iPS培養上清液には何が入っているのか">
          <SubHeading>基本となる代表的な成長因子群</SubHeading>
          <p>iPS培養上清液の説明でよく挙がる代表因子としては、以下のような因子があります。</p>

          <div className="flex flex-wrap gap-2 my-4">
            {["HGF", "FGF", "VEGF", "IGF-1", "TGF-β", "PDGF", "EGF"].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-[11px] font-mono tracking-wider bg-gold/10 text-gold border border-gold/20"
              >
                {f}
              </span>
            ))}
          </div>

          <div className="space-y-3 mt-4">
            <FactorCard name="HGF" description="細胞保護、組織修復、血管新生支援の文脈でよく語られる因子です。" />
            <FactorCard name="FGF（特に FGF2）" description="線維芽細胞系や血管新生、修復環境の形成に関わる代表格です。" />
            <FactorCard name="VEGF" description="血管新生や微小循環支援の中核因子です。" />
            <FactorCard name="IGF-1" description="細胞生存や代謝、組織修復の文脈で重要視されます。" />
            <FactorCard name="TGF-β" description="創傷治癒や組織再構築に深く関わる一方、文脈によっては線維化にも関与します。" />
            <FactorCard name="PDGF" description="細胞増殖や修復初期のシグナルとして有名です。" />
            <FactorCard name="EGF" description="上皮系の再生やターンオーバー支援の文脈で頻出します。" />
          </div>

          <SubHeading>iPS由来だからこそ注目される特殊な因子</SubHeading>
          <p>
            iPS系のsecretomeは、単に「よくある成長因子の寄せ集め」ではなく、由来細胞や分化段階によって、<KW>神経保護</KW>・<KW>免疫調整</KW>・<KW>修復誘導</KW> に関わる少し独特な分子が目立つことがあります。
          </p>
          <p>
            たとえば、ヒト多能性幹細胞由来の神経前駆細胞の培養上清では、
            <KW>Galectin-1</KW>、<KW>Midkine</KW>、<KW>SLIT2</KW>、<KW>Agrin</KW>、<KW>Pleiotrophin</KW>、<KW>MFGE8</KW>、<KW>VEGFB</KW> といった分子が鍵シグナルとして挙げられています。
          </p>
        </Section>

        {/* 04. どのような働きが期待されているのか */}
        <Section num="04" icon="🎯" title="どのような働きが期待されているのか">
          <p>現時点の研究を、誇張せずに整理すると、期待されている働きは大きく5つです。</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <ExpectationCard num="01" title="炎症環境の調整" description="修復を邪魔する過剰炎症を少し落ち着かせ、組織が回復しやすい環境をつくる方向です。" />
            <ExpectationCard num="02" title="細胞保護" description="傷ついた細胞がすぐに壊れないよう支える、いわば「保護膜」的な働きです。" />
            <ExpectationCard num="03" title="血管新生・微小循環支援" description="修復には血流が必要なので、VEGF系などを中心に、微小血管環境を整える方向の期待があります。" />
            <ExpectationCard num="04" title="創傷治癒・再上皮化支援" description="傷が閉じる、表皮が再形成される、瘢痕が過度にならないようにする、といった方向です。" />
            <ExpectationCard num="05" title="線維化の抑制" description="組織が硬く瘢痕化して機能を落とす方向を抑える、という発想です。肺や腎などの前臨床モデルで検討されています。" />
          </div>
        </Section>

        {/* 05. どのような研究結果があるのか */}
        <Section num="05" icon="📊" title="どのような研究結果があるのか">
          <Callout icon="⚠️" title="重要な前提">
            人で確立した治療結果と、動物や細胞での研究結果は分けて見る必要があります。現時点で、iPS培養上清液そのものについて、適応や製法が標準化された大規模ヒト臨床データが十分に揃っているとは言えません。公開されているエビデンスの多くは前臨床段階です。
          </Callout>

          <SubHeading>前臨床で比較的一貫している領域</SubHeading>
          <div className="space-y-3 mt-3">
            <StudyCard area="肺障害" summary="iPSC-CM（iPSC由来培地）が急性肺障害や肺線維化モデルで炎症や組織傷害を軽減したという報告があります。" />
            <StudyCard area="腎障害" summary="虚血性急性腎障害モデルで、iPSC-CMが腎障害を軽減した報告があります。" />
            <StudyCard area="肺高血圧" summary="ラット肺高血圧モデルで、iPSCやiPSC-CMが炎症・血管リモデリングを抑える方向に働いた報告があります。" />
            <StudyCard area="創傷治癒・熱傷" summary="iPSC由来EVやiPSC由来角化細胞EVでは、熱傷創の閉鎖促進や修復支援が報告されています。" />
            <StudyCard area="脳梗塞後回復" summary="ヒト多能性幹細胞由来神経前駆細胞の培養上清で、梗塞体積や炎症の低減、機能回復支援が報告されています。" />
          </div>
        </Section>

        {/* 06. 他の培養上清液と何が違うのか */}
        <Section num="06" icon="⚖️" title="他の培養上清液と何が違うのか">
          <p>一般に「培養上清液」といっても、由来細胞が違えば中身は大きく変わります。</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
            {[
              { label: "脂肪由来\nMSC", sub: "Adipose" },
              { label: "臍帯由来\nMSC", sub: "Umbilical" },
              { label: "真皮\n線維芽細胞", sub: "Dermal" },
              { label: "iPSC由来\n分化細胞", sub: "iPSC", highlight: true },
            ].map((item) => (
              <div
                key={item.sub}
                className={`rounded-md p-3 text-center border ${
                  item.highlight
                    ? "bg-gold/5 border-gold/30"
                    : "bg-bg-elevated border-border"
                }`}
              >
                <div className={`text-[10px] font-mono tracking-wider mb-1 ${item.highlight ? "text-gold" : "text-text-muted"}`}>
                  {item.sub}
                </div>
                <div className={`text-[11px] whitespace-pre-line ${item.highlight ? "text-gold font-medium" : "text-text-secondary"}`}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <p>iPS由来の特徴としては、少なくとも理論上、以下の特徴があります。</p>
          <ul className="list-none space-y-2 mt-3">
            <BulletItem>由来細胞設計の自由度が高い（血液から作製可能）</BulletItem>
            <BulletItem>神経系・血管系・角化細胞系・前駆細胞系などに機能する成長因子や有効可能性タンパク質において、その他の培養上清液よりも圧倒的な含有量が確認されている</BulletItem>
            <BulletItem>成長因子の豊富さ、含有量の高さから今後はその他の培養上清液の上位互換として認知、利用されていく可能性が高い</BulletItem>
          </ul>
        </Section>

        {/* 07. プロの視点で見ると、何を重視すべきか */}
        <Section num="07" icon="👁" title="プロの視点で見ると、何を重視すべきか">
          <p>本当に見るべきポイントは、「すごい成長因子が入っているか」だけではありません。むしろ以下の4点です。</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <CheckPoint num="①" title="由来の明確性" description="どの細胞から、どの工程で作られたか。" />
            <CheckPoint num="②" title="製造・品質管理" description="無菌性、エンドトキシン、マイコプラズマ、残留不純物、ロット差管理。" />
            <CheckPoint num="③" title="中身の再現性" description="毎回ほぼ同じsecretomeプロファイルが出せるか。" />
            <CheckPoint num="④" title="提供体制" description="適切に輸送・保管でき、品質が保たれるか。" />
          </div>
        </Section>
      </article>

      {/* フッター免責 */}
      <div className="mt-10 rounded-md overflow-hidden border border-border">
        <div className="bg-gradient-to-r from-gold/5 via-transparent to-transparent px-5 py-4 flex items-start gap-3">
          <span className="text-base shrink-0">ℹ️</span>
          <p className="text-[11px] text-text-muted leading-relaxed">
            本資料は一般的な情報提供を目的としたものであり、特定の治療効果、美容上の効果、医療上の効能を保証するものではありません。
            個別の医学的判断は、提携医療機関の医師にご相談ください。
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 共通コンポーネント群 ────────────────────────────

function Section({
  num,
  icon,
  title,
  children,
}: {
  num: string;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`section-${num}`} className="scroll-mt-20">
      {/* セクションヘッダー */}
      <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border">
        <div className="w-12 h-12 rounded-full border border-gold/40 flex flex-col items-center justify-center shrink-0 bg-gradient-to-br from-gold/10 to-transparent">
          <span className="text-[9px] font-mono text-gold tracking-wider leading-none">{num}</span>
          <span className="text-base leading-none mt-0.5">{icon}</span>
        </div>
        <h2 className="font-serif-jp text-base sm:text-lg text-text-primary tracking-wider">
          {title}
        </h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[13px] sm:text-sm text-gold font-medium mt-5 mb-2 tracking-wider flex items-center gap-2">
      <span className="inline-block w-3 h-[1px] bg-gold" />
      {children}
    </h3>
  );
}

function KW({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-gold font-medium">{children}</span>
  );
}

function Callout({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-md border border-gold/20 bg-gold/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] text-gold tracking-wider font-medium">{title}</span>
      </div>
      <div className="text-[12px] sm:text-[13px] text-text-secondary leading-[1.9]">
        {children}
      </div>
    </div>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-4 pl-4 border-l-2 border-gold">
      <p className="text-[13px] sm:text-sm text-text-primary font-medium italic">
        {children}
      </p>
    </blockquote>
  );
}

function FactorCard({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-bg-elevated border border-border">
      <span className="text-[10px] font-mono tracking-wider text-gold bg-gold/10 border border-gold/20 px-2 py-1 rounded shrink-0 whitespace-nowrap">
        {name}
      </span>
      <p className="text-[12px] text-text-secondary leading-[1.8] pt-0.5">{description}</p>
    </div>
  );
}

function ExpectationCard({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-elevated p-4 hover:border-gold/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded">
          {num}
        </span>
        <span className="text-[13px] text-text-primary font-medium">{title}</span>
      </div>
      <p className="text-[12px] text-text-muted leading-[1.8]">{description}</p>
    </div>
  );
}

function StudyCard({ area, summary }: { area: string; summary: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-elevated px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="text-[11px] text-gold font-medium shrink-0 mt-0.5 px-2 py-0.5 rounded bg-gold/10 border border-gold/20 whitespace-nowrap">
          {area}
        </span>
        <p className="text-[12px] text-text-secondary leading-[1.9]">{summary}</p>
      </div>
    </div>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-gold mt-0.5 shrink-0">◆</span>
      <span>{children}</span>
    </li>
  );
}

function CheckPoint({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-elevated p-4 hover:border-gold/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base text-gold">{num}</span>
        <span className="text-[13px] text-text-primary font-medium">{title}</span>
      </div>
      <p className="text-[12px] text-text-muted leading-[1.8]">{description}</p>
    </div>
  );
}
