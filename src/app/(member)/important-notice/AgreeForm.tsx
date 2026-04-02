"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import GoldDivider from "@/components/ui/GoldDivider";

export default function AgreeForm({ isAgreed, agreedAt }: { isAgreed: boolean; agreedAt: string | null }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  // ページ表示時に最上部へスクロール（レンダリング完了後に実行）
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // iOS対策: 遅延実行
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    }, 100);
  }, []);

  // スクロール検知
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isAgreed) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setScrolledToBottom(true);
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isAgreed]);

  const handleAgree = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/member/agree-terms", { method: "POST" });
      if (res.ok) {
        // JWTトークンを更新（hasAgreedTerms: true を反映）
        await updateSession();
        // マイページトップにリダイレクト
        window.location.href = "/dashboard";
      }
    } catch {
      // エラー処理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ヘッダー */}
      {!isAgreed && (
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="BioVault" className="h-7 w-auto mx-auto mb-4" />
          <h1 className="font-serif-jp text-lg text-text-primary tracking-[2px] mb-2">重要事項説明</h1>
          <GoldDivider width={60} className="mx-auto mb-3" />
          <p className="text-xs text-text-secondary">
            サービスのご利用にあたり、以下の重要事項をお読みいただき、ご同意ください。
          </p>
        </div>
      )}

      {isAgreed && (
        <div className="mb-6">
          <h1 className="font-serif-jp text-lg text-text-primary tracking-[2px] mb-2">重要事項説明</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-status-active">✓ 同意済み</span>
            {agreedAt && <span className="text-text-muted">({new Date(agreedAt).toLocaleDateString("ja-JP")})</span>}
          </div>
        </div>
      )}

      {/* 文書コンテンツ（スクロール領域） */}
      <div
        ref={scrollRef}
        className={`bg-bg-secondary border border-border rounded-md p-5 sm:p-7 ${isAgreed ? "" : "max-h-[60vh] overflow-y-auto"}`}
      >
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-6">
          {/* Part 1: 重要事項説明書兼確認書 */}
          <div className="text-center mb-6">
            <h2 className="text-base text-text-primary font-medium">BioVault 重要事項説明書兼確認書</h2>
          </div>

          <p>株式会社SCPP（以下「当社」という。）は、BioVaultメンバーシップサービス（以下「本サービス」という。）の申込みに先立ち、申込者に対し、以下の重要事項を説明します。</p>
          <p>申込者は、本書の内容を十分に確認し、理解したうえで、本サービスの申込みおよび契約締結を行うものとします。</p>

          <Section title="第1条（本書の目的）">
            <p>本書は、BioVault会員契約書、BioVault会員規約その他関連文書に先立ち、申込者が本サービスの内容、性質、提供条件、費用、制約、個人情報の取扱いその他重要事項を正しく理解するために交付されるものです。</p>
          </Section>

          <Section title="第2条（本サービスの位置付け）">
            <p>本サービスは、会員本人に由来する血液その他検体に関し、提携医療機関、提携加工施設、提携保管施設その他提携先における細胞の作製、加工、保管その他関連手続について、当社から案内、申込管理、日程調整、情報提供および運営上の連携を受けるBioVaultメンバーシップサービスです。</p>
            <p>当社は、本サービスの運営主体であり、申込者または会員に対し、医療行為を直接提供するものではありません。</p>
            <p>診察、問診、採血、医学的判断、施術その他の医療行為は、提携医療機関またはその所属医師等が、その責任において行います。</p>
            <p>細胞の加工、保管、受入可否、品質評価その他技術的判断は、提携加工施設、提携保管施設その他提携先が、その責任において行います。</p>
            <p>本サービスは、特定の医療行為、特定の治療機会、特定の検査結果または特定の効果を当然に確保または保証するものではありません。</p>
          </Section>

          <Section title="第3条（CellAssetの内容）">
            <p>本サービスの中核であるCellAssetは、会員本人に由来する細胞に関して、提携先における作製、加工、保管その他関連手続きの実施に向けた案内、申込管理、日程調整、情報提供および運営上の連携サービスです。</p>
            <p>CellAssetの具体的内容、提供主体、提供場所、保管条件、期間その他の詳細は、会員契約書、会員規約、商品定義書、細胞提供・保管同意書その他関連文書の定めによります。</p>
          </Section>

          <Section title="第4条（会員限定サービス）">
            <p>当社は、会員に対し、iPS info、iPSコンシェルジュ、イベント、優待、紹介その他の会員限定サービスを案内または提供することがあります。</p>
            <p>会員限定サービスは、本サービスの付随的サービスであり、その具体的内容、回数、頻度、提供方法、利用条件等は変更されることがあります。</p>
          </Section>

          <Section title="第5条（本サービスが医療契約そのものではないこと）">
            <p>本サービスに関する会員契約は、BioVaultメンバーシップサービスの利用契約であり、医療行為そのものの直接提供契約ではありません。</p>
            <p>申込者または会員が、提携医療機関において診察、採血、施術その他の医療行為を受ける場合には、当該医療機関において別途説明、同意、確認または契約が必要となる場合があります。</p>
          </Section>

          <Section title="第6条（導入可否・利用可否について）">
            <p>本サービスの申込みまたは会員契約の締結により、採血、細胞作製、細胞加工、細胞保管、施術その他個別サービスの実施が当然に確定するものではありません。</p>
            <p>診察、採血、施術その他医療上の実施可否は、提携医療機関またはその所属医師等が、問診、既往歴、年齢、服薬状況、検査結果、体調その他必要事項を踏まえて判断します。</p>
          </Section>

          <Section title="第7条（効果保証がないこと）">
            <p>本サービスおよび本サービスに関連して案内または調整される各種サービスについては、個人差があり、特定の美容上、健康上、医療上またはその他の結果、効果、効能を保証するものではありません。</p>
          </Section>

          <Section title="第8条（費用）">
            <p>本サービスの会員価格は、別途会員契約書または申込確認書に定める金額とします。</p>
            <p>前項の会員価格とは別に、次の各号の費用が発生する場合があります。</p>
            <ul className="list-none space-y-1 pl-2">
              <li>(1) 提携医療機関への来院交通費、宿泊費その他移動費用</li>
              <li>(2) 血液検査費、医師問診費、施術関連費、消耗品費その他提携医療機関で個別に発生する費用</li>
              <li>(3) 検体輸送費、保管更新費、追加オプション費用その他提携先で個別に発生する費用</li>
              <li>(4) 会員の希望または個別事情に応じて追加される費用</li>
            </ul>
          </Section>

          <Section title="第9条（契約後の取消し、解約、返金および精算）">
            <p>本サービスは高額かつ段階的に実費が発生するため、申込後または契約締結後に解除、解約または返金を希望する場合であっても、常に全額返金となるものではありません。</p>
            <p>一般的な進行段階の目安は、次の各号のとおりです。</p>
            <ul className="list-none space-y-1 pl-2">
              <li>(1) 採血予約前</li>
              <li>(2) 採血予約後かつ採血前</li>
              <li>(3) 採血後かつ加工着手前</li>
              <li>(4) 加工着手後</li>
              <li>(5) 保管開始後</li>
            </ul>
          </Section>

          <Section title="第10条（広告・説明資料と契約条件）">
            <p>当社の広告、ウェブサイト、パンフレット、説明資料、営業時の口頭説明その他の案内資料は、本サービスの一般的説明のために作成されるものであり、個別の契約条件または実施可否を確定するものではありません。</p>
          </Section>

          <Section title="第11条（個人情報、要配慮個人情報および個人遺伝情報の取扱い）">
            <p>当社は、申込者または会員の氏名、住所、生年月日、連絡先、本人確認情報のほか、要配慮個人情報、検査結果、問診情報、細胞に関する情報、個人遺伝情報その他本サービスに関連して取得する情報を、法令および関連文書に従って取り扱います。</p>
            <p>詳細は、別紙「個人情報・個人遺伝情報等の取扱いに関する同意書」に定めます。</p>
          </Section>

          <Section title="第12条（死亡時および非承継）">
            <p>会員資格は一身専属のものであり、相続、承継または名義変更の対象とはなりません。</p>
          </Section>

          <Section title="第13条（会員限定サービスの変更）">
            <p>当社は、法令改正、提携条件の変更、運営上の必要その他合理的理由がある場合、会員限定サービスの内容を変更、追加、停止または終了することがあります。</p>
          </Section>

          <Section title="第14条（確認事項）">
            <p>申込者は、次の各号の事項を確認し、了承したうえで、本サービスの申込みまたは契約締結を行います。</p>
            <ul className="list-none space-y-1.5 pl-2">
              <li>(1) 本サービスは、医療行為そのものの直接提供契約ではないこと</li>
              <li>(2) 診察、採血、施術その他の医療行為は、提携医療機関等が自己の責任において行うこと</li>
              <li>(3) 細胞加工、細胞保管、品質評価その他技術的判断は、提携先の責任において行うこと</li>
              <li>(4) 本サービスの全部または一部について、導入可否、受入可否または利用制限の判断が介在すること</li>
              <li>(5) 本サービスおよび関連サービスについて、特定の結果、効果、効能または将来の治療機会が保証されないこと</li>
              <li>(6) 培養上清液の追加購入やその他のサービス利用時に別途費用が生じること</li>
              <li>(7) 解約または返金は進行段階および既発生費用等に応じて精算されること、また状況によっては返金不可となり得る場合があること</li>
              <li>(8) 個人情報、要配慮個人情報および個人遺伝情報が、本サービス提供上必要な範囲で取得、利用および第三者提供される場合があること</li>
              <li>(9) 本書のほか、会員契約書、会員規約、申込確認書、個人情報・個人遺伝情報等の取扱いに関する同意書、細胞提供・保管同意書その他関連文書が適用されること</li>
            </ul>
          </Section>

          {/* Part 2: 個人情報同意書 */}
          <div className="border-t border-border my-8" />

          <div className="text-center mb-6">
            <h2 className="text-base text-text-primary font-medium">個人情報・個人遺伝情報等の取扱いに関する同意書</h2>
          </div>

          <p>株式会社SCPP（以下「甲」という。）は、BioVaultメンバーシップサービス（以下「本サービス」という。）の提供にあたり、申込者兼会員（以下「乙」という。）の個人情報、要配慮個人情報、個人遺伝情報その他本サービスに関連して取得する情報を、以下のとおり取り扱います。</p>
          <p>乙は、本書の内容を確認し、理解したうえで、必要な範囲について同意するものとします。</p>

          <Section title="第1条（目的）">
            <p>本同意書は、甲が本サービスの提供に関連して取得、利用、保管および第三者提供を行う乙の個人情報、要配慮個人情報、個人遺伝情報その他関連情報の取扱い条件を定めることを目的とします。</p>
          </Section>

          <Section title="第2条（定義）">
            <p>「個人情報」とは、個人情報の保護に関する法律に定める個人情報をいいます。</p>
            <p>「要配慮個人情報」とは、病歴、診療・検査に関する情報その他法令上これに該当する情報をいいます。</p>
            <p>「個人遺伝情報」とは、個人の遺伝的特徴またはこれに関連する情報であって、本サービスに関連して取得されるものをいいます。</p>
          </Section>

          <Section title="第3条（取得する情報）">
            <p>甲は、本サービスの提供に必要な範囲で、次の各号の情報を取得することがあります。</p>
            <ul className="list-none space-y-1 pl-2">
              <li>(1) 氏名、住所、生年月日、電話番号、電子メールアドレス、本人確認書類情報その他本人確認に必要な情報</li>
              <li>(2) 申込内容、契約内容、支払方法、決済履歴、連絡履歴その他契約管理に必要な情報</li>
              <li>(3) 既往歴、服薬状況、アレルギー情報、問診内容、検査結果その他本サービスに関連して取り扱う要配慮個人情報</li>
              <li>(4) 細胞、検体、検体管理番号、細胞管理番号、保管状況、加工履歴その他細胞関連管理情報</li>
              <li>(5) 個人遺伝情報その他本サービスの提供上必要となる遺伝関連情報</li>
              <li>(6) その他、会員契約書、重要事項説明書、細胞提供・保管同意書その他関連文書において明示された範囲で、本サービス提供上必要な情報</li>
            </ul>
          </Section>

          <Section title="第4条（取得および利用の基本原則）">
            <p>甲は、乙の個人情報等を、利用目的をできる限り特定したうえで、適法かつ公正な手段により取得し、利用します。</p>
          </Section>

          <Section title="第5条（必須利用目的）">
            <p>乙は、甲が次の目的のために、乙の個人情報等を取得、利用および保管することに同意します。</p>
            <ul className="list-none space-y-1 pl-2">
              <li>(1) 本サービスの申込み受付、iPS細胞作製適合確認、本人確認および契約管理のため</li>
              <li>(2) 会員契約書、会員規約、重要事項説明書その他関連文書に基づく本サービスの運営のため</li>
              <li>(3) 提携医療機関、検査機関、加工施設、保管施設その他提携先との連携、日程管理、申込管理および事務処理のため</li>
              <li>(4) 料金請求、決済処理、返金処理、会計処理その他金銭管理のため</li>
              <li>(5) 事故、苦情、問い合わせ、トラブル、本人確認上の照会その他必要な対応のため</li>
              <li>(6) 法令対応、行政対応、監査対応、記録保存その他法令上または事業運営上必要な対応のため</li>
            </ul>
          </Section>

          <Section title="第6条（第三者提供）">
            <p>乙は、甲が前条の利用目的達成に必要な範囲で、必要最小限度の個人情報等を第三者に提供することに同意します。</p>
          </Section>

          <Section title="第7条（共同利用）">
            <p>甲は、乙の個人情報等について、現時点では共同利用を予定していません。</p>
            <p>将来、甲が乙の個人情報等を共同利用する必要が生じた場合には、共同利用する項目、共同利用者の範囲、利用目的および管理責任者を別途公表または通知し、必要に応じて乙の同意を取得します。</p>
          </Section>

          <Section title="第8条（保存期間）">
            <p>甲は、乙の個人情報等を、法令上必要な期間、契約管理上必要な期間および本サービス運営上合理的に必要な期間保存します。</p>
            <p>保存期間経過後または利用目的達成後、甲は、法令上保存義務がある場合を除き、乙の個人情報等を適切な方法により削除、廃棄または匿名化します。</p>
            <p>細胞、検体、細胞関連管理情報その他の保存条件については、会員契約書、細胞提供・保管同意書その他関連文書の定めを優先します。</p>
          </Section>

          <Section title="第9条（安全管理措置）">
            <p>甲は、乙の個人情報等の漏えい、滅失、毀損、改ざん、不正アクセスその他の事故を防止するため、組織的、人的、物理的および技術的安全管理措置を講じます。</p>
            <p>甲は、乙の個人情報等を取り扱う従業者および委託先に対し、必要かつ適切な監督を行います。</p>
            <p>甲は、医療関連情報および個人遺伝情報について、通常の顧客情報よりも慎重な管理に努めます。</p>
          </Section>

          <Section title="第10条（開示、訂正、利用停止等）">
            <p>乙は、甲に対し、法令に基づき、自己に関する個人情報等の開示、訂正、追加、削除、利用停止、第三者提供停止その他の請求を行うことができます。</p>
            <p>前項の請求方法、受付窓口、本人確認方法その他詳細は、甲所定の手続きに従うものとします。</p>
            <p>甲は、法令に従い、合理的期間内にこれに対応します。</p>
          </Section>

          <Section title="第11条（不同意または同意撤回の取扱い）">
            <p>本同意書のうち、第5条および第6条に定める本サービス提供上必須の範囲について乙の同意が得られない場合、甲は、本サービスの全部または一部を提供できないことがあります。</p>
            <p>乙は、法令上または契約上撤回が制限される場合を除き、任意同意部分について、甲所定の方法により将来に向かって同意を撤回することができます。</p>
            <p>前項の撤回により、撤回前に適法に行われた取得、利用または提供の効力は妨げられません。</p>
            <p>同意撤回により本サービスの全部または一部の提供継続が困難となる場合には、甲はその旨を説明します。</p>
          </Section>

          <Section title="第12条（任意同意1: サービス改善・品質管理）">
            <p>乙は、甲が、個人を直接識別できない形に加工した情報または統計化した情報を用いて、本サービスの改善、品質管理、業務運営上の分析を行うことに、任意で同意することができます。</p>
            <p>本条の同意は任意であり、これに不同意であっても、本サービスの本体提供に直ちに影響しません。</p>
          </Section>

          <Section title="第13条（任意同意2: 研究開発利用）">
            <p>乙は、甲が、個人を直接識別できない形に加工した情報または統計化した情報を用いて、細胞関連サービス、保管運営、品質管理その他に関する研究開発または検証を行うことに、任意で同意することができます。</p>
            <p>甲は、本条に基づく利用にあたり、乙を直接特定できる氏名、住所、連絡先その他の識別情報を研究利用に供しません。</p>
            <p>本条の同意は任意であり、これに不同意であっても、本サービスの本体提供に直ちに影響しません。</p>
          </Section>

          <Section title="第14条（任意同意3: 案内配信・イベント通知）">
            <p>乙は、甲が、本サービスに関連する情報、会員向け案内、イベント、提携情報、付随サービス等の案内を、電子メール、書面、電話、メッセージ配信その他相当な方法で送付または配信することに、任意で同意することができます。</p>
            <p>法令上配信停止または不同意が認められる範囲については、乙は甲所定の方法により停止を求めることができます。</p>
            <p>本条の同意は任意であり、これに不同意であっても、本サービスの本体提供に直ちに影響しません。</p>
          </Section>
        </article>
      </div>

      {/* 同意フォーム（未同意時のみ） */}
      {!isAgreed && (
        <div className="mt-6">
          {!scrolledToBottom && (
            <p className="text-xs text-text-muted text-center mb-3 animate-pulse">
              ↓ 最後までスクロールしてください
            </p>
          )}

          <label className={`flex items-start gap-3 mb-4 ${scrolledToBottom ? "cursor-pointer" : "opacity-40 pointer-events-none"}`}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-0.5 cursor-pointer shrink-0"
            />
            <span className="text-sm text-text-primary leading-relaxed">
              上記の重要事項説明書兼確認書、および個人情報・個人遺伝情報等の取扱いに関する同意書の内容を確認し、同意します。
            </span>
          </label>

          <button
            onClick={handleAgree}
            disabled={!checked || loading}
            className="w-full py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30"
          >
            {loading ? "処理中..." : "同意する"}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm text-text-primary font-medium mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
