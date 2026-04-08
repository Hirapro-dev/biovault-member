"use client";

import { useState } from "react";

export default function StatusTabs({
  ipsTab,
  cultureFluidTab,
  hasCultureFluidOrders,
}: {
  ipsTab: React.ReactNode;
  cultureFluidTab: React.ReactNode;
  hasCultureFluidOrders: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"ips" | "cf">("ips");

  return (
    <div className="mb-6">
      {/* タブヘッダー */}
      <div className="flex gap-0 border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("ips")}
          className={`px-4 py-3 text-sm tracking-wider transition-all cursor-pointer border-b-2 ${
            activeTab === "ips"
              ? "text-gold border-gold font-medium"
              : "text-text-muted border-transparent hover:text-text-secondary"
          }`}
        >
          iPS作製・保管
        </button>
        <button
          onClick={() => setActiveTab("cf")}
          className={`px-4 py-3 text-sm tracking-wider transition-all cursor-pointer border-b-2 relative ${
            activeTab === "cf"
              ? "text-gold border-gold font-medium"
              : "text-text-muted border-transparent hover:text-text-secondary"
          }`}
        >
          iPS培養上清液
          {hasCultureFluidOrders && activeTab !== "cf" && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold" />
          )}
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className={activeTab === "ips" ? "block" : "hidden"}>
        {ipsTab}
      </div>
      <div className={activeTab === "cf" ? "block" : "hidden"}>
        {cultureFluidTab}
      </div>
    </div>
  );
}
