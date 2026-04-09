"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GoldDivider from "@/components/ui/GoldDivider";

// プラン定義
const PLANS = [
  {
    id: "iv_drip_1",
    label: "点滴1回分（10ml）",
    price: 880000,
    priceLabel: "¥880,000",
  },
  {
    id: "iv_drip_5",
    label: "点滴5回分（50ml）＋1回分（10ml）",
    price: 4400000,
    priceLabel: "¥4,400,000",
  },
  {
    id: "injection_1",
    label: "注射1回分（3ml）",
    price: 440000,
    priceLabel: "¥440,000",
  },
  {
    id: "injection_5",
    label: "注射5回分（15ml）＋1回分（3ml）",
    price: 2200000,
    priceLabel: "¥2,200,000",
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

export default function CultureFluidApplyPage() {
  const { status } = useSession();
  const router = useRouter();

  // ステップ管理（1: プラン選択, 2: 留意事項, 3: 最終確認）
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ステップ1: プラン選択
  const [selectedPlan, setSelectedPlan] = useState<PlanId | "">("");
  const [paymentDate, setPaymentDate] = useState("");

  // ステップ2: 留意事項スクロール
  const cautionRef = useRef<HTMLDivElement>(null);
  const [cautionScrolled, setCautionScrolled] = useState(false);
  const [cautionAgreed, setCautionAgreed] = useState(false);

  // セッションチェック
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 留意事項スクロール検知
  const handleCautionScroll = () => {
    if (!cautionRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = cautionRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setCautionScrolled(true);
    }
  };

  // 選択中プランの情報を取得
  const currentPlan = PLANS.find((p) => p.id === selectedPlan);

  // 申込送信
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/member/culture-fluid/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: selectedPlan,
          paymentDate: paymentDate
            ? new Date(paymentDate).toISOString()
            : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "申込に失敗しました");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-text-muted text-sm">読み込み中...</div>
      </div>
    );
  }

  // 申込完了画面
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-bg-secondary border border-border-gold rounded-md p-8 sm:p-12 text-center">
          <div className="text-5xl mb-6">✓</div>
          <h2 className="font-serif-jp text-xl text-gold tracking-wider mb-4">
            お申込みありがとうございます
          </h2>
          <GoldDivider />
          <p className="text-text-secondary text-sm leading-relaxed mt-6 mb-2">
            iPS培養上清液の追加購入申込を受け付けました。
          </p>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            担当者より改めてご連絡させていただきます。
          </p>
          <button
            onClick={() => router.push("/culture-fluid")}
            className="px-8 py-3 bg-gold-gradient text-bg-primary text-sm font-medium rounded tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
          >
            マイページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="text-[10px] tracking-[4px] text-gold mb-2">
          CULTURE FLUID ORDER
        </div>
        <h2 className="font-serif-jp text-xl sm:text-2xl font-normal text-text-primary tracking-wider mb-4">
          iPS培養上清液の追加購入申込
        </h2>
        <GoldDivider />
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono ${
                s === step
                  ? "bg-gold text-bg-primary"
                  : s < step
                  ? "bg-gold/20 text-gold"
                  : "bg-bg-elevated text-text-muted"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-[1px] ${
                  s < step ? "bg-gold" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ステップ1: プラン選択 */}
      {step === 1 && (
        <div className="space-y-6">
          {/* プラン選択 */}
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-gold mb-3">プランの選択</h3>
            <div className="space-y-3">
              {PLANS.map((plan) => (
                <label
                  key={plan.id}
                  className="flex items-start gap-3 cursor-pointer p-3 rounded border border-border hover:border-border-gold transition-colors"
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlan === plan.id}
                    onChange={() => setSelectedPlan(plan.id)}
                    className="accent-gold mt-0.5 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-text-primary">{plan.label}</div>
                    <div className="font-mono text-gold text-lg mt-1">
                      {plan.priceLabel}
                      <span className="text-xs text-text-muted ml-1">（税込）</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-text-muted mt-4 leading-relaxed">
              ※すべてハイブリッドナノリポソーム化されたiPS培養上清液となります
            </p>
          </div>

          {/* 支払予定日 */}
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-gold mb-3">お支払い予定日</h3>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold transition-colors"
            />
          </div>

          <button
            onClick={() => {
              setStep(2);
              window.scrollTo(0, 0);
            }}
            disabled={!selectedPlan}
            className={`w-full py-4 rounded text-sm tracking-wider transition-all cursor-pointer ${
              selectedPlan
                ? "bg-gold-gradient text-bg-primary hover:opacity-90"
                : "bg-bg-elevated text-text-muted opacity-40 cursor-not-allowed"
            }`}
            style={
              selectedPlan
                ? {
                    background: "linear-gradient(135deg, #BFA04B, #D4B856)",
                    color: "#070709",
                  }
                : undefined
            }
          >
            次へ（留意事項の確認へ進む）
          </button>
        </div>
      )}

      {/* ステップ2: 留意事項 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">
              iPS培養上清液に関する留意事項
            </h3>
            <p className="text-xs text-text-muted mb-3">
              以下の留意事項をお読みいただき、同意のうえお進みください。
            </p>
            <div
              ref={cautionRef}
              onScroll={handleCautionScroll}
              className="max-h-[50vh] overflow-y-auto border border-border rounded p-4 bg-bg-tertiary text-xs sm:text-sm text-text-secondary leading-[2] space-y-4"
            >
              <CautionContent />
            </div>

            {!cautionScrolled && (
              <div className="mt-3 text-center text-xs text-gold animate-pulse">
                ↓ 最後までスクロールしてください
              </div>
            )}

            <div
              className={`mt-4 transition-opacity ${
                cautionScrolled ? "opacity-100" : "opacity-40"
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cautionAgreed}
                  onChange={(e) =>
                    cautionScrolled && setCautionAgreed(e.target.checked)
                  }
                  disabled={!cautionScrolled}
                  className="accent-gold w-5 h-5"
                />
                <span className="text-sm text-text-secondary">
                  上記の留意事項を確認し、同意します。
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep(1);
                window.scrollTo(0, 0);
              }}
              className="flex-1 py-3 border border-border text-text-secondary rounded text-sm hover:border-border-gold hover:text-gold transition-all cursor-pointer"
            >
              戻る
            </button>
            <button
              onClick={() => {
                setStep(3);
                window.scrollTo(0, 0);
              }}
              disabled={!cautionAgreed}
              className={`flex-1 py-3 rounded text-sm tracking-wider transition-all cursor-pointer ${
                cautionAgreed
                  ? "bg-gold-gradient text-bg-primary hover:opacity-90"
                  : "bg-bg-elevated text-text-muted opacity-40 cursor-not-allowed"
              }`}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* ステップ3: 最終確認 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-border rounded-md p-6">
            <h3 className="text-sm text-text-primary tracking-wider mb-4">
              お申込み内容の確認
            </h3>

            <div className="space-y-4">
              <div className="border-b border-border pb-3">
                <div className="text-xs text-text-muted mb-1">選択プラン</div>
                <div className="text-sm text-text-primary">
                  {currentPlan?.label}
                </div>
              </div>

              <div className="border-b border-border pb-3">
                <div className="text-xs text-text-muted mb-1">
                  お支払い金額（税込）
                </div>
                <div className="font-mono text-lg text-gold">
                  {currentPlan?.priceLabel}
                </div>
              </div>

              {paymentDate && (
                <div className="border-b border-border pb-3">
                  <div className="text-xs text-text-muted mb-1">
                    お支払い予定日
                  </div>
                  <div className="text-sm text-text-primary">
                    {new Date(paymentDate).toLocaleDateString("ja-JP")}
                  </div>
                </div>
              )}

              <div className="border-b border-border pb-3">
                <div className="text-xs text-text-muted mb-1">
                  お支払い方法
                </div>
                <div className="text-sm text-text-primary">銀行振込</div>
              </div>

              <div>
                <div className="text-xs text-text-muted mb-1">留意事項</div>
                <div className="text-sm text-text-primary">確認・同意済み ✓</div>
              </div>
            </div>
          </div>

          {/* 振込先情報 */}
          <div className="bg-bg-secondary border border-border-gold rounded-md p-6">
            <h3 className="text-sm text-gold mb-3">お振込先</h3>
            <div className="text-sm text-text-secondary leading-relaxed space-y-1">
              <p>三井住友銀行　渋谷駅前支店</p>
              <p>普通　9876540</p>
              <p>カ）エスシーピーピー</p>
            </div>
          </div>

          <div className="bg-gold/5 border-l-2 border-gold px-4 py-3 rounded-r-md">
            <p className="text-[12px] sm:text-[13px] text-text-secondary leading-relaxed">
              上記の内容を確認し、iPS培養上清液の追加購入に申し込みます。
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep(2);
                window.scrollTo(0, 0);
              }}
              className="flex-1 py-3 border border-border text-text-secondary rounded text-sm hover:border-border-gold hover:text-gold transition-all cursor-pointer"
            >
              戻る
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-4 rounded text-sm tracking-wider hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #BFA04B, #D4B856)",
                color: "#070709",
              }}
            >
              {loading ? "送信中..." : "申し込む"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 留意事項コンテンツ（正式版・全15条）
function CautionContent() {
  return (
    <>
      <section>
        <h4 className="text-sm text-text-primary font-medium mb-1">文書目的</h4>
        <div className="space-y-1.5">
          <p>
            本書は、BioVaultメンバーシップ契約者がiPS培養上清液の追加購入を申し込むにあたり、当該追加購入品の性質、提供条件、施術実施条件、品質管理上の取扱い、並びに表示上及び利用上の留意事項を確認し、理解することを目的とする。
          </p>
        </div>
      </section>

      <Sec t="第1条　定義">
        <p>iPS培養上清液とは、iPS細胞の培養過程において得られる液性成分をいう。</p>
        <p>当該上清液には、細胞が生み出す多種多様な成分が含まれており、美と健康における新たな選択肢として位置づけられている。</p>
        <p>ただし、この定義は一般的・概念的説明であり、特定の疾病の診断、治療又は予防を目的とするものとして定義されるものではない。</p>
      </Sec>

      <Sec t="第2条　位置づけ">
        <p>iPS培養上清液は、BioVaultメンバーシップに関連するiPSサービス「CellAsset」に関連して説明される構成要素の一つであり「iPS細胞資産＝本体（未来価値）」に対し、「iPS培養上清液＝体感（現在価値）」として整理されている。</p>
        <p>すなわち、iPS培養上清液は、顧客本人由来の細胞資産を背景に、現在時点におけるコンディショニング支援の選択肢として説明される補完的要素であり、それ自体が独立して医療上の結果を保証する商品として位置づけられるものではない。</p>
      </Sec>

      <Sec t="第3条　生成の背景">
        <p>iPS培養上清液は、iPS細胞の培養工程から得られる液性成分である。</p>
        <p>当該液性成分には、細胞由来の多様な成分が含まれ、それらが肌や身体のコンディションをサポートする新しいアプローチとして注目されている旨が示されている。</p>
        <p>もっとも、この説明は一般的な成分的特徴及び技術背景を示すものであり、個別の顧客に対する具体的効果を当然に生じさせることを意味しない。</p>
      </Sec>

      <Sec t="第4条　成分的特徴">
        <p>iPS培養上清液には、主要な成長因子（サイトカイン）として、HGF、FGF、VEGF、IGF-1、KGF、TGF-β、PDGF、EGF等が含まれる旨が説明されている。</p>
        <p>また、その他にも多様な成分、生理活性物質及び成長因子が含まれる旨が説明されており、230種類以上の有効可能性タンパク質が確認されている旨が示されている。</p>
      </Sec>

      <Sec t="第5条　成分説明の法的位置づけ">
        <p>前条に定める成分情報は、iPS培養上清液に含まれ得る成分的特徴を説明するためのものである。</p>
        <p>当該成分情報の提示は、特定の疾病の改善、特定部位の回復、美容結果の発現、育毛結果の発現その他個別具体的な結果を保証する趣旨で用いてはならない。</p>
        <p>したがって、パンフレットその他の対外文書においては、成分名又は一般的な研究知見を示す場合であっても、直ちに個別の効果効能へ結びつける断定表現を避けるものとする。</p>
      </Sec>

      <Sec t="第6条　商品説明上の基本整理">
        <p>iPS培養上清液に関する商品説明は、原則として以下の範囲で行うものとする。</p>
        <ul className="list-none space-y-1 pl-2">
          <li>一　iPS細胞の培養過程で得られる液性成分であること</li>
          <li>二　多様な構成成分を含むことが確認されていること</li>
          <li>三　美容及び健康領域における新たな選択肢として注目されていること</li>
          <li>四　BioVaultにおいては、細胞資産を背景とした現在価値の一部として設計されていること</li>
          <li>五　実際の提供可否、利用可否、施術可否等は個別事情及び医師判断等によること</li>
        </ul>
        <p>この範囲を超えて、治療成績、身体改善、若返り結果等を当然のように訴求することは認められない。</p>
      </Sec>

      <Sec t="第7条　独自加工技術との関係">
        <p>BioVaultで提供するiPS培養上清液には、「ハイブリッド・ナノリポソーム化」と称する独自加工技術が施されている。</p>
        <p>当該技術は、構成成分を極小のカプセルに閉じ込め、体内深部への浸透力、分散性及び持続性に配慮する設計となっている。</p>
        <p>iPS培養上清液内に含まれる成長因子や構成成分をナノサイズ化し、細胞親和性の高いリン脂質でカプセル化する最先端DDSであり、iPS培養上清液の活用効率を高めることを企図した技術である。</p>
      </Sec>

      <Sec t="第8条　独自加工技術の法的位置づけ">
        <p>前条に定める独自加工技術の説明は、品質設計及び差別化要素に関する一般的説明として扱う。</p>
        <p>当該技術の存在をもって、特定の身体改善効果、施術効果、医療効果又は特定部位への到達結果を保証するものと解してはならない。</p>
      </Sec>

      <Sec t="第9条　BioVaultにおける提供関係">
        <p>BioVaultメンバーシップに関連するiPSサービスにおいて、iPS培養上清液は、細胞資産の保管期間中に精製され、提携医療機関を通じて所定の施術導線に接続されるものとして説明されている。</p>
        <p>初回分については、パンフレット上、メンバーシップ価格に点滴1回分（10ml）の精製及び施術費用が含まれる構造とされている。</p>
        <p>また、保管期間中は必要に応じて追加購入が可能とされ、点滴及び注射に関する継続運用オプションが示されており、当留意事項は追加購入を行う場合に必ず同意すべき留意事項として定められている。</p>
      </Sec>

      <Sec t="第10条　提供条件">
        <p>iPS培養上清液の提供又は利用は、無条件かつ一律に確約されるものではない。</p>
        <p>精製されたiPS培養上清液については、提携医療機関を通じた施術導線が設けられているが、実際の施術可否、施術方法及び施術時期は、都度、医師による問診、検査、既往歴確認その他の判断を前提として決定される。</p>
        <p>よって顧客が追加購入申込みを行った場合であっても、医学的判断その他の事情により、希望する時期、方法又は内容で施術が実施されない場合がある。</p>
      </Sec>

      <Sec t="第11条　納品及び管理">
        <p>発注後、必要資金の入金確認日を基点として、通常は約1か月を目安に精製手続きが進行するが、製造工程、品質確認、物流事情その他の理由により前後する場合がある。</p>
        <p>また、使用期限については、精製後約8か月以内となる。</p>
        <p>したがって、iPS培養上清液は、一般的な自由流通商品として顧客が任意に保管・使用することを前提とするものではなく、所定の品質管理及び施術導線を前提として運用される提供物として整理する。</p>
        <p>追加購入申込み後、提携機関における精製手配その他の準備に着手した後は、顧客都合による取消し、返金又は変更に応じられない場合がある。</p>
        <p>使用期限内に施術実施に至らなかった場合の再精製、再手配、廃棄その他の取扱いは、別途当社又は提携機関の定めによるものとする。</p>
        <p>追加購入代金に含まれる費用の範囲は、別途当社が定めるところによるものとし、交通費や宿泊費その他付随費用が別途顧客負担となる。</p>
        <p>納品先医療機関及び施術実施医療機関は、品質管理及び提携体制上の理由により、当社又は提携機関が指定する範囲に限られる。</p>
      </Sec>

      <Sec t="第12条　品質及び安全性に関する説明">
        <p>iPS培養上清液の精製や納品は提携機関の責任下で実施される。</p>
        <p>品質管理体制の一部として、クリーンルーム環境、GMP準拠の品質管理、衛生管理、トレーサビリティ等が整備されている。</p>
        <p>また、当社は、不明瞭な追加費用請求を行わないこと、過剰な誇張表現や医療的な断定を行うことなく、現実的かつ先進的なサービス提供に努める旨を示している。</p>
        <p>もっとも、これらの説明は、運用体制及び姿勢に関するものであり、個別の顧客に対する絶対的安全、完全無欠性又は無条件の適合性を保証できるものではない。</p>
      </Sec>

      <Sec t="第13条　禁止又は制限される表現">
        <p>iPS培養上清液に関しては、以下の表現を原則として禁止又は厳格管理対象とする。</p>
        <ul className="list-none space-y-1 pl-2">
          <li>一　特定疾病の診断、治療又は予防を目的とするとの表現</li>
          <li>二　治る、改善する、再生する、若返る等の断定表現</li>
          <li>三　個別の施術結果又は有用性を保証する表現</li>
          <li>四　安全性が完全である、リスクがない等の絶対表現</li>
          <li>五　医師判断を不要とするかのような表現</li>
          <li>六　顧客の状態にかかわらず誰にでも同様の結果が生じるかのような表現</li>
          <li>七　成分情報を直接的な効果効能保証へ転化する表現</li>
        </ul>
        <p>本資料が特定の疾病の診断、治療、予防を目的とするものではなく、個別の治療効果、施術結果、安全性又は有用性を保証するものではない旨が明記されているため、社内外の説明もこれに整合させる。</p>
      </Sec>

      <Sec t="第14条　対外資料における説明の限界">
        <p>iPS培養上清液に関するパンフレット、概要書、比較表、成分表、図表その他の資料は、いずれも理解促進のための補助資料として用いる。</p>
        <p>これらの資料に含まれる成分名、技術名、相場比較、加工技術説明、一般的背景説明等は、直ちに正式な契約条件、医療上の約束又は法的保証事項を構成するものではない。</p>
        <p>最終的な提供条件、利用条件、施術条件、費用負担その他の詳細は、契約書、重要事項説明書、個別同意書及び提携医療機関の説明によって定まる。</p>
      </Sec>

      <Sec t="第15条　確認事項">
        <p>顧客は、iPS培養上清液の追加購入申込みにあたり、少なくとも以下の事項を確認したものとする。</p>
        <ul className="list-none space-y-1 pl-2">
          <li>一　本商品が特定疾病の診断、治療又は予防を目的とするものではないこと。</li>
          <li>二　成分情報及び技術情報は一般的説明であり、個別の効果効能を保証するものではないこと。</li>
          <li>三　施術可否、施術方法及び施術時期は、提携医療機関の医師判断を前提として決定されること。</li>
          <li>四　精製後の使用期限、納品方法、キャンセル条件その他の提供条件が存在すること。</li>
          <li>五　本書の記載は補助説明であり、最終的な条件は契約書、重要事項説明書、個別同意書その他の正式文書によって定まること。</li>
        </ul>
      </Sec>
    </>
  );
}

// セクションコンポーネント
function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-sm text-text-primary font-medium mb-1">{t}</h4>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}
