"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import GoldDivider from "@/components/ui/GoldDivider";

export default function AgencyAgreeForm() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAgree = async () => {
    setLoading(true);
    try {
      // 3文書を一括同意
      await fetch("/api/agency/agree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: "all" }),
      });
      await updateSession();
      router.push("/agency");
      router.refresh();
    } catch {} finally { setLoading(false); }
  };

  return (
    <div>
      <div className="text-center mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BioVault" className="h-7 w-auto mx-auto mb-4" />
        <h1 className="font-serif-jp text-lg text-text-primary tracking-[2px] mb-2">代理店契約</h1>
        <GoldDivider width={60} className="mx-auto mb-3" />
        <p className="text-xs text-text-secondary">以下の契約内容をお読みいただき、ご同意ください。</p>
      </div>

      <div ref={scrollRef} className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7 max-h-[60vh] overflow-y-auto mb-4">
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-6">

          {/* ── Part 1: 代理店契約書 ── */}
          <div className="text-center mb-4">
            <h2 className="text-base text-text-primary font-medium">BioVault代理店契約書</h2>
          </div>
          <p>株式会社SCPP（以下「甲」という。）と代理店（以下「乙」という。）は、甲が提供するBioVaultメンバーシップサービスに関する販売協力業務について、以下のとおり代理店契約を締結する。</p>

          <S t="第1条（目的）"><p>甲は乙に対し、甲が提供するBioVaultメンバーシップサービスその他甲が別途指定するサービス（以下「本サービス」という。）に関する販売協力業務を委託し、乙はこれを受託する。</p></S>
          <S t="第2条（契約期間）"><p>本契約の有効期間は1年間とする。期間満了日の30日前までに甲乙いずれからも書面または電磁的方法による更新拒絶の意思表示がないときは、本契約は同一条件でさらに1年間更新されるものとし、以後も同様とする。</p></S>
          <S t="第3条（業務内容）">
            <p>乙の業務は、次の各号に限られる。</p>
            <ul className="list-none space-y-1 pl-2">
              <li>(1) 本サービスの見込顧客の発掘</li>
              <li>(2) 本サービスの概要説明</li>
              <li>(3) 面談設定、提案、クロージング</li>
              <li>(4) 顧客からの申込み取得支援</li>
              <li>(5) 甲への必要情報の連携</li>
            </ul>
            <p>乙は、甲の事前の書面承諾なく、価格変更、返金保証、医学的説明、法的判断を伴う説明その他甲が明示的に許諾していない約束をしてはならない。</p>
          </S>
          <S t="第4条（非独占・一時代理店）"><p>本契約は非独占契約とし、乙は甲の一時代理店としてのみ本件業務を行う。乙は、自らが発掘または接触した見込顧客に対し、第三者を再代理店、下位代理店、二次代理店、組織員、傘下メンバーその他これらに類する立場として関与させてはならない。</p></S>
          <S t="第5条（顧客との直接契約）"><p>本サービスに関する最終的な契約締結は、甲と顧客との間で直接行うものとする。乙は、甲の事前承諾なく、顧客から金員を受領してはならない。</p></S>
          <S t="第6条（成果報酬）"><p>甲は乙に対し、本件業務の対価として成果報酬を支払う。成果報酬は入金ベースで発生するものとし、契約成立のみでは発生しない。成果報酬の支払時期は、甲が顧客から対象売上の入金を受けた日が属する月の末日締め、翌月末日払いとする。</p></S>
          <S t="第7条〜第17条"><p>成果認定（第7条）、追加購入の帰属（第8条）、報酬の不発生・返還（第9条）、医療法・薬機法等の遵守（第10条）、使用資料および発信制限（第11条）、禁止行為（第12条）、損害賠償（第13条）、反社会的勢力の排除（第14条）、契約解除（第15条）、存続条項（第16条）、準拠法・管轄（第17条）については、各条項に従うものとする。</p></S>

          {/* ── 区切り ── */}
          <div className="border-t border-border my-8" />

          {/* ── Part 2: 遵守誓約書 ── */}
          <div className="text-center mb-4">
            <h2 className="text-base text-text-primary font-medium">遵守誓約書</h2>
          </div>
          <p>私は、甲が提供するBioVaultメンバーシップサービスその他甲が指定する関連サービスに関する販売協力業務を行うにあたり、以下の事項を確認し、これを遵守することを誓約します。</p>
          <S t="基本認識"><p>私は、BioVaultメンバーシップサービスが、医療行為そのものの直接提供契約ではなく、会員制サービスであることを理解しています。株式会社SCPPが本サービスの運営主体であり、診察、問診、採血、医学的判断、施術その他の医療行為を直接行うものではないことを理解しています。</p></S>
          <S t="連鎖販売・ネットワーク型勧誘の禁止"><p>私は、本サービスの販売協力が、一時代理店による販売協力であり、連鎖販売取引、マルチ商法、ネットワークビジネスその他これらに類する仕組みではないことを理解しています。自らの下に第三者を再代理店、下位代理店、二次代理店、組織員、傘下メンバーその他これらに類する立場として関与させません。</p></S>
          <S t="法令遵守"><p>私は、営業活動にあたり、特定商取引法、景品表示法、個人情報保護法、医療法、医薬品医療機器等法その他関連法令および甲の販売ルールを遵守します。</p></S>
          <S t="表現規制の遵守"><p>私は、本サービスについて、特定の治療効果、美容効果、若返り効果、疾病予防効果、安全性、有効性、研究成果、経済的利益または資産的価値を保証し、断定し、またはそれに類する表現を用いません。</p></S>
          <S t="営業資料の使用"><p>私は、甲が作成し、承認した営業資料、トークスクリプト、FAQその他の資料のみを使用します。甲の事前の書面承諾なく、独自の営業資料、動画、音声、バナー、LP、フォーム、投稿文面その他の営業コンテンツを作成または使用しません。</p></S>
          <S t="禁止行為">
            <ul className="list-none space-y-1">
              <li>・法令、公序良俗または甲の販売ルールに違反する行為</li>
              <li>・甲未承認の説明資料、動画、音声、SNS投稿、広告物、LP、フォーム等を作成または使用する行為</li>
              <li>・医療法、薬機法、景表法、特商法に抵触し得る表示、勧誘または説明を行う行為</li>
              <li>・顧客に対し、将来の治療機会、資産価値、効果効能、再生医療利用等を保証する行為</li>
              <li>・連鎖販売取引、マルチ商法、ネットワークビジネスその他これらに類する勧誘を行う行為</li>
              <li>・第三者を下位代理店、再代理店、販売員その他これらに類する地位で関与させる行為</li>
              <li>・顧客からの金員を自己または第三者名義で受領、保管または流用する行為</li>
            </ul>
          </S>

          {/* ── 区切り ── */}
          <div className="border-t border-border my-8" />

          {/* ── Part 3: NDA ── */}
          <div className="text-center mb-4">
            <h2 className="text-base text-text-primary font-medium">秘密保持契約書（NDA）</h2>
          </div>
          <p>株式会社SCPP（以下「甲」という。）と代理店（以下「乙」という。）は、甲が提供するBioVaultメンバーシップサービスその他関連事業に関し、乙が販売協力業務その他甲が認める業務を遂行するにあたり、相互に開示または知得する秘密情報の取扱いについて、以下のとおり秘密保持契約を締結する。</p>
          <S t="秘密情報の定義">
            <p>秘密情報には、次の各号を含む。</p>
            <ul className="list-none space-y-1 pl-2">
              <li>(1) BioVaultメンバーシップサービスに関する事業内容、商品設計、会員条件、価格、報酬条件、販売条件、営業手法、営業資料、FAQ、台本、ノウハウ、運営ルールその他一切の営業上の情報</li>
              <li>(2) 顧客、見込顧客、紹介者、提携先、取引先、医療機関、加工施設、保管施設、研究機関その他関係者に関する情報</li>
              <li>(3) 顧客情報、見込顧客情報、申込情報、契約情報、決済情報、問い合わせ履歴その他個人または法人に関する情報</li>
              <li>(4) 提携先との関係、契約条件、交渉経緯、未公表案件、未公表資料、未公開スキーム、事業計画、資金計画、販売計画その他経営上の情報</li>
              <li>(5) アイロムグループ、株式会社ICEその他甲の提携先に関する未公表情報、非公開情報または甲が管理する関連情報</li>
            </ul>
          </S>
          <S t="秘密保持義務"><p>乙は、秘密情報を厳に秘密として保持し、甲の事前の書面承諾なく、第三者に開示、漏えいまたは提供してはならない。乙は、秘密情報を、本目的の範囲内でのみ使用し、本目的外に使用してはならない。</p></S>
          <S t="再開示の制限"><p>乙は、甲の事前の書面承諾なく、秘密情報を自己以外の第三者に再開示してはならない。</p></S>
          <S t="個人情報等の特則"><p>乙は、顧客情報、見込顧客情報その他個人情報、要配慮個人情報、個人遺伝情報その他センシティブな情報について、秘密情報の中でも特に厳格に取り扱う。</p></S>
          <S t="生成AI等への投入禁止"><p>乙は、甲の事前の書面承諾なく、秘密情報を生成AI、外部AIサービス、要約サービス、翻訳サービス、文字起こしサービス、分析サービスその他第三者提供型システムに入力、送信、アップロードまたは処理させてはならない。</p></S>
          <S t="存続"><p>乙の秘密保持義務は、本契約終了後10年間存続する。個人情報、要配慮個人情報、個人遺伝情報その他センシティブな情報に関する義務は、本契約終了後も、当該情報が甲または第三者の保護対象である限り存続する。</p></S>
        </article>
      </div>

      {!scrolled && <p className="text-xs text-text-muted text-center mb-3 animate-pulse">↓ 最後までスクロールしてください</p>}

      <label className={`flex items-start gap-3 mb-4 ${scrolled ? "cursor-pointer" : "opacity-40 pointer-events-none"}`}>
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} disabled={!scrolled} className="mt-0.5 w-5 h-5 cursor-pointer shrink-0 accent-gold" />
        <span className="text-sm text-text-primary leading-relaxed">
          上記の代理店契約書、遵守誓約書、および秘密保持契約書（NDA）の内容を確認し、全てに同意します。
        </span>
      </label>

      <button onClick={handleAgree} disabled={!checked || loading}
        className="w-full py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30">
        {loading ? "処理中..." : "同意する"}
      </button>
    </div>
  );
}

function S({ t, children }: { t: string; children: React.ReactNode }) {
  return <section><h3 className="text-xs text-text-primary font-medium mb-1">{t}</h3><div className="space-y-1.5">{children}</div></section>;
}
