"use client";

import { signOut } from "next-auth/react";

export default function Header({ userName, isAdmin }: { userName: string; isAdmin: boolean }) {
  return (
    <div className="flex justify-end items-center px-10 py-4 border-b border-border">
      <div className="flex items-center gap-4">
        <span className="text-xs text-text-secondary">
          {isAdmin ? "管理者" : userName} 様
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-4 py-1.5 bg-transparent border border-border text-text-secondary rounded text-[11px] hover:border-border-gold hover:text-gold transition-all duration-300 cursor-pointer"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
