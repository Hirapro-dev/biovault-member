"use client";

import { useState } from "react";

/**
 * 管理ダッシュボード「対応が必要な会員」一覧用のタブコンポーネント
 *
 * iPS作製・保管 と iPS培養上清液 の2つのリストをタブで切り替えて表示する。
 * 既存の StatusTabs.tsx と同じく、Server Component 側でリストの JSX を組み立てて
 * ReactNode として受け取るシンプルな構造。
 */
export default function PendingActionsTabs({
  ipsList,
  cfList,
  ipsCount,
  cfCount,
}: {
  ipsList: React.ReactNode;
  cfList: React.ReactNode;
  ipsCount: number;
  cfCount: number;
}) {
  const [activeTab, setActiveTab] = useState<"ips" | "cf">(
    // 初期表示は件数の多い方を優先。同数なら ips
    cfCount > ipsCount ? "cf" : "ips"
  );

  return (
    <div>
      {/* タブヘッダー */}
      <div className="flex gap-0 border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("ips")}
          className={`px-4 py-3 text-sm tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === "ips"
              ? "text-gold border-gold font-medium"
              : "text-text-muted border-transparent hover:text-text-secondary"
          }`}
        >
          iPS作製・保管
          {ipsCount > 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeTab === "ips"
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-bg-elevated text-text-muted border border-border"
              }`}
            >
              {ipsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("cf")}
          className={`px-4 py-3 text-sm tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 relative ${
            activeTab === "cf"
              ? "text-gold border-gold font-medium"
              : "text-text-muted border-transparent hover:text-text-secondary"
          }`}
        >
          iPS培養上清液
          {cfCount > 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeTab === "cf"
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-bg-elevated text-text-muted border border-border"
              }`}
            >
              {cfCount}
            </span>
          )}
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className={activeTab === "ips" ? "block" : "hidden"}>
        {ipsCount === 0 ? (
          <div className="bg-bg-secondary border border-border rounded-md p-8 text-center text-sm text-text-muted">
            iPS作製・保管で対応が必要な会員はいません
          </div>
        ) : (
          ipsList
        )}
      </div>
      <div className={activeTab === "cf" ? "block" : "hidden"}>
        {cfCount === 0 ? (
          <div className="bg-bg-secondary border border-border rounded-md p-8 text-center text-sm text-text-muted">
            iPS培養上清液で対応が必要な会員はいません
          </div>
        ) : (
          cfList
        )}
      </div>
    </div>
  );
}
