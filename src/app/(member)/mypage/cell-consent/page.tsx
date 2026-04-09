"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CellConsentPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const [deathWish, setDeathWish] = useState<"donate" | "dispose" | "">("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // ステップ2: キャンセル不可確認
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelChecked, setCancelChecked] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolledToBottom(true);
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // 同意書の同意ボタン → キャンセル不可確認画面へ
  const handleFirstAgree = () => {
    setShowCancelConfirm(true);
    window.scrollTo(0, 0);
  };

  // 最終同意 → API送信
  const handleFinalAgree = async () => {
    setLoading(true);
    try {
      // 1. 細胞提供・保管同意書に同意
      const res = await fetch("/api/member/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: "CELL_STORAGE_CONSENT", deathWish }),
      });
      if (!res.ok) return;

      // 2. 日程調整申請を自動送信
      await fetch("/api/member/schedule-request", { method: "POST" });

      setDone(true);
    } catch {
      // エラー
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-[700px] mx-auto text-center py-12">
        <div className="text-5xl mb-6">✓</div>
        <h2 className="font-serif-jp text-xl text-gold tracking-wider mb-4">同意が完了しました</h2>
        <div className="text-sm text-text-secondary leading-relaxed space-y-3 mb-8">
          <p>細胞提供・保管同意書へのご同意ありがとうございます。</p>
          <p>
            日程調整のご連絡を担当より<br />
            <span className="text-gold font-medium">3営業日以内</span>に行わせていただきます。
          </p>
        </div>
        <Link href="/mypage" className="inline-block px-8 py-3 bg-gold-gradient text-bg-primary text-sm font-medium rounded tracking-wider hover:opacity-90 transition-opacity">
          マイページに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/mypage" className="hover:text-gold transition-colors">マイページ</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">細胞提供・保管同意書</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-2">
        BioVault細胞提供・保管同意書
      </h2>
      <p className="text-xs text-text-muted mb-5">※ こちらの同意がないと、問診・採血に進めません</p>

      <div ref={scrollRef} className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7 max-h-[55vh] overflow-y-auto">
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-5">
          <p className="text-text-secondary/80 text-[11px]">（自家iPS細胞等の提供、保管、将来利用および死亡時取扱いに関する同意書）</p>
          <p>株式会社SCPP（以下「甲」という。）は、BioVaultが提供するiPSサービスに関連して、メンバーシップ登録者本人（以下「乙」という。）に由来する血液、細胞その他の試料ならびにこれらから作製される自家iPS細胞その他関連物および関連情報の提供、保管、管理、将来利用、死亡時取扱いその他必要事項について、以下のとおり説明します。</p>
          <p>乙は、本書の内容を確認し、理解したうえで、これに同意するものとします。</p>

          <Sec t="第1条（目的）">
            <p>本同意書は、乙本人から採取された血液、細胞その他の試料を原料として作製される自家iPS細胞その他これに関連する細胞、加工物、検査記録および関連情報等の提供、保管、管理、利用条件、廃棄、死亡時取扱いその他必要事項を定めることを目的とします。</p>
          </Sec>
          <Sec t="第2条（適用関係）">
            <p>本同意書は、iPSサービスご利用契約書、iPSサービスのご利用規約、重要事項説明書兼確認書、申込確認書、個人情報・個人遺伝情報等の取扱いに関する同意書その他関連文書と一体をなすものとします。</p>
            <p>本同意書と前項の文書の内容が抵触する場合は、細胞の提供、保管、将来利用、死亡時取扱いその他本同意書固有の事項については、本同意書の定めを優先して適用します。</p>
            <p>乙は、本同意書のほか、提携医療機関、提携加工施設、提携保管施設、研究機関その他提携先が別途提示する説明文書、同意書、申込書または確認書がある場合には、必要に応じてこれに同意するものとします。</p>
          </Sec>
          <Sec t="第3条（定義）">
            <p>本同意書において使用する用語の定義は、次の各号のとおりとします。</p>
            <p>(1)「本試料」とは、乙本人から採取された血液、体液、細胞その他の生体由来試料をいいます。</p>
            <p>(2)「本細胞等」とは、本試料を原料として作製された自家iPS細胞、原料細胞、中間生成物、培養物、凍結保存物、加工物、検査試料、品質記録、識別情報その他これらに付随する一切の物および情報をいいます。</p>
            <p>(3)「関連生成物」とは、本細胞等から派生しまたは本細胞等を利用して得られる培養上清液その他の生成物をいいます。</p>
            <p>(4)「提携先」とは、本試料または本細胞等の採取、輸送、加工、培養、保管、品質管理、検査、払出し、廃棄、研究、再生医療等提供その他関連業務に関与する医療機関、細胞培養加工施設、検査機関、研究機関、物流事業者その他の甲提携先をいいます。</p>
            <p>(5)「保管サービス」とは、甲が乙向けに提供する、本細胞等の保管、管理、記録保存、照会対応その他の関連サービスをいいます。</p>
            <p>(6)「将来利用」とは、乙本人のために、本細胞等または関連生成物を将来活用する可能性をいいます。</p>
            <p>(7)「死亡時意思表示」とは、乙が死亡した場合における本細胞等の取扱いについて、乙が生前に行う意思表示をいいます。</p>
          </Sec>
          <Sec t="第4条（本同意書の位置付け）">
            <p>本同意書は、本試料および本細胞等の提供、保管、管理、将来利用および死亡時の取扱いに関する乙本人の同意を確認するための文書です。</p>
            <p>甲は、BioVaultメンバーシップ制サービスの運営主体であり、乙に対し医療行為を直接提供するものではありません。</p>
            <p>診察、問診、採血、医学的判断、施術その他の医療行為は、提携医療機関またはその所属医師等が、その責任において行います。</p>
            <p>本試料の加工、培養、品質評価、保管、受入判定、払出し、廃棄その他の技術的実施は、提携先がその責任において行います。</p>
            <p>甲は、乙に対し、本細胞等に関する運営上の連携、記録管理、照会対応その他の関連サービスを提供します。</p>
          </Sec>
          <Sec t="第5条（本試料の提供）">
            <p>乙は、本サービスの提供に必要な範囲で、本試料を提携医療機関または提携先に提供することに同意します。</p>
            <p>本試料の採取は、提携医療機関またはその所属医師等が、別途の説明および同意に基づき行います。</p>
            <p>乙は、本試料の採取後であっても、検体状態、感染症、品質基準、技術的条件その他の事情により、本細胞等の作製、加工または保管が不能または著しく困難となる場合があることを確認します。</p>
          </Sec>
          <Sec t="第6条（本細胞等の作製および保管）">
            <p>乙は、本試料を原料として、本細胞等が提携先において作製、加工または保管される場合があることに同意します。</p>
            <p>保管サービスには、甲所定の範囲における本細胞等の受入れ、識別管理、保管状況管理、記録管理およびこれらに付随する事務対応が含まれます。</p>
            <p>本細胞等の作製、培養、品質評価、輸送、保管、払出し、廃棄その他の実作業は、提携先がその責任において行います。</p>
            <p>甲は、善良な管理者の注意をもって、乙に関する本細胞等の記録管理、照会対応および提携先との連携に努めます。</p>
          </Sec>
          <Sec t="第7条（保管の目的）">
            <p>本細胞等の保管は、乙本人の将来利用可能性に備えることを主たる目的とします。</p>
            <p>前項の将来利用は、乙本人のための利用可能性を見据えたものであり、現時点で特定の医療行為、美容行為、検査、施術、再生医療等提供その他の具体的利用を当然に確定するものではありません。</p>
            <p>甲および提携先は、本細胞等の保管が、特定の治療、美容上の効果、研究成果、経済的利益、商品化または資産的価値を保証するものでないことを明示します。</p>
          </Sec>
          <Sec t="第8条（保管期間）">
            <p>本細胞等の基本保管期間は、乙が加入するプランまたは甲所定の申込条件に定める期間とします。</p>
            <p>前項の保管期間に係る費用は、別段の定めがない限り、メンバーシップ契約書、申込確認書または甲所定の料金表に定めるところによります。</p>
            <p>保管期間満了後の更新の可否、更新費用、更新条件その他必要事項は、甲が別途定めるものとします。</p>
            <p>乙が更新手続を行わなかった場合、甲または提携先は、本同意書に従い、本細胞等の廃棄その他必要な措置を講じることができます。</p>
          </Sec>
          <Sec t="第9条（保管方法および品質）">
            <p>本細胞等は、その性質、品質、法令上の要請および提携先の運用基準等に応じて、凍結保存その他適切な方法により保管されます。</p>
            <p>乙は、生体由来試料および細胞には個体差があり、採取条件、作製条件、保存環境その他の影響を受けるため、本細胞等の品質、増殖性、分化能、利用適合性その他の性状が常に一定であるとは限らないことをあらかじめ承諾します。</p>
            <p>甲および提携先は、本細胞等の取違い、汚染、滅失または毀損の防止に向けて合理的な管理体制を整備するよう努めます。</p>
          </Sec>
          <Sec t="第10条（提携先への委託および情報共有）">
            <p>甲は、保管サービスの全部または一部を提携先に委託し、または提携先をして再委託させることができます。</p>
            <p>甲は、前項の場合、当該提携先に対し、本同意書および関連文書の趣旨に沿った秘密保持および安全管理を求めるものとします。</p>
            <p>乙は、保管サービスの提供に必要な範囲で、甲が提携先との間で、本試料、本細胞等および関連情報を共有することに同意します。</p>
          </Sec>
          <Sec t="第11条（個人情報、要配慮個人情報および個人遺伝情報）">
            <p>甲は、乙の個人情報、要配慮個人情報、個人遺伝情報、診療関連情報、検査結果、細胞識別情報、保管記録その他本試料または本細胞等に関連する情報を、保管サービスの提供、本人確認、品質管理、問い合わせ対応、費用請求、法令対応その他関連文書で定める目的のために利用します。</p>
            <p>甲は、前項の目的達成に必要な範囲で、提携先その他の委託先に対し、個人情報等または関連情報を提供し、またはその取扱いを委託することができます。</p>
            <p>前二項の詳細は、別紙「個人情報・個人遺伝情報等の取扱いに関する同意書」の定めによるものとします。</p>
            <p>甲は、法令に別段の定めがある場合を除き、乙の同意なく、本条に定める目的を超えて本試料、本細胞等または関連情報を利用しません。</p>
          </Sec>
          <Sec t="第12条（将来利用および別途同意）">
            <p>乙は、本細胞等が将来利用の可能性を見据えて保管されることを承諾します。</p>
            <p>ただし、次の各号に掲げる行為については、法令上不要な場合を除き、乙本人に対する別途の説明および同意を要するものとします。</p>
            <p>(1) 本細胞等から関連生成物を作製し、またはこれを乙本人へ提供すること</p>
            <p>(2) 本細胞等または関連生成物を用いた施術、診療、再生医療等提供その他の医療関連利用</p>
            <p>(3) 本細胞等または関連情報の研究利用または学術利用</p>
            <p>(4) 本細胞等または関連情報を第三者機関へ提供して研究利用させること</p>
            <p>(5) 本細胞等または関連情報の商品化、製品化、OEM利用その他商業的二次利用</p>
            <p>乙は、前項各号の利用について、当該時点における法令、技術水準、倫理審査、医療体制、受入機関の条件その他の事情により、実施の可否または範囲が制限される場合があることを承諾します。</p>
            <p>甲は、前二項に定める別途同意がない限り、本細胞等を本人向け保管目的を超えて利用しません。</p>
          </Sec>
          <Sec t="第13条（払出し・移送）">
            <p>乙が本細胞等の払出し、移送、利用申請その他を希望する場合には、甲所定の手続きおよび本人確認を経るものとします。</p>
            <p>本細胞等の払出しまたは移送は、法令、品質管理上の要請、提携先の受入条件、輸送可能性その他の事情により甲または提携先が相当と認めた場合に限り行うものとします。</p>
            <p>払出しまたは移送に要する費用は、乙の負担とします。ただし、甲が別途定める場合はこの限りではありません。</p>
          </Sec>
          <Sec t="第14条（変更届出）">
            <p>乙は、氏名、住所、連絡先、緊急連絡先、死亡時意思表示その他甲所定の重要事項に変更が生じた場合には、遅滞なく甲に届け出るものとします。</p>
          </Sec>
          <Sec t="第15条（同意の撤回）">
            <p>乙は、法令上撤回が制限される場合、既に不可逆的な処理が実施済みの部分、または安全管理上もしくは記録保存上保持が必要な部分を除き、将来に向かって本同意を撤回することができます。</p>
            <p>前項の場合であっても、甲または提携先は、法令上必要な記録保存、品質管理上必要な措置その他合理的必要性がある範囲で、本細胞等または関連記録を一定期間保持することができます。</p>
            <p>同意撤回に伴う保管終了、廃棄、費用の返還の有無および範囲その他必要事項は、メンバーシップ契約書、重要事項説明書または甲所定の定めによるものとします。</p>
          </Sec>
          <Sec t="第16条（保管終了および廃棄）">
            <p>甲または提携先は、次の各号のいずれかに該当する場合、本細胞等の保管を終了し、廃棄その他必要な措置を講じることができます。</p>
            <p>(1) 保管期間が満了し、更新がなされなかった場合</p>
            <p>(2) メンバーシップ資格が終了し、かつ保管継続に関する別段の合意がない場合</p>
            <p>(3) 乙が甲所定の義務に重大に違反した場合</p>
            <p>(4) 法令、行政指導、倫理上の要請その他により保管継続が困難となった場合</p>
            <p>(5) 天災地変、事故、設備故障、感染症拡大、輸送停止その他やむを得ない事由により保管継続が不能または著しく困難となった場合</p>
            <p>甲または提携先は、前項に基づき本細胞等を廃棄しようとするときは、合理的な範囲で事前に乙へ通知するよう努めます。ただし、緊急を要する場合または通知が不能な場合はこの限りではありません。</p>
            <p>本細胞等の廃棄方法は、法令、業界基準および提携先の運用基準に従うものとします。</p>
          </Sec>
          <Sec t="第17条（死亡時の取扱い）">
            <p>乙は、自身の死亡時における本細胞等の取扱いについて、あらかじめ次の各号のいずれかを選択するものとします。</p>
            <p>(1) 研究検体として研究機関へ寄贈する</p>
            <p>(2) 廃棄する</p>
            <p>乙は、前項の第一順位の選択に加え、第一順位の取扱いが実施できない場合に備えて、第二順位の希望を選択するものとします。</p>
            <p>乙が「研究検体として研究機関へ寄贈する」を選択した場合であっても、受入先の有無、研究計画、倫理審査、法令上の制約、保管状態その他の事情により、寄贈が実施できないことがあります。</p>
            <p>前項の場合、甲または提携先は、乙があらかじめ指定した第二順位の希望に従って処理することができます。第二順位の指定がない場合、または第二順位の実施もできない場合には、甲または提携先は、本細胞等を廃棄その他相当な方法により処理することができます。</p>
            <p>乙の死亡後においては、乙本人が生前に行った死亡時意思表示を優先するものとし、相続人その他第三者は、法令上当然に認められる場合を除き、本細胞等の返還、払出し、利用または処分を請求することができません。</p>
            <p>乙が死亡時意思表示を行わないまま死亡した場合、甲または提携先は、本細胞等を死亡確認後相当期間保留したうえで、廃棄その他相当と認める措置を講じることができます。</p>
            <p>甲は、乙に対し、死亡時意思表示の内容を変更する機会を相当な範囲で設けることがあります。</p>
          </Sec>
          <Sec t="第18条（非保証）">
            <p>甲および提携先は、本細胞等の保管が、乙に対し、将来の特定の医療行為、美容行為、研究成果、経済的利益または資産的価値を保証するものではないことを明示します。</p>
            <p>甲および提携先は、本細胞等の保管により、乙が将来にわたり当然に再生医療等を受けられること、または関連生成物の提供を受けられることを保証しません。</p>
            <p>本細胞等の保管は、あくまで将来利用可能性への備えであり、特定の結果を約束するものではありません。</p>
          </Sec>
          <Sec t="第19条（免責）">
            <p>甲は、その故意または重過失による場合を除き、次の各号に掲げる事由により乙に生じた損害について責任を負いません。</p>
            <p>(1) 生体由来試料の性質に起因する品質変化、利用不能または期待不一致</p>
            <p>(2) 採取条件、輸送条件、加工条件、保管条件その他外部要因に起因する影響</p>
            <p>(3) 天災地変、火災、停電、感染症、法令改正、行政処分、物流停止その他甲の合理的支配を超える事由</p>
            <p>(4) 提携先の責に帰すべき事由であって、甲に故意または重過失がないもの</p>
            <p>甲が損害賠償責任を負う場合であっても、その範囲は通常かつ直接の損害に限られ、逸失利益その他の特別損害は含まれないものとします。ただし、甲に故意または重過失がある場合はこの限りではありません。</p>
            <p>本条の定めは、消費者契約法その他の強行法規に反する範囲では適用しません。</p>
          </Sec>
          <Sec t="第20条（記録保存）">
            <p>甲または提携先は、本試料または本細胞等に関する同意記録、管理記録、入出庫履歴、検査記録、問い合わせ履歴その他必要な情報を、法令または甲所定の保存期間に従い保存することができます。</p>
          </Sec>
          <Sec t="第21条（協議）">
            <p>本同意書に定めのない事項または本同意書の解釈に疑義が生じた場合には、甲および乙は、誠実に協議して解決を図るものとします。</p>
          </Sec>
        </article>
      </div>

      {!showCancelConfirm ? (
        <div className="mt-4">
          {!scrolledToBottom && (
            <p className="text-xs text-gold text-center mb-2 animate-pulse">↓ 最後までスクロールしてください</p>
          )}

          {/* 死亡時意思表示欄 */}
          <div className={`mb-5 bg-bg-secondary border border-border rounded-md p-5 ${scrolledToBottom ? "" : "opacity-40 pointer-events-none"}`}>
            <h3 className="text-sm text-text-primary font-medium mb-3">死亡時意思表示欄</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              私は、私の死亡時における本細胞等の取扱いについて、以下のとおり意思表示します。
            </p>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="deathWish"
                  value="donate"
                  checked={deathWish === "donate"}
                  onChange={() => setDeathWish("donate")}
                  disabled={!scrolledToBottom}
                  className="accent-gold w-5 h-5 shrink-0"
                />
                <span className="text-[13px] text-text-primary">研究検体として研究機関へ寄贈する</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="deathWish"
                  value="dispose"
                  checked={deathWish === "dispose"}
                  onChange={() => setDeathWish("dispose")}
                  disabled={!scrolledToBottom}
                  className="accent-gold w-5 h-5 shrink-0"
                />
                <span className="text-[13px] text-text-primary">廃棄する</span>
              </label>
            </div>
            <div className="text-[10px] text-text-muted leading-relaxed space-y-1">
              <p>※「研究検体として研究機関へ寄贈する」を選択した場合であっても、受入先の有無、研究計画、倫理審査、法令上の制約、保管状態その他の事情により、寄贈が実施できない場合があります。</p>
              <p>※ 選択した希望意志が実施できない場合、または必要な条件を満たさない場合には、廃棄その他相当な方法により処理されることがあります。</p>
            </div>
          </div>

          <label className={`flex items-start gap-3 mb-4 ${scrolledToBottom ? "cursor-pointer" : "opacity-40 pointer-events-none"}`}>
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} disabled={!scrolledToBottom} className="mt-0.5 w-5 h-5 cursor-pointer shrink-0 accent-gold" />
            <span className="text-[13px] text-text-primary leading-relaxed">
              上記の細胞提供・保管同意書の内容を確認し、同意します。
            </span>
          </label>
          <button onClick={handleFirstAgree} disabled={!checked || !deathWish} className="w-full py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30">
            次へ
          </button>
        </div>
      ) : (
        <div className="mt-6 bg-bg-secondary border border-status-warning/30 rounded-md p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚠️</span>
            <h3 className="text-sm text-status-warning font-medium">予約に関する注意事項</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-5">
            クリニックの予約を行った以降の、<span className="text-status-warning font-medium">変更・キャンセルはできかねます。</span>
          </p>
          <label className="flex items-start gap-3 mb-5 cursor-pointer">
            <input type="checkbox" checked={cancelChecked} onChange={(e) => setCancelChecked(e.target.checked)} className="mt-0.5 w-5 h-5 accent-gold cursor-pointer shrink-0" />
            <span className="text-[13px] text-text-primary leading-relaxed">
              上記の内容を理解し、同意します。
            </span>
          </label>
          <div className="flex gap-3">
            <button onClick={() => { setShowCancelConfirm(false); setCancelChecked(false); }} className="flex-1 py-3 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all">
              戻る
            </button>
            <button onClick={handleFinalAgree} disabled={!cancelChecked || loading} className="flex-1 py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30">
              {loading ? "処理中..." : "同意して日程調整を申請する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-sm text-text-primary font-medium mb-2">{t}</h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
