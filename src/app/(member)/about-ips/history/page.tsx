import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

const TIMELINE_DATA = [
  {
    year: "1962",
    title: "核移植による初期化の発見",
    description:
      "英国ケンブリッジ大学のジョン・ガードン博士が、アフリカツメガエルの体細胞核を卵に移植し、クローン個体を作製することに成功。分化した細胞も初期化（リプログラミング）できることを世界で初めて示し、のちのiPS細胞研究の理論的基盤を築いた。",
    icon: "🔬",
    highlight: false,
  },
  {
    year: "1981",
    title: "マウスES細胞の樹立",
    description:
      "英国のマーティン・エヴァンズ博士らが、マウスの胚盤胞から多能性をもつES細胞（胚性幹細胞）を樹立。体のあらゆる細胞に分化できる「万能細胞」の研究が本格的に幕を開けた。",
    icon: "🧪",
    highlight: false,
  },
  {
    year: "1996",
    title: 'クローン羊「ドリー」の誕生',
    description:
      "英国ロスリン研究所のイアン・ウィルマット博士らが、成体の羊の乳腺細胞から核移植によってクローン羊「ドリー」を作製。哺乳類でも体細胞の初期化が可能であることが証明され、世界に衝撃を与えた。",
    icon: "🐑",
    highlight: false,
  },
  {
    year: "1998",
    title: "ヒトES細胞の樹立",
    description:
      "米国ウィスコンシン大学のジェームズ・トムソン教授が、ヒトの胚盤胞からES細胞を樹立することに成功。再生医療への応用に大きな期待が寄せられる一方、胚の破壊を伴う倫理的課題が議論となった。",
    icon: "🧫",
    highlight: false,
  },
  {
    year: "2006",
    title: "iPS細胞の誕生",
    description:
      "京都大学の山中伸弥教授が、マウスの皮膚細胞に4つの因子を導入することで、世界で初めてiPS細胞（人工多能性幹細胞）の作製に成功。再生医療の新たな扉が開かれた。",
    icon: "🧬",
    highlight: true,
  },
  {
    year: "2007",
    title: "ヒトiPS細胞の樹立",
    description:
      "山中教授のグループがヒトの皮膚細胞からiPS細胞を作製することに成功。同時期にウィスコンシン大学のジェームズ・トムソン教授も独立にヒトiPS細胞を樹立し、世界的な研究競争が始まる。",
    icon: "🌏",
    highlight: true,
  },
  {
    year: "2010",
    title: "CiRA設立",
    description:
      "京都大学にiPS細胞研究所（CiRA）が設立。iPS細胞の基礎研究から臨床応用までを一貫して推進する世界最大級の研究拠点が誕生し、研究体制が本格化。",
    icon: "🏛️",
    highlight: false,
  },
  {
    year: "2012",
    title: "ノーベル生理学・医学賞受賞",
    description:
      "山中伸弥教授がジョン・ガードン博士とともにノーベル生理学・医学賞を受賞。「成熟した細胞を多能性を持つ状態に初期化できることの発見」が評価され、iPS細胞は世界的に注目を集める。",
    icon: "🏆",
    highlight: true,
  },
  {
    year: "2014",
    title: "世界初の臨床研究",
    description:
      "理化学研究所の高橋政代プロジェクトリーダーが、iPS細胞由来の網膜色素上皮シートを加齢黄斑変性の患者に移植する世界初の臨床研究を実施。iPS細胞が実際の患者治療に初めて用いられた。",
    icon: "👁️",
    highlight: true,
  },
  {
    year: "2018",
    title: "パーキンソン病への応用",
    description:
      "京都大学の高橋淳教授が、iPS細胞から作製したドーパミン神経前駆細胞をパーキンソン病患者の脳に移植する医師主導治験を開始。神経疾患へのiPS細胞応用が本格化。",
    icon: "🧠",
    highlight: false,
  },
  {
    year: "2020",
    title: "心臓疾患・脊髄損傷への展開",
    description:
      "大阪大学がiPS細胞由来の心筋シートを重症心不全患者に移植する臨床研究を実施。同年、慶應義塾大学では脊髄損傷に対するiPS細胞治療の臨床研究も開始され、適応疾患が広がる。",
    icon: "💗",
    highlight: false,
  },
  {
    year: "2022",
    title: "他家iPS細胞ストックの活用拡大",
    description:
      "CiRA Foundation（旧CiRA）が整備する「再生医療用iPS細胞ストック」を活用した臨床研究が複数の疾患で進展。他家移植による低コスト・迅速な治療実現への道が広がる。",
    icon: "🏥",
    highlight: false,
  },
  {
    year: "2026",
    title: "世界初のiPS細胞製品が承認",
    description:
      "住友ファーマのパーキンソン病治療製品と、クオリプスの重症心不全治療用心筋シートが、iPS細胞を用いた再生医療等製品として世界で初めて承認。研究から社会実装への歴史的な一歩を踏み出した。",
    icon: "🎉",
    highlight: true,
  },
];

export default async function HistoryPage() {
  await requireAuth();

  return (
    <div className="max-w-[860px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-6">
        <Link href="/dashboard" className="hover:text-gold transition-colors">
          トップ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">iPS細胞の歴史</span>
      </div>

      {/* ヘッダー */}
      <div className="text-center mb-12">
        <div className="text-4xl mb-4">📜</div>
        <h1 className="font-serif text-3xl font-light tracking-[3px] text-gold-gradient mb-3">
          History of iPS Cells
        </h1>
        <GoldDivider width={80} className="mx-auto mb-4" />
        <p className="font-serif-jp text-lg text-text-primary mb-2">
          iPS細胞の歴史
        </p>
        <p className="text-[13px] text-text-secondary">
          1962年の核移植実験から2026年の世界初承認まで、60年以上にわたる軌跡
        </p>
      </div>

      {/* タイムライン */}
      <div className="relative">
        {/* 中央の縦線 */}
        <div
          className="absolute left-8 top-0 bottom-0 w-[2px]"
          style={{
            background:
              "linear-gradient(to bottom, transparent, var(--color-gold-dark) 5%, var(--color-gold-primary) 50%, var(--color-gold-dark) 95%, transparent)",
          }}
        />

        <div className="space-y-8">
          {TIMELINE_DATA.map((item, i) => (
            <div key={i} className="relative pl-20">
              {/* 年号ノード */}
              <div
                className={`absolute left-0 top-0 w-16 h-16 rounded-full flex flex-col items-center justify-center z-10 ${
                  item.highlight
                    ? "border-2 border-gold shadow-[0_0_20px_rgba(201,168,76,0.3)]"
                    : "border border-border"
                }`}
                style={{
                  background: item.highlight
                    ? "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))"
                    : "var(--color-bg-secondary)",
                }}
              >
                <span className="text-base">{item.icon}</span>
                <span
                  className={`font-mono text-[10px] ${
                    item.highlight ? "text-gold" : "text-text-muted"
                  }`}
                >
                  {item.year}
                </span>
              </div>

              {/* コンテンツ */}
              <div
                className={`bg-bg-secondary border rounded-md p-6 transition-all duration-300 hover:border-border-gold ${
                  item.highlight ? "border-border-gold" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-gold">{item.year}年</span>
                  <h3 className="font-serif-jp text-[15px] text-text-primary">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[13px] text-text-secondary leading-[1.8]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 下部ナビゲーション */}
      <div className="mt-12 pt-8 border-t border-border flex justify-between">
        <Link
          href="/about-ips/what-is-ips"
          className="text-sm text-text-secondary hover:text-gold transition-colors"
        >
          ← iPS細胞とは？
        </Link>
        <Link
          href="/about-ips/glossary"
          className="text-sm text-gold hover:text-gold-light transition-colors"
        >
          用語集 →
        </Link>
      </div>
    </div>
  );
}
