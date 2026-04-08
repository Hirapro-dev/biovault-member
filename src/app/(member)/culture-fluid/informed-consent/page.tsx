"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CultureFluidInformedConsentPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // セッションチェック
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // スクロール検知
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20)
        setScrolledToBottom(true);
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // 同意送信
  const handleAgree = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/member/culture-fluid/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
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

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-text-muted text-sm">読み込み中...</div>
      </div>
    );
  }

  // 同意完了画面
  if (done) {
    return (
      <div className="max-w-[700px] mx-auto text-center py-12">
        <div className="text-5xl mb-6">✓</div>
        <h2 className="font-serif-jp text-lg text-gold tracking-wider mb-3">
          同意が完了しました
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          iPS培養上清液施術に関する説明書兼同意書へのご同意ありがとうございます。
        </p>
        <button
          onClick={() => router.push("/culture-fluid")}
          className="px-8 py-3 bg-gold-gradient text-bg-primary text-sm font-medium rounded tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
        >
          マイページに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-5">
        <Link
          href="/culture-fluid"
          className="hover:text-gold transition-colors"
        >
          培養上清液
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">
          iPS培養上清液施術に関する説明書兼同意書
        </span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-2">
        iPS培養上清液施術に関する説明書兼同意書
      </h2>
      <p className="text-xs text-text-muted mb-5">
        ※ こちらの同意がないと、施術に進めません
      </p>

      <div
        ref={scrollRef}
        className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7 max-h-[55vh] overflow-y-auto"
      >
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-5">
          <p>
            私は、iPS培養上清液を用いた施術に関して、株式会社SCPPより以下の説明を受け、その内容を理解したうえで同意します。
          </p>

          <Sec t="1. 本説明書の目的">
            <p>
              本書は、iPS培養上清液を用いた点滴または注射による施術を受けるにあたり、施術の内容および注意点について事前に説明を行い、理解いただいたことを確認するためのものです。
            </p>
          </Sec>

          <Sec t="2. 施術について">
            <p>
              本施術は、iPS培養上清液を用いた点滴または注射によるものです。施術は提携医療機関において、医師の判断および管理のもとで実施されます。
            </p>
            <p>
              なお、株式会社SCPPは本サービスの運営主体であり、施術を直接行うものではありません。施術に関する医学的判断は、提携医療機関の医師が行います。
            </p>
          </Sec>

          <Sec t="3. 想定されるリスク・副作用">
            <p>
              本施術に伴い、一般に以下のようなリスク・副作用が生じることがあります。
            </p>
            <ul className="list-none space-y-1 pl-2">
              <li>・注射部位の痛み、腫れ、内出血</li>
              <li>・アレルギー反応（発疹、かゆみ、呼吸困難等）</li>
              <li>・めまい、気分不良</li>
              <li>・点滴部位の血管痛</li>
              <li>・まれな感染等</li>
            </ul>
            <p>
              症状が現れた場合は、速やかに提携医療機関にご連絡ください。
            </p>
          </Sec>

          <Sec t="4. 効果について">
            <p>
              本施術は、特定の治療効果、美容効果、健康上の効果を保証するものではありません。効果には個人差があり、期待される変化が得られない場合があります。
            </p>
            <p>
              また、iPS培養上清液は医薬品ではなく、その使用に関する効果・効能は法令上認められた表現の範囲にとどまります。
            </p>
          </Sec>

          <Sec t="5. 同意の自由">
            <p>
              私は、本書に基づく説明を受けたうえで、自らの意思により施術への同意を行うものです。同意は任意であり、同意しないことによる不利益はありません。
            </p>
            <p>
              また、施術前であれば同意を撤回することができます。撤回を希望する場合は、担当者までお申し出ください。
            </p>
          </Sec>
        </article>
      </div>

      {/* 同意チェック */}
      <div className="mt-6">
        {!scrolledToBottom && (
          <p className="text-xs text-gold text-center mb-2 animate-pulse">
            ↓ 最後までスクロールしてください
          </p>
        )}

        <label
          className={`flex items-start gap-3 mb-4 ${
            scrolledToBottom
              ? "cursor-pointer"
              : "opacity-40 pointer-events-none"
          }`}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={!scrolledToBottom}
            className="mt-0.5 cursor-pointer shrink-0 accent-gold w-5 h-5"
          />
          <span className="text-[13px] text-text-primary leading-relaxed">
            上記の説明を受け、内容を理解したうえで同意します。
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

// セクションコンポーネント
function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-sm text-text-primary font-medium mb-2">{t}</h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
