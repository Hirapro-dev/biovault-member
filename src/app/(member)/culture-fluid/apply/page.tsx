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

// 留意事項コンテンツ（第1条〜第15条）
function CautionContent() {
  return (
    <>
      <Sec t="第1条　定義">
        <p>
          本留意事項における「iPS培養上清液」とは、iPS細胞の培養過程で得られる上清液を指し、その成分・特性について定義します。
        </p>
      </Sec>
      <Sec t="第2条　位置づけ">
        <p>
          iPS培養上清液は医薬品・医療機器等には該当せず、法令上の分類における位置づけを明確にします。
        </p>
      </Sec>
      <Sec t="第3条　生成の背景">
        <p>
          iPS培養上清液は、iPS細胞の培養工程において副次的に生成されるものであり、その背景と経緯を説明します。
        </p>
      </Sec>
      <Sec t="第4条　成分的特徴">
        <p>
          iPS培養上清液に含まれる成長因子・サイトカイン等の成分的特徴について説明します。ただし、成分構成は培養条件等により変動します。
        </p>
      </Sec>
      <Sec t="第5条　成分説明の法的位置づけ">
        <p>
          成分に関する説明は科学的知見に基づくものであり、特定の効果・効能を保証または標榜するものではありません。
        </p>
      </Sec>
      <Sec t="第6条　商品説明上の基本整理">
        <p>
          本製品の説明においては、医薬品医療機器等法その他関連法令に抵触しない範囲で行うことを基本とします。
        </p>
      </Sec>
      <Sec t="第7条　独自加工技術との関係">
        <p>
          ハイブリッドナノリポソーム化等の独自加工技術について説明し、加工による変化の範囲を明示します。
        </p>
      </Sec>
      <Sec t="第8条　独自加工技術の法的位置づけ">
        <p>
          独自加工技術は製造工程上の技術であり、医療行為や医薬品の製造には該当しないことを説明します。
        </p>
      </Sec>
      <Sec t="第9条　BioVaultにおける提供関係">
        <p>
          BioVaultメンバーシップにおけるiPS培養上清液の提供は、会員向けサービスの一環として行われるものです。
        </p>
      </Sec>
      <Sec t="第10条　提供条件">
        <p>
          iPS培養上清液の提供にあたっては、会員資格の確認、医師の判断等、所定の条件を満たす必要があります。
        </p>
      </Sec>
      <Sec t="第11条　納品及び管理">
        <p>
          納品は提携医療機関への直接送付とし、適切な温度管理のもと保管・管理されます。会員への直接交付は行いません。
        </p>
      </Sec>
      <Sec t="第12条　品質及び安全性に関する説明">
        <p>
          品質管理体制のもと製造されますが、生体由来製品の特性上、品質・安全性について絶対的な保証を行うものではありません。
        </p>
      </Sec>
      <Sec t="第13条　禁止又は制限される表現">
        <p>
          iPS培養上清液に関して、治療効果・美容効果等の断定的表現、誇大広告に該当する表現は禁止されます。
        </p>
      </Sec>
      <Sec t="第14条　対外資料における説明の限界">
        <p>
          パンフレット等の対外資料における説明は概要にとどまり、個別の状況に応じた説明を代替するものではありません。
        </p>
      </Sec>
      <Sec t="第15条　確認事項">
        <p>
          会員は上記の各条項の内容を理解し、iPS培養上清液が医薬品ではないこと、効果を保証するものではないことを確認します。
        </p>
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
