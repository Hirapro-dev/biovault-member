"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import GoldDivider from "@/components/ui/GoldDivider";

export default function AgreeForm({ isAgreed, agreedAt }: { isAgreed: boolean; agreedAt: string | null }) {
  const router = useRouter();
  const { update: updateSession } = useSession();

  // 書類1: 重要事項説明書兼確認書
  const scroll1Ref = useRef<HTMLDivElement>(null);
  const [scrolled1, setScrolled1] = useState(false);
  const [checked1, setChecked1] = useState(false);

  // 書類2: 個人情報同意書
  const scroll2Ref = useRef<HTMLDivElement>(null);
  const [scrolled2, setScrolled2] = useState(false);
  const [checked2, setChecked2] = useState(false);

  const [loading, setLoading] = useState(false);

  // ページ表示時に最上部へスクロール
  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => window.scrollTo(0, 0), 100);
  }, []);

  // スクロール検知（書類1）
  useEffect(() => {
    const el = scroll1Ref.current;
    if (!el || isAgreed) return;
    const handler = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled1(true);
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, [isAgreed]);

  // スクロール検知（書類2）
  useEffect(() => {
    const el = scroll2Ref.current;
    if (!el || isAgreed) return;
    const handler = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled2(true);
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, [isAgreed]);

  const canSubmit = checked1 && checked2 && !loading;

  const handleAgree = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/member/agree-terms", { method: "POST" });
      if (res.ok) {
        await updateSession();
        window.location.href = "/mypage";
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
          <h1 className="font-serif-jp text-lg text-text-primary tracking-[2px] mb-2">重要事項説明・個人情報取扱同意</h1>
          <GoldDivider width={60} className="mx-auto mb-3" />
          <p className="text-xs text-text-secondary leading-relaxed">
            サービスのご利用にあたり、<br />以下の2つの書類をそれぞれお読みいただき、ご同意ください。
          </p>
        </div>
      )}

      {isAgreed && (
        <div className="mb-6">
          <h1 className="font-serif-jp text-lg text-text-primary tracking-[2px] mb-2">重要事項説明・個人情報取扱同意</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-status-active">✓ 同意済み</span>
            {agreedAt && <span className="text-text-muted">({new Date(agreedAt).toLocaleDateString("ja-JP")})</span>}
          </div>
        </div>
      )}

      {/* 重要事項説明書兼確認書 */}
      <div className="mb-8">
        <h2 className="text-sm text-text-primary font-medium mb-3">重要事項説明書兼確認書</h2>

        <div
          ref={scroll1Ref}
          className={`bg-bg-secondary border border-border rounded-md p-5 sm:p-7 ${isAgreed ? "" : "max-h-[50vh] overflow-y-auto"}`}
        >
          <ImportantNoticeContent />
        </div>

        {/* 書類1の同意チェック（未同意時のみ） */}
        {!isAgreed && (
          <div className="mt-3">
            {!scrolled1 && (
              <p className="text-xs text-gold text-center mb-2 animate-pulse">↓ 最後までスクロールしてください</p>
            )}
            <label className={`flex items-start gap-3 ${scrolled1 ? "cursor-pointer" : "opacity-40 pointer-events-none"}`}>
              <input
                type="checkbox"
                checked={checked1}
                onChange={(e) => setChecked1(e.target.checked)}
                disabled={!scrolled1}
                className="mt-0.5 w-5 h-5 cursor-pointer shrink-0 accent-gold"
              />
              <span className="text-[13px] text-text-primary leading-relaxed">
                重要事項説明書兼確認書の内容を確認し、同意します。
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 区切り線 */}
      <div className="border-t border-border-gold/30 my-8" />

      {/* 個人情報同意書 */}
      <div className="mb-6">
        <h2 className="text-sm text-text-primary font-medium mb-3">個人情報・個人遺伝情報等の取扱いに関する同意書</h2>

        <div
          ref={scroll2Ref}
          className={`bg-bg-secondary border border-border rounded-md p-5 sm:p-7 ${isAgreed ? "" : "max-h-[50vh] overflow-y-auto"}`}
        >
          <PrivacyConsentContent />
        </div>

        {/* 書類2の同意チェック（未同意時のみ） */}
        {!isAgreed && (
          <div className="mt-3">
            {!scrolled2 && (
              <p className="text-xs text-gold text-center mb-2 animate-pulse">↓ 最後までスクロールしてください</p>
            )}
            <label className={`flex items-start gap-3 ${scrolled2 ? "cursor-pointer" : "opacity-40 pointer-events-none"}`}>
              <input
                type="checkbox"
                checked={checked2}
                onChange={(e) => setChecked2(e.target.checked)}
                disabled={!scrolled2}
                className="mt-0.5 w-5 h-5 cursor-pointer shrink-0 accent-gold"
              />
              <span className="text-[13px] text-text-primary leading-relaxed">
                個人情報・個人遺伝情報等の取扱いに関する同意書の内容を確認し、同意します。
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 同意ボタン（未同意時のみ） */}
      {!isAgreed && (
        <button
          onClick={handleAgree}
          disabled={!canSubmit}
          className="w-full py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30"
        >
          {loading ? "処理中..." : "同意する"}
        </button>
      )}
    </div>
  );
}

// ── 重要事項説明書の本文 ──
function ImportantNoticeContent() {
  return (
    <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-6">
      <p>株式会社SCPP（以下「当社」という。）は、BioVaultメンバーシップサービス（以下「本サービス」という。）の申込みに先立ち、申込者に対し、以下の重要事項を説明します。</p>
      <p>申込者は、本書の内容を十分に確認し、理解したうえで、本サービスの申込みおよび契約締結を行うものとします。</p>

      <S t="第1条（本書の目的）">
        <p>本書は、BioVaultiPSサービス利用契約書、BioVaultメンバーシップ規約その他関連文書に先立ち、申込者が本サービスの内容、性質、提供条件、費用、制約、個人情報の取扱いその他重要事項を正しく理解するために交付されるものです。</p>
      </S>
      <S t="第2条（本サービスの位置付け）">
        <p>本サービスは、登録者本人に由来する血液その他検体に関し、提携医療機関、提携加工施設、提携保管施設その他提携先における細胞の作製、加工、保管その他関連手続について、当社から案内、申込管理、日程調整、情報提供および運営上の連携を受けるメンバーシップ制サービスです。</p>
        <p>当社は、本サービスの運営主体であり、メンバーシップ登録者に対し、医療行為を直接提供するものではありません。</p>
        <p>診察、問診、採血、医学的判断、施術その他の医療行為は、提携医療機関またはその所属医師等が、その責任において行います。</p>
        <p>細胞の加工、保管、受入可否、品質評価その他技術的判断は、提携加工施設、提携保管施設その他提携先が、その責任において行います。</p>
        <p>本サービスは、特定の医療行為、特定の治療機会、特定の検査結果または特定の効果を当然に確保または保証するものではありません。</p>
      </S>
      <S t="第3条（CellAssetの内容）">
        <p>本サービスの中核であるCellAssetは、メンバーシップ本人に由来する細胞に関して、提携先における作製、加工、保管その他関連手続きの実施に向けた案内、申込管理、日程調整、情報提供および運営上の連携サービスです。</p>
      </S>
      <S t="第4条（メンバーシップ限定サービス）">
        <p>当社は、登録メンバーシップに対して、iPS info、iPSコンシェルジュ、イベント、優待、紹介その他のメンバーシップ限定サービスを案内または提供することがあります。</p>
      </S>
      <S t="第5条（本サービスが医療契約そのものではないこと）">
        <p>本サービスに関するメンバーシップ契約は、メンバーシップ制サービスの利用契約であり、医療行為そのものの直接提供契約ではありません。</p>
      </S>
      <S t="第6条（導入可否・利用可否について）">
        <p>本サービスの申込みまたはメンバーシップ契約の締結により、採血、細胞作製、細胞加工、細胞保管、施術その他個別サービスの実施が当然に確定するものではありません。</p>
      </S>
      <S t="第7条（申告義務）">
        <p>申込者は、本サービスに関連して求められる健康状態、既往歴、服薬状況、妊娠可能性、感染症、アレルギーその他重要事項について、真実かつ正確に申告するものとします。</p>
      </S>
      <S t="第8条（効果保証がないこと）">
        <p>本サービスおよび本サービスに関連して案内または調整される各種サービスについては、個人差があり、特定の美容上、健康上、医療上またはその他の結果、効果、効能を保証するものではありません。</p>
      </S>
      <S t="第9条（費用）">
        <p>本サービスのメンバーシップ価格は、別途iPSサービス利用契約書または申込確認書に定める金額とします。</p>
      </S>
      <S t="第10条（契約後の取消し、解約、返金および精算）">
        <p>本サービスは高額かつ段階的に実費が発生するため、申込後または契約締結後に解除、解約または返金を希望する場合であっても、常に全額返金となるものではありません。</p>
      </S>
      <S t="第11条（広告・説明資料と契約条件）">
        <p>当社の広告、ウェブサイト、パンフレット、説明資料、営業時の口頭説明その他の案内資料は、本サービスの一般的説明のために作成されるものであり、個別の契約条件または実施可否を確定するものではありません。</p>
      </S>
      <S t="第12条（個人情報、要配慮個人情報および個人遺伝情報の取扱い）">
        <p>当社は、申込者またはメンバーシップ登録者の氏名、住所、生年月日、連絡先、本人確認情報のほか、要配慮個人情報、検査結果、問診情報、細胞に関する情報、個人遺伝情報その他本サービスに関連して取得する情報を、法令および関連文書に従って取り扱います。</p>
        <p>詳細は、別紙「個人情報・個人遺伝情報等の取扱いに関する同意書」に定めます。</p>
      </S>
      <S t="第13条（死亡時および非承継）">
        <p>メンバーシップ資格は一身専属のものであり、相続、承継または名義変更の対象とはなりません。</p>
      </S>
      <S t="第14条（メンバーシップ限定サービスの変更）">
        <p>当社は、法令改正、提携条件の変更、運営上の必要その他合理的理由がある場合、メンバーシップ限定サービスの内容を変更、追加、停止または終了することがあります。</p>
      </S>
      <S t="第15条（確認事項）">
        <p>申込者は、次の各号の事項を確認し、了承したうえで、本サービスの申込みまたは契約締結を行います。</p>
        <ul className="list-none space-y-1.5 pl-2">
          <li>(1) 本サービスは、医療行為そのものの直接提供契約ではないこと</li>
          <li>(2) 診察、採血、施術その他の医療行為は、提携医療機関等が自己の責任において行うこと</li>
          <li>(3) 細胞加工、細胞保管、品質評価その他技術的判断は、提携先の責任において行うこと</li>
          <li>(4) 本サービスの全部または一部について、導入可否、受入可否または利用制限の判断が介在すること</li>
          <li>(5) 本サービスおよび関連サービスについて、特定の結果、効果、効能または将来の治療機会が保証されないこと</li>
          <li>(6) 培養上清液の追加購入やその他のサービス利用時に別途費用が生じること</li>
          <li>(7) 解約または返金は進行段階および既発生費用等に応じて精算されること</li>
          <li>(8) 個人情報、要配慮個人情報および個人遺伝情報が、本サービス提供上必要な範囲で取得、利用および第三者提供される場合があること</li>
          <li>(9) 本書のほか、会員契約書、会員規約、申込確認書、個人情報・個人遺伝情報等の取扱いに関する同意書、細胞提供・保管同意書その他関連文書が適用されること</li>
        </ul>
      </S>
    </article>
  );
}

// ── 個人情報同意書の本文 ──
function PrivacyConsentContent() {
  return (
    <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-6">
      <p>株式会社SCPP（以下「甲」という。）は、BioVaultメンバーシップサービス（以下「本サービス」という。）の提供にあたり、メンバーシップ登録者（以下「乙」という。）の個人情報、要配慮個人情報、個人遺伝情報その他本サービスに関連して取得する情報を、以下のとおり取り扱います。</p>
      <p>乙は、本書の内容を確認し、理解したうえで、必要な範囲について同意するものとします。</p>

      <S t="第1条（目的）">
        <p>本同意書は、甲が本サービスの提供に関連して取得、利用、保管および第三者提供を行う乙の個人情報、要配慮個人情報、個人遺伝情報その他関連情報の取扱い条件を定めることを目的とします。</p>
      </S>
      <S t="第2条（定義）">
        <p>「個人情報」とは、個人情報の保護に関する法律に定める個人情報をいいます。</p>
        <p>「要配慮個人情報」とは、病歴、診療・検査に関する情報その他法令上これに該当する情報をいいます。</p>
        <p>「個人遺伝情報」とは、個人の遺伝的特徴またはこれに関連する情報であって、本サービスに関連して取得されるものをいいます。</p>
      </S>
      <S t="第3条（取得する情報）">
        <p>甲は、本サービスの提供に必要な範囲で、次の各号の情報を取得することがあります。</p>
        <ul className="list-none space-y-1 pl-2">
          <li>(1) 氏名、住所、生年月日、電話番号、電子メールアドレスその他本人確認に必要な情報</li>
          <li>(2) 申込内容、契約内容、支払方法、決済履歴その他契約管理に必要な情報</li>
          <li>(3) 既往歴、服薬状況、アレルギー情報、問診内容、検査結果その他要配慮個人情報</li>
          <li>(4) 細胞、検体、検体管理番号、細胞管理番号、保管状況、加工履歴その他細胞関連管理情報</li>
          <li>(5) 個人遺伝情報その他本サービスの提供上必要となる遺伝関連情報</li>
          <li>(6) その他、関連文書において明示された範囲で、本サービス提供上必要な情報</li>
        </ul>
      </S>
      <S t="第4条（取得および利用の基本原則）">
        <p>甲は、乙の個人情報等を、利用目的をできる限り特定したうえで、適法かつ公正な手段により取得し、利用します。</p>
      </S>
      <S t="第5条（必須利用目的）">
        <p>乙は、甲が次の目的のために、乙の個人情報等を取得、利用および保管することに同意します。</p>
        <ul className="list-none space-y-1 pl-2">
          <li>(1) 本サービスの申込み受付、審査、本人確認および契約管理のため</li>
          <li>(2) iPSサービス利用契約書、メンバーシップ規約、重要事項説明書その他関連文書に基づく本サービスの運営のため</li>
          <li>(3) 提携医療機関、検査機関、加工施設、保管施設その他提携先との連携、日程管理、申込管理および事務処理のため</li>
          <li>(4) 料金請求、決済処理、返金処理、会計処理その他金銭管理のため</li>
          <li>(5) 事故、苦情、問い合わせ、トラブル、本人確認上の照会その他必要な対応のため</li>
          <li>(6) 法令対応、行政対応、監査対応、記録保存その他法令上または事業運営上必要な対応のため</li>
        </ul>
      </S>
      <S t="第6条（第三者提供）">
        <p>乙は、甲が前条の利用目的達成に必要な範囲で、次の各号の第三者に対し、必要最小限度の個人情報等を提供することに同意します。</p>
        <ul className="list-none space-y-1 pl-2">
          <li>(1) 提携医療機関またはその所属医師等</li>
          <li>(2) 提携検査機関</li>
          <li>(3) 提携加工施設または製造委託先</li>
          <li>(4) 提携保管施設または保管委託先</li>
          <li>(5) 配送事業者または輸送委託先</li>
          <li>(6) 決済関連事業者または金融機関</li>
          <li>(7) 法令上提出または開示が必要となる行政機関、裁判所その他公的機関</li>
        </ul>
      </S>
      <S t="第7条（共同利用）">
        <p>甲は、乙の個人情報等について、現時点では共同利用を予定していません。</p>
      </S>
      <S t="第8条（保存期間）">
        <p>甲は、乙の個人情報等を、法令上必要な期間、契約管理上必要な期間および本サービス運営上合理的に必要な期間保存します。</p>
      </S>
      <S t="第9条（安全管理措置）">
        <p>甲は、乙の個人情報等の漏えい、滅失、毀損、改ざん、不正アクセスその他の事故を防止するため、組織的、人的、物理的および技術的安全管理措置を講じます。</p>
      </S>
      <S t="第10条（開示、訂正、利用停止等）">
        <p>乙は、甲に対し、法令に基づき、自己に関する個人情報等の開示、訂正、追加、削除、利用停止、第三者提供停止その他の請求を行うことができます。</p>
      </S>
      <S t="第11条（不同意または同意撤回の取扱い）">
        <p>本同意書のうち、第5条および第6条に定める本サービス提供上必須の範囲について乙の同意が得られない場合、甲は、本サービスの全部または一部を提供できないことがあります。</p>
      </S>
    </article>
  );
}

// セクション見出しコンポーネント
function S({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm text-text-primary font-medium mb-2">{t}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
