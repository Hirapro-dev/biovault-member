"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InformedConsentPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolledToBottom(true);
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const handleAgree = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/member/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: "INFORMED_CONSENT" }),
      });
      if (res.ok) {
        setDone(true);
      }
    } catch {
      // エラー
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-[700px] mx-auto text-center py-12">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="font-serif-jp text-lg text-gold tracking-wider mb-3">同意が完了しました</h2>
        <p className="text-sm text-text-secondary mb-6">インフォームドコンセントへのご同意ありがとうございます。</p>
        <button onClick={() => router.push("/mypage")} className="px-8 py-3 bg-gold-gradient text-bg-primary text-sm font-medium rounded tracking-wider hover:opacity-90 transition-opacity cursor-pointer">
          マイページに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/mypage" className="hover:text-gold transition-colors">マイページ</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">インフォームドコンセント</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-2">
        自家iPS細胞作製に関する説明書兼同意書
      </h2>
      <p className="text-xs text-text-muted mb-5">※ こちらの同意がないと、問診・採血に進めません</p>

      <div
        ref={scrollRef}
        className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7 max-h-[55vh] overflow-y-auto"
      >
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-5">
          <p>私は、自家iPS細胞作製に関して、株式会社SCPPより以下の説明を受け、その内容を理解したうえで同意します。</p>

          <Sec t="1. 本説明書の目的">
            <p>本書は、私自身の血液その他の生体由来試料を用いて、自家iPS細胞の作製を行うにあたり、その内容、注意点および限界について説明を受け、理解したことを確認するためのものです。</p>
          </Sec>

          <Sec t="2. 自家iPS細胞作製について">
            <p>自家iPS細胞作製とは、私自身から採取した血液その他の試料を原料として、私自身に由来するiPS細胞の作製を試みるものです。</p>
            <p>この作製は、将来に備えて細胞を確保し、必要に応じて保管することを目的としています。</p>
            <p>ただし、本書に基づく同意は、自家iPS細胞の作製に向けた説明を受けたことおよびその工程に進むことへの同意であり、将来の治療、美容施術、研究利用その他の具体的な利用について包括的に同意するものではありません。</p>
          </Sec>

          <Sec t="3. 株式会社SCPPの立場について">
            <p>株式会社SCPPは、本サービスの運営主体であり、医療行為を直接行うものではありません。</p>
            <p>診察、問診、採血、医学的判断その他の医療行為は、提携医療機関またはその所属医師等が行います。</p>
            <p>また、細胞の作製、培養、品質評価、保管等の工程は、提携先機関が行います。</p>
          </Sec>

          <Sec t="4. 作製にあたってご理解いただきたいこと">
            <p>自家iPS細胞作製は、申込みや本書への同意のみをもって当然に完了または成立するものではありません。</p>
            <p>問診、診察、検査結果、健康状態、試料の状態、技術上の条件、品質基準その他の事情により、作製ができない場合があります。</p>
            <p>また、採血後であっても、途中工程において細胞作製が不能または困難と判断される場合があります。</p>
            <p>自家iPS細胞の作製完了までには一定の期間を要し、その期間には個人差があります。</p>
            <p>さらに、一度の採血から十分な細胞作製に至らない場合があり、その際には再採血その他の追加対応が必要となる場合があります。</p>
            <p>なお、妊娠中の方、感染症に罹患している方、悪性腫瘍に関する治療中の方または最近治療歴のある方等については、問診、診察、検査その他の結果により、作製工程に進めない場合があります。</p>
          </Sec>

          <Sec t="5. 想定される不利益・注意点">
            <p>採血その他の試料採取に伴い、一般に以下のような不利益が生じることがあります。</p>
            <ul className="list-none space-y-1 pl-2">
              <li>・採血部位の痛み、腫れ、内出血</li>
              <li>・めまい、気分不良</li>
              <li>・血糖値の低下</li>
              <li>・アレルギー反応（発疹、かゆみ、呼吸困難、アナフィラキシー等）</li>
              <li>・まれな感染等</li>
            </ul>
            <p>また、作製された細胞についても、品質、増殖性、分化能、将来の利用可能性等には個体差があり、常に一定の性状が得られるとは限りません。</p>
          </Sec>

          <Sec t="6. 試料および細胞等の取扱いについて">
            <p>採取された試料、本細胞等またはこれらに関連する生成物は、法令、品質管理上の要請および提携先の運用基準等により、本人への直接交付、任意の持出しまたは第三者への自由な移送が認められない場合があります。</p>
          </Sec>

          <Sec t="7. 保証されない事項">
            <p>自家iPS細胞作製は、特定の治療効果、美容上の効果、研究成果、経済的利益または資産的価値を保証するものではありません。</p>
            <p>また、将来において、特定の再生医療や関連サービスを当然に受けられることを保証するものでもありません。</p>
          </Sec>

          <Sec t="8. 個人情報等の取扱い">
            <p>自家iPS細胞作製に関連して、私の個人情報、要配慮個人情報、個人遺伝情報、検査結果、試料識別情報その他必要な情報が取得、利用、保管および提携先へ提供される場合があります。</p>
          </Sec>

          <Sec t="9. 同意の自由">
            <p>私は、本書に基づく説明を受けたうえで、自らの意思により同意するものです。</p>
            <p>また、法令上または工程上撤回が制限される場合を除き、将来に向かって同意を撤回できる場合があることについて説明を受けました。</p>
          </Sec>

          <Sec t="10. 確認事項">
            <p>私は、以下の事項を理解しました。</p>
            <ul className="list-none space-y-1.5 pl-2">
              <li>□ 株式会社SCPPは医療行為の実施主体ではないこと</li>
              <li>□ 診察、採血、医学的判断は提携医療機関等が行うこと</li>
              <li>□ 細胞作製、培養、品質評価、保管等は提携先機関が行うこと</li>
              <li>□ 本書への同意によって自家iPS細胞作製の完了または成功が保証されるものではないこと</li>
              <li>□ 採血後であっても細胞作製ができない場合があること</li>
              <li>□ 作製完了までの期間には個人差があること</li>
              <li>□ 一度の採血で十分な細胞作製に至らず、再採血その他の追加対応が必要となる場合があること</li>
              <li>□ 妊娠中、感染症罹患中、悪性腫瘍治療中または最近治療歴のある場合等には、作製工程に進めない場合があること</li>
              <li>□ 将来の治療、美容、研究利用等は別途説明・同意を要すること</li>
              <li>□ 試料、本細胞等または関連生成物は、法令、品質管理上の要請等により本人へ直接交付されない場合があること</li>
              <li>□ 本書は費用承諾書ではなく、費用や契約条件は別途書面で確認済みであること</li>
            </ul>
          </Sec>
        </article>
      </div>

      {/* 同意チェック */}
      <div className="mt-4">
        {!scrolledToBottom && (
          <p className="text-xs text-gold text-center mb-2 animate-pulse">↓ 最後までスクロールしてください</p>
        )}
        <label className={`flex items-start gap-3 mb-4 ${scrolledToBottom ? "cursor-pointer" : "opacity-40 pointer-events-none"}`}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={!scrolledToBottom}
            className="mt-0.5 cursor-pointer shrink-0 accent-gold"
          />
          <span className="text-[13px] text-text-primary leading-relaxed">
            上記の説明を受け、内容を理解したうえで、自家iPS細胞作製に関する説明書兼同意書に同意します。
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
