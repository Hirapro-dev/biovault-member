import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

const GLOSSARY_DATA = [
  {
    category: "基礎用語",
    terms: [
      {
        term: "iPS細胞",
        reading: "アイピーエスさいぼう",
        english: "induced Pluripotent Stem Cell",
        description:
          "体細胞に特定の因子を導入して作製される人工多能性幹細胞。2006年に山中伸弥教授が世界で初めて作製に成功。さまざまな細胞に分化する能力と、ほぼ無限に増殖する能力を持つ。",
      },
      {
        term: "ES細胞",
        reading: "イーエスさいぼう",
        english: "Embryonic Stem Cell（胚性幹細胞）",
        description:
          "胚盤胞から取り出された多能性幹細胞。iPS細胞と同様にあらゆる細胞に分化できるが、作製に胚の破壊を伴うため倫理的課題がある。",
      },
      {
        term: "多能性",
        reading: "たのうせい",
        english: "Pluripotency",
        description:
          "1つの細胞がさまざまな種類の細胞に分化（変化）できる能力のこと。iPS細胞やES細胞はこの多能性を持つ。",
      },
      {
        term: "分化",
        reading: "ぶんか",
        english: "Differentiation",
        description:
          "幹細胞が特定の機能を持つ細胞（神経細胞、心筋細胞、血液細胞など）に変化すること。iPS細胞から目的の細胞に分化させることを「分化誘導」という。",
      },
      {
        term: "初期化（リプログラミング）",
        reading: "しょきか",
        english: "Reprogramming",
        description:
          "分化した体細胞を、多能性を持つ未分化な状態に戻すこと。山中因子（Oct3/4, Sox2, Klf4, c-Myc）を導入することで実現される。",
      },
      {
        term: "体細胞",
        reading: "たいさいぼう",
        english: "Somatic Cell",
        description:
          "生殖細胞以外の体を構成する細胞の総称。皮膚、血液、筋肉などの細胞。iPS細胞は体細胞から作製される。",
      },
      {
        term: "胚盤胞",
        reading: "はいばんほう",
        english: "Blastocyst",
        description:
          "受精卵が分裂を繰り返して形成される初期胚の段階。内部にES細胞の元となる細胞塊を含む。",
      },
      {
        term: "核移植",
        reading: "かくいしょく",
        english: "Nuclear Transfer",
        description:
          "細胞の核を別の細胞（通常は除核した卵子）に移植する技術。クローン羊ドリーはこの技術で作製された。",
      },
    ],
  },
  {
    category: "医療応用",
    terms: [
      {
        term: "再生医療",
        reading: "さいせいいりょう",
        english: "Regenerative Medicine",
        description:
          "病気やケガで損傷した組織・臓器の機能を、細胞や組織の移植によって修復・再生する医療分野。iPS細胞はこの分野の中核技術として期待されている。",
      },
      {
        term: "拒絶反応",
        reading: "きょぜつはんのう",
        english: "Transplant Rejection",
        description:
          "移植された組織や臓器を、免疫系が異物として攻撃する反応。自分自身のiPS細胞から作った細胞を移植すれば、拒絶反応のリスクを大幅に低減できる。",
      },
      {
        term: "他家移植",
        reading: "たかいしょく",
        english: "Allogeneic Transplantation",
        description:
          "他人の細胞を移植すること。iPS細胞ストックから作製した細胞を用いることで、低コストかつ迅速な治療が可能になる。",
      },
      {
        term: "臨床研究・治験",
        reading: "りんしょうけんきゅう・ちけん",
        english: "Clinical Research / Clinical Trials",
        description:
          "新しい治療法や薬の安全性・有効性を、実際の患者さんを対象に検証する研究。承認前の最終段階として実施される。",
      },
      {
        term: "創薬",
        reading: "そうやく",
        english: "Drug Discovery",
        description:
          "新しい医薬品を発見・開発するプロセス。iPS細胞由来の細胞を用いることで、人体に近い環境での薬剤テストが可能になり、開発効率が大幅に向上する。",
      },
    ],
  },
  {
    category: "BioVault 関連用語",
    terms: [
      {
        term: "細胞資産",
        reading: "さいぼうしさん",
        english: "Cell Asset",
        description:
          "BioVault独自の概念。今の健康な状態で作製・保管したiPS細胞を「将来の医療に備える資産」として捉える考え方。若い時の細胞ほど品質が高い。",
      },
      {
        term: "培養上清液",
        reading: "ばいようじょうせいえき",
        english: "Culture Supernatant",
        description:
          "iPS細胞を培養する過程で得られる液体。成長因子やサイトカインなど数百種類の有用成分を含む。",
      },
      {
        term: "ハイリポソーム化",
        reading: "はいりぽそーむか",
        english: "High Liposome Processing",
        description:
          "培養上清液の有効成分をリポソーム（脂質二重膜の微小カプセル）に封入する技術。体内への吸収効率を高め、成分を目的の部位に効率よく届けることができる。",
      },
      {
        term: "点滴投与（全身投与）",
        reading: "てんてきとうよ",
        english: "IV Drip",
        description:
          "培養上清液を静脈から点滴で投与する方法。全身にまんべんなく成分を届けることができる。",
      },
      {
        term: "局所注射",
        reading: "きょくしょちゅうしゃ",
        english: "Local Injection",
        description:
          "培養上清液を特定の部位に直接注射する方法。顔、頭皮、関節など、集中的にケアしたい部位に用いる。",
      },
    ],
  },
];

export default async function GlossaryPage() {
  await requireAuth();

  return (
    <div className="max-w-[860px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-6">
        <Link href="/dashboard" className="hover:text-gold transition-colors">
          トップ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">用語集</span>
      </div>

      {/* ヘッダー */}
      <div className="text-center mb-12">
        <div className="text-4xl mb-4">📖</div>
        <h1 className="font-serif text-3xl font-light tracking-[3px] text-gold-gradient mb-3">
          Glossary
        </h1>
        <GoldDivider width={80} className="mx-auto mb-4" />
        <p className="font-serif-jp text-lg text-text-primary mb-2">用語集</p>
        <p className="text-[13px] text-text-secondary">
          iPS細胞・再生医療に関する専門用語をわかりやすく解説します
        </p>
      </div>

      {/* カテゴリ別用語 */}
      <div className="space-y-10">
        {GLOSSARY_DATA.map((category, ci) => (
          <section key={ci}>
            <h2 className="font-serif-jp text-base font-normal text-gold tracking-wider mb-5 pb-3 border-b border-border">
              {category.category}
            </h2>
            <div className="space-y-4">
              {category.terms.map((item, ti) => (
                <div
                  key={ti}
                  className="bg-bg-secondary border border-border rounded-md p-5 transition-colors duration-300 hover:border-border-gold"
                >
                  <div className="flex items-baseline gap-3 mb-2">
                    <h3 className="text-[15px] text-text-primary font-medium">
                      {item.term}
                    </h3>
                    <span className="text-[11px] text-text-muted">
                      {item.reading}
                    </span>
                  </div>
                  <div className="text-[11px] text-gold-dark font-mono mb-2">
                    {item.english}
                  </div>
                  <p className="text-[13px] text-text-secondary leading-[1.8]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 下部ナビゲーション */}
      <div className="mt-12 pt-8 border-t border-border flex justify-between">
        <Link
          href="/about-ips/history"
          className="text-sm text-text-secondary hover:text-gold transition-colors"
        >
          ← iPS細胞の歴史
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-gold hover:text-gold-light transition-colors"
        >
          トップへ戻る →
        </Link>
      </div>
    </div>
  );
}
