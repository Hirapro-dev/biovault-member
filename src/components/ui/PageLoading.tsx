// ページ遷移時のローディング表示（スケルトン）
// 各ルートグループの loading.tsx から呼ばれ、Suspense フォールバックとして
// クリック直後に即表示される（サーバー描画・DB往復の待ち時間を隠す）
export default function PageLoading() {
  return (
    <div
      className="animate-pulse space-y-6"
      aria-busy="true"
      aria-label="読み込み中"
    >
      {/* 見出しプレースホルダー */}
      <div className="h-6 w-48 rounded bg-bg-elevated" />

      {/* コンテンツ枠プレースホルダー */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-md border border-border bg-bg-secondary"
          />
        ))}
      </div>
    </div>
  );
}
