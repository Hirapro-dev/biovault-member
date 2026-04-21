/**
 * 会員一覧テーブル（admin / staff / agency 共通UI）
 *
 * - PC版: 横スクロール + 左3列（会員番号/氏名/担当）固定
 * - モバイル版: カードリスト
 * - 会員番号・氏名クリックでカルテへ遷移
 */

import Link from "next/link";
import { IPS_STEPS, CF_STEPS } from "@/lib/dashboard-timeline";
import ProgressDots from "@/components/members/ProgressDots";
import StepBadge from "@/components/members/StepBadge";

export type MemberRow = {
  id: string;
  name: string;
  memberNumber: string | null;
  assignedName: string;                    // 担当者名（---可）
  ipsStepKey: string;                       // iPS現在ステップ
  ipsCompleted: boolean;                    // iPSが保管完了（STORAGE_ACTIVE）
  ipsExpired: boolean;                      // iPSが保管期限切れ
  cfStepKey: string | null;                 // 培養上清液現在ステップ（未申込ならnull）
  cfCompleted: boolean;                     // 培養上清液が完了（COMPLETED）
  cfExpired: boolean;                       // 培養上清液が保管期限切れ
  salesAmount: number;                      // 売上額（合計）
  createdAt: Date;
  lastProgressAt: Date | null;
};

type Props = {
  rows: MemberRow[];
  hrefPrefix: string;                       // 例: "/admin/members" | "/staff/members" | "/agency/customers"
  emptyMessage?: string;
};

function getIpsStepInfo(key: string) {
  return IPS_STEPS.find((s) => s.key === key);
}
function getCfStepInfo(key: string) {
  return CF_STEPS.find((s) => s.key === key);
}

export default function MembersTable({ rows, hrefPrefix, emptyMessage = "該当する会員が見つかりません" }: Props) {
  return (
    <>
      {/* モバイル: カードリスト */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((r) => {
          const ipsStep = getIpsStepInfo(r.ipsStepKey);
          const cfStep = r.cfStepKey ? getCfStepInfo(r.cfStepKey) : null;
          return (
            <div key={r.id} className="bg-bg-secondary border border-border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <Link
                  href={`${hrefPrefix}/${r.id}`}
                  className="font-mono text-[13px] text-gold hover:underline"
                >
                  {r.memberNumber || "---"}
                </Link>
                <span className="text-[11px] text-text-muted font-mono">
                  ¥{r.salesAmount.toLocaleString()}
                </span>
              </div>
              <Link
                href={`${hrefPrefix}/${r.id}`}
                className="block text-sm text-text-primary mb-1 hover:text-gold transition-colors"
              >
                {r.name}
              </Link>
              <div className="text-[10px] text-text-muted mb-3">{r.assignedName}</div>
              {ipsStep && (
                <div className="mb-3">
                  <StepBadge
                    icon={r.ipsExpired || r.ipsCompleted ? "🏛️" : ipsStep.icon}
                    label={
                      r.ipsExpired
                        ? "iPS細胞 保管切れ"
                        : r.ipsCompleted
                          ? "iPS細胞 保管中"
                          : ipsStep.label
                    }
                    actor={r.ipsExpired || r.ipsCompleted ? undefined : ipsStep.actor}
                    state={
                      r.ipsExpired ? "storage_expired" : r.ipsCompleted ? "storage" : undefined
                    }
                    sub={cfStep?.label ?? null}
                    subActor={r.cfExpired || r.cfCompleted ? undefined : cfStep?.actor}
                    subState={
                      r.cfExpired ? "storage_expired" : r.cfCompleted ? "completed" : undefined
                    }
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
                <ProgressDots
                  label="iPS"
                  steps={IPS_STEPS}
                  currentKey={r.ipsStepKey}
                  isCompleted={r.ipsCompleted}
                />
                {r.cfStepKey && (
                  <ProgressDots
                    label="培養上清液"
                    steps={CF_STEPS}
                    currentKey={r.cfStepKey}
                    isCompleted={r.cfCompleted}
                  />
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="py-12 text-center text-text-muted text-sm">{emptyMessage}</div>
        )}
      </div>

      {/* PC: テーブル（横スクロール + 会員番号/氏名/担当 左固定） */}
      <div className="hidden sm:block bg-bg-secondary border border-border rounded-md overflow-x-auto max-w-full">
        <table className="border-collapse" style={{ tableLayout: "fixed", width: "1470px" }}>
          <colgroup>
            <col style={{ width: "130px" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "420px" }} />
            <col style={{ width: "260px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "110px" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th
                className="sticky z-20 bg-bg-secondary px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap"
                style={{ left: 0 }}
              >
                会員番号
              </th>
              <th
                className="sticky z-20 bg-bg-secondary px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap"
                style={{ left: "130px" }}
              >
                氏名
              </th>
              <th
                className="sticky z-20 bg-bg-secondary px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap border-r border-border"
                style={{ left: "270px" }}
              >
                担当
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">現在のステップ</th>
              <th className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">進捗</th>
              <th className="px-5 py-3.5 text-right text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">売上額</th>
              <th className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">申込日</th>
              <th className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">最終進捗日</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const ipsStep = getIpsStepInfo(r.ipsStepKey);
              const cfStep = r.cfStepKey ? getCfStepInfo(r.cfStepKey) : null;
              return (
                <tr key={r.id} className="border-b border-border">
                  <td
                    className="sticky z-10 bg-bg-secondary px-5 py-3.5 font-mono text-[13px] text-gold whitespace-nowrap"
                    style={{ left: 0 }}
                  >
                    <Link href={`${hrefPrefix}/${r.id}`} className="hover:underline">
                      {r.memberNumber || "---"}
                    </Link>
                  </td>
                  <td
                    className="sticky z-10 bg-bg-secondary px-5 py-3.5 text-[13px] whitespace-nowrap"
                    style={{ left: "130px" }}
                  >
                    <Link href={`${hrefPrefix}/${r.id}`} className="hover:text-gold transition-colors">
                      {r.name}
                    </Link>
                  </td>
                  <td
                    className="sticky z-10 bg-bg-secondary px-5 py-3.5 text-[11px] text-text-muted whitespace-nowrap border-r border-border overflow-hidden text-ellipsis"
                    style={{ left: "270px" }}
                  >
                    {r.assignedName}
                  </td>
                  <td className="px-5 py-3.5">
                    {ipsStep && (
                      <StepBadge
                        icon={r.ipsExpired || r.ipsCompleted ? "🏛️" : ipsStep.icon}
                        label={
                          r.ipsExpired
                            ? "iPS細胞 保管切れ"
                            : r.ipsCompleted
                              ? "iPS細胞 保管中"
                              : ipsStep.label
                        }
                        actor={r.ipsExpired || r.ipsCompleted ? undefined : ipsStep.actor}
                        state={
                          r.ipsExpired ? "storage_expired" : r.ipsCompleted ? "storage" : undefined
                        }
                        sub={cfStep?.label ?? null}
                        subActor={r.cfExpired || r.cfCompleted ? undefined : cfStep?.actor}
                        subState={
                          r.cfExpired ? "storage_expired" : r.cfCompleted ? "storage" : undefined
                        }
                      />
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1">
                      <ProgressDots
                        label="iPS"
                        steps={IPS_STEPS}
                        currentKey={r.ipsStepKey}
                        isCompleted={r.ipsCompleted}
                      />
                      {r.cfStepKey && (
                        <ProgressDots
                          label="培養上清液"
                          steps={CF_STEPS}
                          currentKey={r.cfStepKey}
                          isCompleted={r.cfCompleted}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-[13px] text-text-primary font-mono whitespace-nowrap">
                    ¥{r.salesAmount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-text-muted font-mono whitespace-nowrap">
                    {r.createdAt.toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-text-muted font-mono whitespace-nowrap">
                    {r.lastProgressAt ? r.lastProgressAt.toLocaleDateString("ja-JP") : "---"}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-text-muted text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
