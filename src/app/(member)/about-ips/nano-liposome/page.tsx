import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";

// 目次データ
const TOC = [
  { num: "01", icon: "🔬", title: "ハイブリッド・ナノリポソーム化とは何か" },
  { num: "02", icon: "🛡️", title: "なぜリポソーム化するのか" },
  { num: "03", icon: "⚗️", title: "「ハイブリッド」であることの意味" },
  { num: "04", icon: "✨", title: "どのような利点が期待されるのか" },
  { num: "05", icon: "💧", title: "皮膚や組織への浸透はどう考えるべきか" },
  { num: "06", icon: "🧬", title: "iPS培養上清液と組み合わせる意味" },
  { num: "07", icon: "📊", title: "どのような研究結果があるのか" },
  { num: "08", icon: "⚖️", title: "何が言えて、何が言えないのか" },
  { num: "09", icon: "📝", title: "まとめ" },
] as const;

export default async function NanoLiposomePage() {
  await requireAuth();

  return (
    <div className="max-w-[760px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/dashboard" className="hover:text-gold transition-colors">コンテンツ</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">ハイブリッド・ナノリポソーム化に関する基礎知識</span>
      </div>

      {/* ヒーローヘッダー */}
      <div className="mb-8">
        <div className="text-[10px] tracking-[4px] text-gold mb-3">BASIC KNOWLEDGE / 02</div>
        <h1 className="font-serif-jp text-xl sm:text-3xl font-normal text-text-primary tracking-[2px] leading-[1.6] mb-4">
          ハイブリッド・ナノリポソーム化<br />に関する基礎知識
        </h1>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-[1px] w-12 bg-gold" />
          <div className="text-[10px] text-text-muted tracking-wider">
            全9章 / 読了目安 約10分
          </div>
        </div>
        <p className="text-xs sm:text-sm text-text-secondary leading-[2]">
          成分を「必要な場所へ、必要な形で届ける」ための独自製剤技術。
          リポソームの基本原理から、iPS培養上清液との組み合わせ価値までを整理した資料です。
        </p>
      </div>

      {/* キービジュアル風の概念図 */}
      <div className="bg-gradient-to-br from-gold/5 via-bg-secondary to-transparent border border-border rounded-md p-6 sm:p-8 mb-8">
        <div className="text-[10px] text-gold tracking-[3px] mb-4">CONCEPT</div>
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <ConceptNode icon="💊" label="有効成分" sub="Active Ingredient" />
          <ArrowRight />
          <ConceptNode icon="🧪" label="ナノカプセル化" sub="Encapsulation" highlight />
          <ArrowRight />
          <ConceptNode icon="🎯" label="局所送達" sub="Delivery" />
        </div>
        <p className="text-[11px] text-text-muted text-center mt-5 leading-relaxed">
          リン脂質の二重膜構造が、有効成分を保護しながら目的の場所まで運ぶ
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
        {/* 01 */}
        <Section num="01" icon="🔬" title="ハイブリッド・ナノリポソーム化とは何か">
          <p>
            まず前提として、<KW>リポソーム</KW> とは、リン脂質を主成分とするごく小さなカプセル状の構造体です。
          </p>
          <p>
            水になじみやすい部分と脂になじみやすい部分を持つリン脂質が<KW>二重膜</KW>をつくり、その内側や膜部分にさまざまな成分を包み込めるのが特徴です。
          </p>
          <Callout icon="💡" title="DDS（ドラッグ・デリバリー・システム）">
            医薬品分野では、リポソームは代表的な DDS（Drug Delivery System）のひとつとして長く研究・実用化されてきました。
          </Callout>
          <p>
            <KW>ナノリポソーム</KW> は、そのリポソームをナノサイズ領域まで小型化したものです。
          </p>
          <p>一般にサイズが小さくなるほど、分散性、表面積、送達設計の自由度が高まりやすく、成分保護や局所送達の工夫がしやすくなります。</p>
        </Section>

        {/* 02 */}
        <Section num="02" icon="🛡️" title="なぜリポソーム化するのか">
          <p>成分をそのまま入れるだけでは、外気、酸化、光、温度、酵素、保存環境の影響を受けやすく、狙った場所まで安定して届きにくいことがあります。</p>
          <p>
            そこでリポソーム化を行うと、成分を脂質膜の中に保持しながら、<KW>成分の保護</KW>、<KW>分散性の向上</KW>、<KW>放出設計</KW>、<KW>局所送達の最適化</KW> がしやすくなります。
          </p>

          <SubHeading>化粧品・皮膚領域での使用目的</SubHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <UsageItem>不安定な成分を守る</UsageItem>
            <UsageItem>肌表面での均一な分散を助ける</UsageItem>
            <UsageItem>角層〜表皮付近への届け方を設計する</UsageItem>
            <UsageItem>成長因子の放出速度を穏やかにする</UsageItem>
            <UsageItem>使用感を整える（効果の体感）</UsageItem>
          </div>
        </Section>

        {/* 03 */}
        <Section num="03" icon="⚗️" title="「ハイブリッド」であることの意味">
          <Callout icon="🔑" title="独自先端技術">
            「ハイブリッド・ナノリポソーム」という言葉自体は、業界全体で単一の厳密定義が固まった標準用語ではなく、当社提携機関の独自先端技術です。
          </Callout>
          <p>
            成長因子が豊富なiPS培養上清液にナノリポソーム化を施していることから、「有効成分をナノサイズのリン脂質カプセルに封入し、<KW>安定性</KW>・<KW>分散性</KW>・<KW>届け方</KW>に配慮した送達設計」に加工し、唯一無二の培養上清液を精製しています。
          </p>
          <Quote>
            必要な有効成分を、必要な場所へ届ける。
          </Quote>
          <p>
            現時点において、iPS培養上清液にナノリポソーム化技術を施している企業は、当社提携機関以外に存在しません。
          </p>
        </Section>

        {/* 04 */}
        <Section num="04" icon="✨" title="どのような利点が期待されるのか">
          <p>ハイブリッド・ナノリポソーム化によって一般に期待されるのは、主に次の5点です。</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <BenefitCard
              num="01"
              title="成分の安定性向上"
              description="不安定なペプチド、成長因子、抗酸化成分などは、そのままだと分解しやすい場合があります。リポソーム化は、こうした成分を外的環境からある程度守る手段として使われます。"
            />
            <BenefitCard
              num="02"
              title="分散性・均一性の改善"
              description="成分が局所的に偏らず、製剤中でより均一に存在しやすくなります。塗布剤でも注入剤でも、設計品質の観点ではかなり重要です。"
            />
            <BenefitCard
              num="03"
              title="局所送達の効率化"
              description="「どこまで届くか」は素材、サイズ、電荷、皮膚状態、製剤全体設計に依存しますが、リポソーム系は一般に、非封入成分より送達設計がしやすいと考えられています。"
            />
            <BenefitCard
              num="04"
              title="放出制御"
              description="カプセルからすぐ一気に出すのではなく、徐々に放出する設計が可能になります。iPS培養上清液の場合、一度の点滴からおよそ1ヶ月ほどの期間を通じて、全身に成長因子が運ばれることが想定されています（個体差あり）。"
            />
            <BenefitCard
              num="05"
              title="使用対象に合わせたチューニング"
              description="成分の性質や届けたい組織、使う部位、製剤形状に応じて、膜の硬さ・柔らかさ・サイズ・表面性状を調整できるため、単純な「液体のまま使う」より設計自由度が高くなります。"
            />
          </div>
        </Section>

        {/* 05 */}
        <Section num="05" icon="💧" title="皮膚や組織への「浸透」はどう考えるべきか">
          <Callout icon="⚠️" title="よくある誤解">
            この分野で最も誤解が多いのが「浸透」という言葉です。実際には、浸透にはいくつかの段階があります。
          </Callout>

          <div className="mt-4 space-y-2">
            {[
              { step: "1", label: "肌表面で均一に広がる" },
              { step: "2", label: "角層に取り込まれる" },
              { step: "3", label: "表皮近傍まで到達する" },
              { step: "4", label: "真皮側へより深く分布する" },
              { step: "5", label: "体細胞との親和性が高い", highlight: true },
              { step: "6", label: "血液を通じて体内各所へ運び込まれる", highlight: true },
              { step: "7", label: "体内循環レベルで利用される", highlight: true },
            ].map((item) => (
              <div
                key={item.step}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md border ${
                  item.highlight
                    ? "bg-gold/5 border-gold/30"
                    : "bg-bg-elevated border-border"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                    item.highlight
                      ? "bg-gold text-bg-primary font-bold"
                      : "border border-border text-text-muted"
                  }`}
                >
                  {item.step}
                </span>
                <span className={`text-[12px] sm:text-[13px] ${item.highlight ? "text-gold" : "text-text-secondary"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <Callout icon="💉" title="iPS培養上清液の場合">
            iPS培養上清液の場合は点滴や注射で体内へ注入するため、主に (5) 以降の作用における浸透効果の高さが期待できます。
          </Callout>
        </Section>

        {/* 06 */}
        <Section num="06" icon="🧬" title="iPS培養上清液と組み合わせる意味">
          <p>iPS培養上清液は、単一の成分ではなく、成長因子、サイトカイン、EV、各種分泌タンパク質などが重なった複合体です。</p>
          <p>このような複合成分は、単純溶液のままだと、<KW>安定性</KW>・<KW>分散性</KW>・<KW>成分保護</KW>・<KW>局所送達</KW> の点で課題が出やすくなります。そこで、ナノリポソーム化のような送達設計が意味を持ちます。</p>
          <Quote>
            成分の中身を変えるのではなく、成分の届け方と守り方を整える。
          </Quote>
          <p>
            iPS培養上清液に対するハイブリッド・ナノリポソーム化の意義は、iPS培養上清液に含まれる成長因子を余すことなく、全身に巡らせることを目的とした加工技術となっています。
          </p>
        </Section>

        {/* 07 */}
        <Section num="07" icon="📊" title="どのような研究結果があるのか">
          <p>ナノリポソーム技術そのものについては、医薬品DDSとしての歴史が長く、臨床応用例も多数あります。</p>
          <p>
            一方で、「iPS培養上清液 × ナノリポソーム化」という組み合わせについて、公開文献として十分に標準化された大規模比較データが一般公開されているわけではありませんが、故に独自先端技術として評価されている側面もあります。
          </p>

          <SubHeading>技術の方向性として合理的な領域</SubHeading>
          <div className="space-y-2 mt-3">
            <ResearchItem>リポソーム化による皮膚送達改善</ResearchItem>
            <ResearchItem>柔軟性を高めたベシクルによる透過性向上</ResearchItem>
            <ResearchItem>ハイブリッド設計による安定性・保持性改善</ResearchItem>
            <ResearchItem>成長因子や有効成分の到達力向上による期待価値</ResearchItem>
          </div>
        </Section>

        {/* 08 */}
        <Section num="08" icon="⚖️" title="何が言えて、何が言えないのか">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* 言えること */}
            <div className="rounded-md border border-gold/30 bg-gold/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">✓</span>
                <span className="text-[12px] text-gold font-medium tracking-wider">言えること</span>
              </div>
              <ul className="list-none space-y-2.5 text-[12px] text-text-secondary leading-[1.8]">
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-0.5 shrink-0">◆</span>
                  <span>リポソームは、リン脂質からなる代表的DDS技術である。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-0.5 shrink-0">◆</span>
                  <span>ナノ化により、分散性・安定性・送達設計の自由度が高まりやすい。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-0.5 shrink-0">◆</span>
                  <span>ハイブリッド設計により、膜安定性や表面特性、柔軟性などを調整できる。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-0.5 shrink-0">◆</span>
                  <span>化粧品・皮膚領域では、リポソームは成分保護や送達改善の観点から有用性が期待されている。</span>
                </li>
              </ul>
            </div>

            {/* 言い切れないこと */}
            <div className="rounded-md border border-border bg-bg-elevated p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">✕</span>
                <span className="text-[12px] text-text-muted font-medium tracking-wider">言い切れないこと</span>
              </div>
              <ul className="list-none space-y-2.5 text-[12px] text-text-muted leading-[1.8]">
                <li className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5 shrink-0">◇</span>
                  <span>どんな成分でも必ず深部まで届く。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5 shrink-0">◇</span>
                  <span>リポソーム化しただけで必ず効果が強くなる。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5 shrink-0">◇</span>
                  <span>ハイブリッド化すれば必ず通常製剤より優れる。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5 shrink-0">◇</span>
                  <span>個別の身体変化や施術結果が当然に生じる。</span>
                </li>
              </ul>
            </div>
          </div>
        </Section>

        {/* 09 */}
        <Section num="09" icon="📝" title="まとめ">
          <div className="rounded-md border border-gold/30 bg-gradient-to-br from-gold/5 via-transparent to-transparent p-5 sm:p-6">
            <p className="mb-3">
              <KW>ハイブリッド・ナノリポソーム化</KW> とは、有効成分をリン脂質ベースのナノカプセルに封入し、その <KW>安定性</KW>・<KW>分散性</KW>・<KW>保持性</KW>・<KW>届け方</KW> をより精密に設計するための製剤技術です。
            </p>
            <p>
              iPS培養上清液のように、多種多様な成長因子やタンパク質が含まれる複合液に対しては、成分そのものの機能を活かしつつ、安定的かつ効率的に送達する手段として合理的に位置づけられます。
            </p>
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
  return <span className="text-gold font-medium">{children}</span>;
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

function ConceptNode({ icon, label, sub, highlight }: { icon: string; label: string; sub: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0 min-w-0">
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl border ${
          highlight
            ? "bg-gradient-to-br from-gold/20 to-gold/5 border-gold/40"
            : "bg-bg-elevated border-border"
        }`}
      >
        {icon}
      </div>
      <div className="text-center">
        <div className={`text-[11px] sm:text-xs font-medium ${highlight ? "text-gold" : "text-text-primary"}`}>
          {label}
        </div>
        <div className="text-[9px] font-mono text-text-muted tracking-wider">{sub}</div>
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <div className="flex-1 flex items-center justify-center shrink">
      <span className="text-gold text-lg">→</span>
    </div>
  );
}

function UsageItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded bg-bg-elevated border border-border">
      <span className="text-gold mt-0.5 shrink-0">◆</span>
      <span className="text-[12px] text-text-secondary">{children}</span>
    </div>
  );
}

function BenefitCard({ num, title, description }: { num: string; title: string; description: string }) {
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

function ResearchItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 rounded-md bg-bg-elevated border border-border">
      <span className="text-gold mt-0.5 shrink-0">▸</span>
      <span className="text-[12px] text-text-secondary">{children}</span>
    </div>
  );
}
