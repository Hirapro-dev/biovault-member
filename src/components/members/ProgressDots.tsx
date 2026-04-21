/**
 * 進捗ドット表示（ガントチャート風）
 *
 * iPS契約フェーズ / 培養上清液フェーズの各ステップを
 * 完了・現在・未着手の3状態でドット表示する
 */

type Step = {
  key: string;
  label: string;
  icon: string;
};

type Props = {
  label: string;       // "iPS" / "培養上清液" など先頭に表示する見出し
  steps: readonly Step[];
  currentKey: string | null;  // 現在のステップキー（null なら全て未着手）
  isCompleted?: boolean;       // 全ステップ完了済みフラグ（最終ステップを完了扱いにする）
};

export default function ProgressDots({ label, steps, currentKey, isCompleted = false }: Props) {
  // 現在のステップのインデックスを取得
  const currentIdx = currentKey ? steps.findIndex((s) => s.key === currentKey) : -1;
  // 全完了なら最終ステップの後ろまで塗る
  const effectiveIdx = isCompleted ? steps.length : currentIdx;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-text-muted shrink-0 w-[60px]">{label}</span>
      <div className="flex items-center gap-[2px]">
        {steps.map((step, i) => {
          // 状態判定
          const isDone = effectiveIdx !== -1 && i < effectiveIdx;
          const isCurrent = !isCompleted && i === currentIdx;

          let dotClass = "w-2 h-2 rounded-full transition-colors";
          if (isDone) {
            dotClass += " bg-gold";
          } else if (isCurrent) {
            dotClass += " bg-gold ring-2 ring-gold/40 animate-pulse";
          } else {
            dotClass += " bg-border";
          }

          // コネクタ（最後以外）
          const connectorClass =
            i < steps.length - 1
              ? `w-2 h-[1px] ${isDone ? "bg-gold" : "bg-border"}`
              : "";

          return (
            <div key={step.key} className="flex items-center" title={`${step.icon} ${step.label}`}>
              <div className={dotClass} />
              {connectorClass && <div className={connectorClass} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
