"use client";

import { useState } from "react";

export default function FavoriteButton({
  contentType,
  contentId,
  isFavorited: initialFavorited,
}: {
  contentType: "ARTICLE" | "VIDEO" | "EXTERNAL_NEWS";
  contentId: string;
  isFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Link内で使われる場合のナビゲーション防止
    e.stopPropagation();

    setLoading(true);
    try {
      const res = await fetch("/api/member/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId }),
      });

      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      }
    } catch {
      // エラー時は何もしない
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${
        favorited
          ? "text-gold bg-gold/10"
          : "text-text-muted/40 hover:text-gold/60 hover:bg-gold/5"
      }`}
      title={favorited ? "お気に入り解除" : "お気に入りに追加"}
    >
      {favorited ? "★" : "☆"}
    </button>
  );
}
