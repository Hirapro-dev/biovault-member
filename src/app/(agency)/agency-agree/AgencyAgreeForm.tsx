"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import GoldDivider from "@/components/ui/GoldDivider";

interface AgreedState {
  hasAgreedContract: boolean;
  hasAgreedPledge: boolean;
  hasAgreedNda: boolean;
}

export default function AgencyAgreeForm({ agreed }: { agreed: AgreedState }) {
  const router = useRouter();
  const { update: updateSession } = useSession();

  // 現在のステップを同意状況から判定
  const getStep = () => {
    if (!agreed.hasAgreedContract) return 1;
    if (!agreed.hasAgreedPledge) return 2;
    if (!agreed.hasAgreedNda) return 3;
    return 4;
  };

  const [step, setStep] = useState(getStep());
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setScrolled(false);
    setChecked(false);
  }, [step]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [step]);

  const handleAgree = async (document: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/agree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document }),
      });
      if (res.ok) {
        if (step < 3) {
          setStep(step + 1);
        } else {
          await updateSession();
          router.push("/agency");
          router.refresh();
        }
      }
    } catch {} finally { setLoading(false); }
  };

  const steps = [
    { num: 1, label: "代理店契約書", doc: "contract" },
    { num: 2, label: "遵守誓約書", doc: "pledge" },
    { num: 3, label: "秘密保持契約書", doc: "nda" },
  ];

  return (
    <div>
      <div className="text-center mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BioVault" className="h-7 w-auto mx-auto mb-4" />
        <h1 className="font-serif-jp text-lg text-text-primary tracking-[2px] mb-2">代理店契約同意</h1>
        <GoldDivider width={60} className="mx-auto mb-3" />
        <p className="text-xs text-text-secondary">以下の3つの書類をお読みいただき、ご同意ください。</p>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono ${step === s.num ? "bg-gold text-bg-primary font-bold" : step > s.num ? "bg-gold/20 text-gold" : "bg-bg-elevated text-text-muted"}`}>
              {step > s.num ? "✓" : s.num}
            </div>
            {s.num < 3 && <div className={`w-6 h-[1px] ${step > s.num ? "bg-gold/30" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="text-sm text-gold text-center mb-4">{steps[step - 1]?.label}</div>

      {/* 文書コンテンツ */}
      <div ref={scrollRef} className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7 max-h-[55vh] overflow-y-auto mb-4">
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-4">
          {step === 1 && <ContractContent />}
          {step === 2 && <PledgeContent />}
          {step === 3 && <NdaContent />}
        </article>
      </div>

      {!scrolled && <p className="text-xs text-text-muted text-center mb-3 animate-pulse">↓ 最後までスクロールしてください</p>}

      <label className={`flex items-start gap-3 mb-4 ${scrolled ? "cursor-pointer" : "opacity-40 pointer-events-none"}`}>
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} disabled={!scrolled} className="mt-0.5 cursor-pointer shrink-0" />
        <span className="text-sm text-text-primary leading-relaxed">上記の{steps[step - 1]?.label}の内容を確認し、同意します。</span>
      </label>

      <button onClick={() => handleAgree(steps[step - 1]?.doc)} disabled={!checked || loading}
        className="w-full py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30">
        {loading ? "処理中..." : step < 3 ? "同意して次へ" : "同意する"}
      </button>
    </div>
  );
}

// ── 代理店契約書コンテンツ ──
function ContractContent() {
  return (
    <>
      <h2 className="text-base text-text-primary font-medium text-center">BioVault代理店契約書</h2>
      <p>株式会社SCPP（以下「甲」という。）と代理店（以下「乙」という。）は、甲が提供するBioVaultメンバーシップサービスに関する販売協力業務について、以下のとおり代理店契約を締結する。</p>
      <S t="第1条（目的）"><p>甲は乙に対し、甲が提供するBioVaultメンバーシップサービスその他甲が別途指定するサービス（以下「本サービス」という。）に関する販売協力業務を委託し、乙はこれを受託する。</p></S>
      <S t="第2条（契約期間）"><p>本契約の有効期間は1年間とする。期間満了日の30日前までに甲乙いずれからも書面または電磁的方法による更新拒絶の意思表示がないときは、本契約は同一条件でさらに1年間更新されるものとし、以後も同様とする。</p></S>
      <S t="第3条（業務内容）"><p>乙の業務は、本サービスの見込顧客の発掘、概要説明、面談設定・提案・クロージング、顧客からの申込み取得支援、甲への必要情報の連携に限られる。乙は、甲の事前の書面承諾なく、価格変更、返金保証、医学的説明、法的判断を伴う説明その他甲が明示的に許諾していない約束をしてはならない。</p></S>
      <S t="第4条（非独占・一時代理店）"><p>本契約は非独占契約とし、乙は甲の一時代理店としてのみ本件業務を行う。乙は、自らが発掘または接触した見込顧客に対し、第三者を再代理店、下位代理店、二次代理店、組織員、傘下メンバーその他これらに類する立場として関与させてはならない。</p></S>
      <S t="第5条（顧客との直接契約）"><p>本サービスに関する最終的な契約締結は、甲と顧客との間で直接行うものとする。乙は、甲の事前承諾なく、顧客から金員を受領してはならない。</p></S>
      <S t="第6条（成果報酬）"><p>甲は乙に対し、本件業務の対価として成果報酬を支払う。成果報酬率は、対象契約に基づき甲が現実に受領した内税売上額に対し、別紙報酬条件書の定めによる。成果報酬は入金ベースで発生するものとし、契約成立のみでは発生しない。</p></S>
      <S t="第7条（成果認定）"><p>成果認定は、原則として乙が自らクロージングを完了した案件について行う。</p></S>
      <S t="第8条〜第17条"><p>追加購入の帰属（第8条）、報酬の不発生・返還（第9条）、医療法・薬機法等の遵守（第10条）、使用資料および発信制限（第11条）、禁止行為（第12条）、損害賠償（第13条）、反社会的勢力の排除（第14条）、契約解除（第15条）、存続条項（第16条）、準拠法・管轄（第17条）については、各条項に従うものとする。</p></S>
    </>
  );
}

// ── 遵守誓約書コンテンツ ──
function PledgeContent() {
  return (
    <>
      <h2 className="text-base text-text-primary font-medium text-center">BioVault代理店向け遵守誓約書</h2>
      <p>株式会社SCPP（以下「甲」という。）御中</p>
      <p>私は、甲が提供するBioVaultメンバーシップサービスその他甲が指定する関連サービスに関する販売協力業務を行うにあたり、以下の事項を確認し、これを遵守することを誓約します。</p>
      <S t="第1条（目的）"><p>本誓約書は、私が甲との間で締結したBioVault代理店契約その他関連文書に基づき、本サービスの営業活動に従事するにあたり、法令遵守、販売ルール、情報管理および禁止事項を確認し、これを誠実に遵守することを目的とします。</p></S>
      <S t="第2条（基本認識）"><p>私は、BioVaultメンバーシップサービスが、医療行為そのものの直接提供契約ではなく、会員制サービスであることを理解しています。</p></S>
      <S t="第3条（連鎖販売・ネットワーク型勧誘の禁止）"><p>私は、本サービスの販売協力が、一時代理店による販売協力であり、連鎖販売取引、マルチ商法、ネットワークビジネスその他これらに類する仕組みではないことを理解しています。</p></S>
      <S t="第4条〜第13条"><p>法令遵守（第4条）、表現規制の遵守（第5条）、営業資料の使用（第6条）、秘密保持・開示制限（第7条）、個人情報等の適正管理（第8条）、禁止行為（第9条）、違反時の取扱い（第10条）、研修・確認義務（第11条）、確認事項（第12条）、存続（第13条）については、各条項に従うものとします。</p></S>
      <div className="border-t border-border mt-4 pt-4">
        <p className="font-medium text-text-primary">確認事項</p>
        <ul className="space-y-1.5 mt-2 list-none">
          <li>□ 株式会社SCPPは医療行為の実施主体ではないこと</li>
          <li>□ 本サービスは連鎖販売取引、マルチ商法、ネットワークビジネスではないこと</li>
          <li>□ 第三者を下位代理店等として関与させてはならないこと</li>
          <li>□ 甲承認資料以外は使用できないこと</li>
          <li>□ 無断のSNS投稿、ネット掲載、広告配信等が禁止されること</li>
          <li>□ アイロムグループや株式会社ICE等の情報を無断開示できないこと</li>
          <li>□ 医療効果、若返り効果、資産価値等を断定してはならないこと</li>
          <li>□ 個人情報、要配慮個人情報、個人遺伝情報の管理に注意義務があること</li>
          <li>□ 違反時には報酬受領権の失効、返還義務または損害賠償責任が生じ得ること</li>
        </ul>
      </div>
    </>
  );
}

// ── NDAコンテンツ ──
function NdaContent() {
  return (
    <>
      <h2 className="text-base text-text-primary font-medium text-center">代理店向け秘密保持契約書（NDA）</h2>
      <p>株式会社SCPP（以下「甲」という。）と代理店（以下「乙」という。）は、甲が提供するBioVaultメンバーシップサービスその他関連事業に関し、乙が販売協力業務その他甲が認める業務を遂行するにあたり、相互に開示または知得する秘密情報の取扱いについて、以下のとおり秘密保持契約を締結する。</p>
      <S t="第1条（目的）"><p>本契約は、甲が乙に対し、BioVaultメンバーシップサービスその他関連事業に関する販売協力、営業検討、業務遂行、提携検討その他これらに付随する目的のために開示する秘密情報の取扱い条件を定めることを目的とする。</p></S>
      <S t="第2条（秘密情報の定義）"><p>本契約において「秘密情報」とは、甲が乙に対して、本目的に関連して開示、提供または共有する一切の情報をいい、媒体および方法を問わない。</p></S>
      <S t="第3条（秘密保持義務）"><p>乙は、秘密情報を厳に秘密として保持し、甲の事前の書面承諾なく、第三者に開示、漏えいまたは提供してはならない。乙は、秘密情報を、本目的の範囲内でのみ使用し、本目的外に使用してはならない。</p></S>
      <S t="第4条（再開示の制限）"><p>乙は、甲の事前の書面承諾なく、秘密情報を自己以外の第三者に再開示してはならない。</p></S>
      <S t="第5条〜第17条"><p>個人情報等の特則（第5条）、知的財産・資料利用の制限（第6条）、生成AI等への投入禁止（第7条）、返還・削除・廃棄（第8条）、秘密情報の権利帰属（第9条）、契約期間（第10条）、存続条項（第11条）、違反時の措置（第12条）、損害賠償（第13条）、反社会的勢力の排除（第14条）、譲渡禁止（第15条）、協議（第16条）、合意管轄（第17条）については、各条項に従うものとする。</p></S>
      <S t="重要"><p>乙の秘密保持義務は、本契約終了後10年間存続する。個人情報、要配慮個人情報、個人遺伝情報その他センシティブな情報に関する義務は、本契約終了後も、当該情報が甲または第三者の保護対象である限り存続する。</p></S>
    </>
  );
}

function S({ t, children }: { t: string; children: React.ReactNode }) {
  return <section><h3 className="text-xs text-text-primary font-medium mb-1">{t}</h3><div className="space-y-1.5">{children}</div></section>;
}
