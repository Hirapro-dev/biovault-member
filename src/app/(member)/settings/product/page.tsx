import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

export default function ProductDefinitionPage() {
  return (
    <div className="max-w-[700px]">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/info" className="hover:text-gold transition-colors">サービス詳細</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">商品定義</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="font-serif-jp text-lg sm:text-xl font-normal text-text-primary tracking-[2px] mb-2">
          BioVaultメンバーシップ｜商品定義
        </h1>
        <GoldDivider width={60} className="mx-auto" />
      </div>

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-8">
        <article className="text-[13px] text-text-secondary leading-[2] space-y-8">

          {/* 商品名 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-3">1. 商品名</h2>
            <p>BioVault（細胞を資産化する・細胞を保管する）</p>
            <p>販売商品：BioVaultメンバーシップ</p>
          </section>

          {/* 販売価格 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-3">2. 販売価格</h2>
            <p className="text-gold font-medium text-base">会員権価格：880万円（税込）</p>
            <p className="text-xs text-text-muted mt-1">※ 自身の血液からiPS細胞を作製し、所有、管理、活用できる権利を含みます</p>
          </section>

          {/* 事業カテゴリ */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-3">3. サービスカテゴリ</h2>
            <p className="font-medium text-text-primary">メンバーシップサービス：BioVault iPS OrderMade Membership</p>
          </section>

          {/* メインサービス */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-3">4. メインサービス</h2>
            <div className="bg-bg-elevated border border-border-gold rounded-md p-4 mb-3">
              <div className="text-gold font-medium mb-2">CellAsset｜あなた自身の細胞資産を作製する</div>
              <p className="text-xs leading-relaxed">お客様自身の血液からiPS細胞を作製し、凍結保存で10年間の保管が可能です。これにより「ご自身のための細胞資産」を確保いただけます。また、作製したiPS細胞から培養上清液を精製することで、美容領域から医療領域での活用が可能となります。</p>
            </div>
          </section>

          {/* 商品の提供価値 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-3">5. 提供価値</h2>
            <div className="space-y-3">
              <div className="bg-bg-elevated border border-border rounded-md p-4">
                <div className="text-xs text-gold tracking-wider mb-2">現在の価値</div>
                <p className="text-xs leading-relaxed">iPS培養上清液を活用したコンディショニング体験をご提供いたします。iPS由来の培養上清液には、230種類以上の有効性のあるタンパク質が確認されており、スキンケア・スカルプケア・サンケアに適するとされています。</p>
              </div>
              <div className="bg-bg-elevated border border-border rounded-md p-4">
                <div className="text-xs text-gold tracking-wider mb-2">将来の価値</div>
                <p className="text-xs leading-relaxed">5年後、10年後に広がる再生医療・個別化医療の選択肢に備えることができます。細胞バンクを起点に、将来は「ご自身に最も合う薬」「ご自身に最も合う治療」「治療に最適な医療施設のご紹介」へつなぐ構想がございます。</p>
              </div>
            </div>
          </section>

          {/* 商品構成 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-3">6. 商品構成</h2>
            <div className="mb-4">
              <h3 className="text-xs text-gold tracking-wider mb-2">本体サービス</h3>
              <ul className="text-xs space-y-1.5 list-none">
                <li>・自家iPS細胞の作製</li>
                <li>・iPSパーソナル・バンキング（10年間）</li>
                <li>・HAL型病気リスク診断表</li>
                <li>・iPS培養上清液を活用した施術プログラム</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs text-gold tracking-wider mb-2">会員特典</h3>
              <ul className="text-xs space-y-1.5 list-none">
                <li>① Biocouture — 高濃度iPSオーダーコスメ開発製造権</li>
                <li>② BioVault NFT — 資産証明・デジタル鑑定書</li>
                <li>③ iPS Information — エビデンス・レポート・ニュースレター</li>
                <li>④ iPS Concierge — 担当制の総合サポート</li>
                <li>⑤ BV Invitation — 催事全般の招待・優遇</li>
                <li>⑥ BV Inheritance — 相続・手続き</li>
              </ul>
            </div>
          </section>

          {/* 別途費用 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-3">7. 別途費用について</h2>
            <p className="text-xs text-text-muted mb-2">以下は会員権価格に含まれず、別途費用となります。</p>
            <ul className="text-xs space-y-1.5 list-none">
              <li>・血液検査代</li>
              <li>・血液送料</li>
              <li>・医師問診費用</li>
              <li>・施術時の消耗品費</li>
              <li>・クリニックで個別に発生する費用</li>
            </ul>
          </section>

          {/* 注意事項 */}
          <section className="bg-status-warning/5 border border-status-warning/20 rounded-md p-4">
            <h2 className="text-sm text-status-warning font-medium mb-3">ご注意事項</h2>
            <ul className="text-xs text-text-secondary space-y-2 list-none">
              <li>・感染症（HIV等）やがんを罹患されている場合、iPS細胞の作製ができない場合がございます。</li>
              <li>・その他の持病に関しては、最終的な導入可否は医師問診・検査・既往歴確認によって判断されます。</li>
              <li>・本サービスは、特定の治療効果、美容上の効果、医療的効能を保証するものではございません。</li>
            </ul>
          </section>

          <div className="text-[11px] text-text-muted pt-4 border-t border-border">
            <p>株式会社SCPP</p>
          </div>
        </article>
      </div>
    </div>
  );
}
