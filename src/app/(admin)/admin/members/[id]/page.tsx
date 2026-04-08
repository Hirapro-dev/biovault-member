import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Badge from "@/components/ui/Badge";
import {
  IPS_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  TREATMENT_TYPE_LABELS,
} from "@/types";
import { notFound } from "next/navigation";
import DocumentManager from "./DocumentManager";
import MemberKarteActions from "./MemberKarteActions";
import AdminStatusTimeline from "./AdminStatusTimeline";
import IssueIdSection from "./IssueIdSection";
import DeleteAccount from "./DeleteAccount";

export default async function MemberKartePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      membership: {
        include: { treatments: { orderBy: { createdAt: "desc" } } },
      },
      documents: { orderBy: { createdAt: "asc" } },
      notes: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
      accessLogs: { orderBy: { accessedAt: "desc" }, take: 20 },
    },
  });

  if (!user) notFound();

  const membership = user.membership;

  // 担当従業員名を解決
  let staffName: string | null = null;
  if (user.referredByStaff) {
    const staffRecord = await prisma.staff.findUnique({
      where: { staffCode: user.referredByStaff },
      select: { name: true },
    });
    staffName = staffRecord?.name || null;
  }

  // 営業担当／代理店の統合表示
  const referralDisplay = [
    staffName ? `${staffName}（${user.referredByStaff}）` : (user.salesRepName || null),
    membership?.referrerName ? `代理店: ${membership.referrerName}` : null,
  ].filter(Boolean).join(" ／ ") || "---";

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        会員カルテ
      </h2>

      {/* 基本情報 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
            基本情報
          </h3>
          <InfoRow label="氏名" value={user.name} />
          <InfoRow label="フリガナ" value={user.nameKana || "---"} />
          <InfoRow label="ローマ字" value={user.nameRomaji || "---"} />
          <InfoRow label="ログインID" value={user.loginId} mono />
          <InfoRow label="メール" value={user.email} />
          <InfoRow label="電話" value={user.phone || "---"} />
          <InfoRow
            label="生年月日"
            value={
              user.dateOfBirth
                ? new Date(user.dateOfBirth).toLocaleDateString("ja-JP")
                : "---"
            }
          />
          <InfoRow label="住所" value={user.address || "---"} />
        </div>

        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
            契約情報
          </h3>
          <InfoRow label="会員番号" value={membership?.memberNumber || "---"} mono />
          <InfoRow label="プラン" value="基本パッケージ（880万円）" />
          <InfoRow
            label="契約日"
            value={
              membership
                ? new Date(membership.contractDate).toLocaleDateString("ja-JP")
                : "---"
            }
          />
          <InfoRow
            label="入金状況"
            value={membership ? PAYMENT_STATUS_LABELS[membership.paymentStatus] : "---"}
          />
          <InfoRow
            label="入金額"
            value={
              membership
                ? `¥${membership.paidAmount.toLocaleString()} / ¥${membership.totalAmount.toLocaleString()}`
                : "---"
            }
            mono
          />
          <InfoRow label="営業担当／代理店" value={referralDisplay} />
          <div className="flex items-center py-2 border-t border-border mt-1">
            <div className="w-24 text-[11px] text-text-muted shrink-0">重要事項同意</div>
            <div className="text-[13px]">
              {user.hasAgreedTerms ? (
                <span className="text-status-active">
                  同意済 {user.agreedTermsAt && <span className="text-text-muted text-[11px] ml-1">({new Date(user.agreedTermsAt).toLocaleDateString("ja-JP")})</span>}
                </span>
              ) : (
                <span className="text-status-warning">未同意</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* アカウント情報（ID発行・PW変更） */}
      <IssueIdSection
        userId={user.id}
        currentLoginId={user.loginId}
        nameKana={user.nameKana || ""}
        isIdIssued={user.isIdIssued}
      />

      {/* iPSステータス（チェックボックス式） */}
      <div className="mb-6">
        <h3 className="font-serif-jp text-sm font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
          iPS 細胞ステータス
        </h3>
        {membership && (
          <AdminStatusTimeline
            userId={user.id}
            currentStatus={membership.ipsStatus}
            paymentStatus={membership.paymentStatus}
            signedDocTypes={user.documents.filter(d => d.status === "SIGNED").map(d => d.type)}
            hasAgreedTerms={user.hasAgreedTerms}
            isIdIssued={user.isIdIssued}
            currentLoginId={user.loginId}
            nameKana={user.nameKana || ""}
            clinicDate={membership.clinicDate ? membership.clinicDate.toISOString() : null}
            clinicName={membership.clinicName || null}
            clinicAddress={membership.clinicAddress || null}
            contractSignedAt={membership.contractSignedAt ? membership.contractSignedAt.toISOString() : null}
          />
        )}
      </div>

      {/* 申込情報・健康状態 */}
      {(user.occupation || user.paymentMethod || user.currentIllness !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
          <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
            <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
              申込情報
            </h3>
            <InfoRow label="職業" value={user.occupation || "---"} />
            <InfoRow label="郵便番号" value={user.postalCode || "---"} />
            <InfoRow label="支払方法" value={user.paymentMethod === "bank_transfer" ? "銀行振込" : user.paymentMethod || "---"} />
            <InfoRow label="支払予定日" value={user.paymentDate ? new Date(user.paymentDate).toLocaleDateString("ja-JP") : "---"} />
            <InfoRow label="営業担当" value={
              user.referredByStaff
                ? `${staffName || user.salesRepName || "---"}（${user.referredByStaff}）`
                : user.salesRepName || "---"
            } />
          </div>

          <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
            <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
              健康状態（事前確認）
            </h3>
            <HealthRow label="治療中の病気" has={user.currentIllness} detail={user.currentIllnessDetail} />
            <HealthRow label="病気・手術歴" has={user.pastIllness} detail={user.pastIllnessDetail} />
            <HealthRow label="使用中の薬" has={user.currentMedication} detail={user.currentMedicationDetail} />
            <HealthRow label="持病" has={user.chronicDisease} detail={user.chronicDiseaseDetail} />
            <HealthRow label="感染症" has={user.infectiousDisease} detail={user.infectiousDiseaseDetail} />
            <HealthRow label="妊娠中/可能性" has={user.pregnancy} detail={null} />
            <HealthRow label="アレルギー" has={user.allergy} detail={user.allergyDetail} />
            <HealthRow label="その他" has={user.otherHealth} detail={user.otherHealthDetail} />
          </div>
        </div>
      )}

      {/* メモ追加 */}
      <MemberKarteActions userId={user.id} />

      {/* 書類管理 */}
      <DocumentManager
        userId={user.id}
        documents={user.documents.map((doc) => ({
          id: doc.id,
          type: doc.type,
          title: doc.title,
          status: doc.status,
          fileUrl: doc.fileUrl,
          signedAt: doc.signedAt ? doc.signedAt.toISOString() : null,
        }))}
      />

      {/* 培養上清液投与記録 */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          培養上清液投与記録
        </h3>
        {membership?.treatments.length ? (
          membership.treatments.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
            >
              <div>
                <div className="text-[13px]">{TREATMENT_TYPE_LABELS[t.type]}</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {t.volume}cc・{t.clinicName || "---"}
                </div>
              </div>
              <div className="text-[11px] text-text-muted font-mono">
                {t.completedAt
                  ? new Date(t.completedAt).toLocaleDateString("ja-JP")
                  : t.scheduledAt
                  ? `予定: ${new Date(t.scheduledAt).toLocaleDateString("ja-JP")}`
                  : "---"}
              </div>
            </div>
          ))
        ) : (
          <div className="text-text-muted text-sm py-4 text-center">投与記録なし</div>
        )}
      </div>

      {/* 管理者メモ */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          管理者メモ
        </h3>
        {user.notes.length ? (
          user.notes.map((note) => (
            <div
              key={note.id}
              className="py-3 border-b border-border last:border-b-0"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-gold">{note.author}</span>
                <span className="text-[11px] text-text-muted font-mono">
                  {new Date(note.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
              <p className="text-[13px] text-text-primary leading-relaxed">{note.content}</p>
            </div>
          ))
        ) : (
          <div className="text-text-muted text-sm py-4 text-center">メモなし</div>
        )}
      </div>

      {/* ステータス変更履歴 */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          ステータス変更履歴
        </h3>
        {user.statusHistory.length ? (
          user.statusHistory.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-4 py-3 border-b border-border last:border-b-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              <div className="flex-1">
                <span className="text-xs text-text-secondary">
                  {IPS_STATUS_LABELS[h.fromStatus]}
                </span>
                <span className="text-xs text-gold mx-1.5">→</span>
                <span className="text-xs text-gold">{IPS_STATUS_LABELS[h.toStatus]}</span>
                {h.note && (
                  <span className="text-[11px] text-text-muted ml-2">({h.note})</span>
                )}
              </div>
              <div className="text-[11px] text-text-muted font-mono">
                {new Date(h.changedAt).toLocaleDateString("ja-JP")}
              </div>
            </div>
          ))
        ) : (
          <div className="text-text-muted text-sm py-4 text-center">変更履歴なし</div>
        )}
      </div>

      {/* アクセスログ */}
      <div className="mb-6">
        <h3 className="font-serif-jp text-sm font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
          アクセスログ（直近20件）
        </h3>
        {user.accessLogs.length === 0 ? (
          <div className="bg-bg-secondary border border-border rounded-md p-6 text-center text-text-muted text-xs">
            アクセス履歴はありません
          </div>
        ) : (
          <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
            {user.accessLogs.map((log, i) => (
              <div key={log.id} className={`flex items-center gap-4 px-5 py-3 ${i < user.accessLogs.length - 1 ? "border-b border-border" : ""}`}>
                <div className="text-[11px] text-text-muted font-mono whitespace-nowrap w-28 shrink-0">
                  {new Date(log.accessedAt).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-text-primary">{log.pageTitle || "---"}</div>
                  <div className="text-[10px] text-text-muted font-mono truncate">{log.path}</div>
                </div>
                <div className="text-[10px] text-text-muted font-mono shrink-0">{log.ipAddress || ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アカウント削除 */}
      <DeleteAccount userId={user.id} loginId={user.loginId} />
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center py-2 border-b border-border last:border-b-0">
      <div className="w-24 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className={`text-[13px] text-text-primary ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function HealthRow({ label, has, detail }: { label: string; has: boolean; detail: string | null }) {
  return (
    <div className="flex items-start py-2 border-b border-border last:border-b-0">
      <div className="w-28 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className="text-xs">
        {has ? (
          <span className="text-status-warning">あり{detail && `（${detail}）`}</span>
        ) : (
          <span className="text-text-secondary">なし</span>
        )}
      </div>
    </div>
  );
}
