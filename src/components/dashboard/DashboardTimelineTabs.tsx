"use client";

import { useState } from "react";

interface Props {
  ipsContent: React.ReactNode;
  cfContent: React.ReactNode;
  ipsCount: number;
  cfCount: number;
}

export default function DashboardTimelineTabs({ ipsContent, cfContent, ipsCount, cfCount }: Props) {
  const [tab, setTab] = useState<"ips" | "cf">("ips");

  return (
    <div>
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setTab("ips")}
          className={`px-4 py-2.5 text-sm tracking-wider cursor-pointer transition-colors ${
            tab === "ips" ? "text-gold border-b-2 border-gold" : "text-text-muted hover:text-text-primary"
          }`}
        >
          iPS作製・保管
          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
            tab === "ips" ? "bg-gold/15 text-gold" : "bg-bg-elevated text-text-muted"
          }`}>
            {ipsCount}
          </span>
        </button>
        <button
          onClick={() => setTab("cf")}
          className={`px-4 py-2.5 text-sm tracking-wider cursor-pointer transition-colors ${
            tab === "cf" ? "text-gold border-b-2 border-gold" : "text-text-muted hover:text-text-primary"
          }`}
        >
          iPS培養上清液
          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
            tab === "cf" ? "bg-gold/15 text-gold" : "bg-bg-elevated text-text-muted"
          }`}>
            {cfCount}
          </span>
        </button>
      </div>
      <div className={tab === "ips" ? "" : "hidden"}>{ipsContent}</div>
      <div className={tab === "cf" ? "" : "hidden"}>{cfContent}</div>
    </div>
  );
}
