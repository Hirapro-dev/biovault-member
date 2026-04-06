"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CellConsentPage() {
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
      // 1. 細胞提供・保管同意書に同意
      const res = await fetch("/api/member/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: "CELL_STORAGE_CONSENT" }),
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
        <div className="text-4xl mb-4">✅</div>
        <h2 className="font-serif-jp text-lg text-gold tracking-wider mb-3">同意・日程調整申請が完了しました</h2>
        <p className="text-sm text-text-secondary mb-2">細胞提供・保管同意書へのご同意ありがとうございます。</p>
        <p className="text-sm text-text-secondary mb-6">日程調整の申請を送信しました。担当スタッフより改めてご連絡いたします。</p>
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
        <span className="text-text-secondary">細胞提供・保管同意書</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-2">
        細胞提供・保管同意書
      </h2>
      <p className="text-xs text-text-muted mb-5">※ こちらの同意がないと、問診・採血に進めません</p>

      <div ref={scrollRef} className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7 max-h-[55vh] overflow-y-auto">
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-5">
          <p>株式会社SCPP（以下「甲」という。）は、BioVaultメンバーシップ制サービスに関連して、メンバーシップ登録者本人（以下「乙」という。）より提供された細胞の取扱いについて、以下のとおり説明します。</p>
          <p>乙は、本書の内容を確認し、理解したうえで、これに同意するものとします。</p>

          <Sec t="第1条（目的）">
            <p>本同意書は、乙から提供される血液その他の生体由来試料および当該試料から作製される細胞等の提供、保管、管理に関する条件を定めることを目的とします。</p>
          </Sec>
          <Sec t="第2条（提供する試料）">
            <p>乙は、iPS細胞作製のために必要な血液その他の生体由来試料（以下「本試料」という。）を、提携医療機関を通じて提供することに同意します。</p>
          </Sec>
          <Sec t="第3条（試料の利用目的）">
            <p>本試料は、乙本人のiPS細胞作製および保管の目的にのみ利用されます。その他の目的での利用は、別途乙の同意を得た場合を除き、行われません。</p>
          </Sec>
          <Sec t="第4条（保管条件）">
            <p>作製された細胞は、提携保管施設において、適切な温度管理および品質管理のもと保管されます。保管期間は、乙が加入するプランに定める期間とします。</p>
          </Sec>
          <Sec t="第5条（品質に関する説明）">
            <p>生体由来試料および細胞には個体差があり、採取条件、作製条件、保存環境その他の影響を受けるため、品質、増殖性、分化能その他の性状が常に一定であるとは限りません。</p>
          </Sec>
          <Sec t="第6条（保管終了時の取扱い）">
            <p>保管期間満了後、更新がなされない場合、または乙の退会等により保管契約が終了した場合、保管細胞は適切に廃棄されます。</p>
          </Sec>
          <Sec t="第7条（死亡時の取扱い）">
            <p>乙が死亡した場合における保管細胞の取扱いについては、メンバーシップ契約書第17条の定めに従うものとします。</p>
          </Sec>
          <Sec t="第8条（同意の撤回）">
            <p>乙は、既に不可逆的な処理が実施済みの部分を除き、将来に向かって本同意を撤回することができます。</p>
          </Sec>
          <Sec t="第9条（免責）">
            <p>甲は、天災地変、感染症、設備故障その他甲の合理的支配を超える事由により生じた試料または細胞の損失について責任を負いません。</p>
          </Sec>
        </article>
      </div>

      <div className="mt-4">
        {!scrolledToBottom && (
          <p className="text-xs text-gold text-center mb-2 animate-pulse">↓ 最後までスクロールしてください</p>
        )}
        <label className={`flex items-start gap-3 mb-4 ${scrolledToBottom ? "cursor-pointer" : "opacity-40 pointer-events-none"}`}>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} disabled={!scrolledToBottom} className="mt-0.5 cursor-pointer shrink-0 accent-gold" />
          <span className="text-[13px] text-text-primary leading-relaxed">
            上記の細胞提供・保管同意書の内容を確認し、同意します。
          </span>
        </label>
        <button onClick={handleAgree} disabled={!checked || loading} className="w-full py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-30">
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
