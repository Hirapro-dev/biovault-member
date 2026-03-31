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
        <article className="text-[13px] text-text-secondary leading-[2] space-y-8">

          {/* 事業者情報 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">事業者情報</h2>
            <div className="space-y-0">
              <LegalRow label="販売事業者名" value="株式会社SCPP" />
              <LegalRow label="運営責任者" value="代表取締役" />
              <LegalRow label="所在地" value="〒107-6012 東京都港区赤坂1-12-32 アークヒルズ 森ビル12F" />
              <LegalRow label="電話番号" value="0120-788-839" />
              <LegalRow label="メールアドレス" value="info@biovault.jp" />
            </div>
          </section>

          {/* 役務の名称・内容 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">役務の名称・内容</h2>
            <div className="space-y-0">
              <LegalRow label="役務の名称" value="BioVaultメンバーシップサービス" />
              <LegalRow label="役務の内容" value="本サービスは、会員本人に由来する血液その他の試料に関し、提携医療機関、提携加工施設、提携保管施設その他提携先における自家iPS細胞の作製、加工、保管その他関連手続について、案内、申込管理、日程調整、情報提供および運営上の連携を受けることができるサービスです。" />
            </div>
            <div className="mt-3 text-xs text-text-muted space-y-1.5">
              <p>株式会社SCPPは本サービスの運営主体であり、診察、問診、採血、医学的判断、施術その他の医療行為を直接提供するものではありません。これらは提携医療機関またはその所属医師等が行います。</p>
              <p>また、細胞の作製、培養、品質評価、保管その他の技術的工程は提携先が行います。</p>
            </div>
          </section>

          {/* 販売価格・費用 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">販売価格・費用</h2>
            <div className="space-y-0">
              <LegalRow label="会員価格" value="8,800,000円（税込）" />
              <LegalRow label="お支払い方法" value="銀行振込（当社指定口座）" />
              <LegalRow label="お支払い時期" value="会員契約締結後、当社が別途指定する期日まで" />
              <LegalRow label="振込手数料" value="申込者負担" />
            </div>
            <div className="mt-4">
              <h3 className="text-xs text-text-primary font-medium mb-2">商品代金以外の必要料金</h3>
              <ul className="text-xs text-text-muted space-y-1.5 list-none">
                <li>・銀行振込手数料</li>
                <li>・提携医療機関への来院交通費、宿泊費その他移動費用</li>
                <li>・血液検査費、医師問診費、施術関連費、消耗品費その他提携医療機関で個別に発生する費用</li>
                <li>・検体輸送費、保管更新費、追加オプション費用その他提携先で個別に発生する費用</li>
                <li>・お客様の希望または個別事情に応じて追加される費用</li>
              </ul>
            </div>
          </section>

          {/* 役務の提供時期 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">役務の提供時期</h2>
            <div className="text-xs text-text-muted space-y-2">
              <p>契約締結および所定の手続き完了後、順次提供を開始します。</p>
              <p>ただし、採血、細胞作製、細胞加工、細胞保管、施術その他個別サービスの実施時期は、提携医療機関または提携先との調整、問診、診察、検査結果、健康状態、試料状態、技術的条件その他の事情により変動します。</p>
              <p>申込みまたは契約締結のみをもって、採血、細胞作製、保管その他の実施が当然に確定するものではありません。</p>
              <p>また、採血後であっても、問診、診察、検査結果、健康状態、試料状態、技術的条件その他の事情により、細胞作製が不能または困難となる場合があります。</p>
            </div>
          </section>

          {/* 申込みの成立時期 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">申込みの成立時期</h2>
            <div className="text-xs text-text-muted space-y-2">
              <p>当社が申込み内容を確認し、所定の承諾手続きを完了した時点で成立します。</p>
              <p>ただし、会員資格の成立は、採血、細胞作製、細胞保管その他個別サービスの実施確定を意味するものではありません。</p>
            </div>
          </section>

          {/* 申込みの撤回・契約の解除 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">申込みの撤回・契約の解除に関する事項</h2>
            <div className="text-xs text-text-muted space-y-3">
              <div>
                <h3 className="text-text-primary font-medium mb-1">【通信販売の場合】</h3>
                <p>通信販売には、電話勧誘販売や訪問販売のような法定クーリング・オフ制度は通常ありません。返品・解約の可否や条件は、事業者が表示した特約に従うことになります。</p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-1">【訪問販売・電話勧誘販売の場合】</h3>
                <p>本契約が特定商取引法上の訪問販売または電話勧誘販売に該当する場合、お客様は、この書面を受領した日を含めて8日以内であれば、書面または電磁的記録により、契約の申込みの撤回または契約の解除をすることができます。</p>
                <p>クーリング・オフが行われた場合、当社は、原則として損害賠償または違約金の請求を行いません。既に受領した金員がある場合には、速やかに返還します。</p>
                <p>なお、法定書面の不交付または重要事項の記載不備がある場合、クーリング・オフ期間の起算に影響する可能性があります。</p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-1">【クーリング・オフ期間経過後の解約・解除】</h3>
                <p>クーリング・オフ期間経過後の解約または解除については、会員契約書、重要事項説明書兼確認書および申込確認書に定める返金・精算条件に従います。</p>
                <p>返金または精算の有無およびその範囲は、解除申出時点における進行段階、既発生費用、既提供済みサービス、提携先に対する支払確定額その他の事情を踏まえて定められます。</p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-1">【中途解約・返金の一般的な考え方】</h3>
                <ul className="space-y-1 list-none">
                  <li>・採血予約前</li>
                  <li>・採血予約後かつ採血前</li>
                  <li>・採血後かつ加工着手前</li>
                  <li>・加工着手後</li>
                  <li>・保管開始後</li>
                </ul>
                <p className="mt-1">上記の各段階に応じて、控除対象費目、既発生費用、未実施部分の範囲が異なります。詳細は契約書類をご確認ください。</p>
              </div>
            </div>
          </section>

          {/* 個人情報の取扱い */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">個人情報の取扱い</h2>
            <p className="text-xs text-text-muted">本サービスの提供にあたり、個人情報、要配慮個人情報、個人遺伝情報、検査結果、試料識別情報その他必要な情報が取得、利用、保管および提携先へ提供される場合があります。詳細は、別紙「個人情報・個人遺伝情報等の取扱いに関する同意書」に定めます。</p>
          </section>

          {/* 不良品・役務の不適合 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">不良品・役務の不適合について</h2>
            <p className="text-xs text-text-muted">本サービスはメンバーシップサービスであり、採血、細胞作製、保管その他の実施可否については、提携医療機関または提携先による判断が介在します。株式会社SCPPは、本サービスに関連して、会員契約書その他適用文書に定める範囲で責任を負います。</p>
          </section>

          {/* 表現および役務提供に関する重要事項 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">表現および役務提供に関する重要事項</h2>
            <ul className="text-xs text-text-muted space-y-1.5 list-none">
              <li>・株式会社SCPPは医療行為の実施主体ではありません。</li>
              <li>・診察、採血、医学的判断等は提携医療機関等が行います。</li>
              <li>・細胞作製、培養、品質評価、保管等は提携先が行います。</li>
              <li>・会員資格および本サービス利用上の地位は、第三者へ譲渡することはできません。</li>
              <li>・自家iPS細胞の作製は、申込みや契約締結のみをもって当然に成功または確定するものではありません。</li>
              <li>・採血後であっても、問診、診察、検査結果、健康状態、試料状態、技術的条件等により、細胞作製が不能または困難となる場合があります。</li>
              <li>・特定の治療効果、美容上の効果、研究成果、経済的利益または資産的価値は保証されません。</li>
              <li>・将来の再生医療や関連サービスを当然に受けられることは保証されません。</li>
            </ul>
          </section>

          {/* 適用文書 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">適用文書</h2>
            <p className="text-xs text-text-muted mb-2">本サービスには、次の文書が一体として適用されます。</p>
            <ul className="text-xs text-text-muted space-y-1 list-none">
              <li>・BioVault会員契約書</li>
              <li>・BioVault会員規約</li>
              <li>・重要事項説明書兼確認書</li>
              <li>・申込確認書</li>
              <li>・個人情報・個人遺伝情報等の取扱いに関する同意書</li>
              <li>・細胞提供・保管同意書</li>
              <li>・自家iPS細胞作製に関する説明書兼同意書</li>
              <li>・その他関連文書</li>
            </ul>
          </section>

          {/* クーリング・オフ通知先 */}
          <section>
            <h2 className="text-sm text-text-primary font-medium mb-4">クーリング・オフ通知先</h2>
            <div className="space-y-0">
              <LegalRow label="事業者名" value="株式会社SCPP" />
              <LegalRow label="所在地" value="〒107-6012 東京都港区赤坂1-12-32 アークヒルズ 森ビル12F" />
              <LegalRow label="メールアドレス" value="info@biovault.jp" />
            </div>
          </section>

          <div className="text-[11px] text-text-muted pt-4 border-t border-border">
            <p>制定日：2025年4月1日</p>
            <p>株式会社SCPP</p>
          </div>
        </article>
      </div>
    </div>
  );
}

function LegalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row py-3 border-b border-border last:border-b-0">
      <div className="w-full sm:w-40 text-[11px] text-text-muted mb-1 sm:mb-0 shrink-0">{label}</div>
      <div className="text-[13px] text-text-secondary leading-relaxed">{value}</div>
    </div>
  );
}
