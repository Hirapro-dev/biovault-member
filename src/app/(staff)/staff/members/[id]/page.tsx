import { requireStaff } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import {
  IPS_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  TREATMENT_TYPE_LABELS,
} from "@/types";
import { notFound } from "next/navigation";
import AdminStatusTimeline from "@/app/(admin)/admin/members/[id]/AdminStatusTimeline";
import CultureFluidStatusManager from "@/app/(admin)/admin/members/[id]/CultureFluidStatusManager";
import DocumentManager from "@/app/(admin)/admin/members/[id]/DocumentManager";
import StatusTabs from "@/app/(admin)/admin/members/[id]/StatusTabs";
import Link from "next/link";

/**
 * 従業員側 会員カルテ（閲覧専用）
 *
 * 管理者ページ (/admin/members/[id]) と全く同じ UI だが、
 * 編集系コンポーネントには readOnly={true} を渡して操作不可にする。
 * IssueIdSection / MemberKarteActions / DeleteAccount は表示しない。
 *
 * 従業員は自分が担当する会員のみアクセス可能（referredByStaff === staffCode）。
 */
export default async function StaffMemberKartePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { staffCode } = await requireStaff();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      membership: {
        include: { treatments: { orderBy: { createdAt: "desc" } } },
      },
      documents: { orderBy: { createdAt: "asc" } },
      cultureFluidOrders: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  });

  // 担当外の会員アクセスは404扱い
  if (!user || user.role !== "MEMBER" || user.referredByStaff !== staffCode) {
    notFound();
  }

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

  const referralDisplay =
    [
      staffName ? `${staffName}（${user.referredByStaff}）` : (user.salesRepName || null),
      membership?.referrerName ? `代理店: ${membership.referrerName}` : null,
    ].filter(Boolean).join(" ／ ") || "---";

  return (
    <div>
      {/* パンくず & 閲覧モードバッジ */}
      <div className="flex items-center justify-between mb-5 sm:mb-7 flex-wrap gap-2">
        <Link href="/staff/members" className="text-[11px] text-text-muted hover:text-gold transition-colors">
          ← 担当顧客一覧に戻る
        </Link>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border">
          👁 閲覧モード
        </span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        会員カルテ
      </h2>

      {/* 基本情報 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">基本情報</h3>
          <InfoRow label="氏名" value={user.name} />
          <InfoRow label="フリガナ" value={user.nameKana || "---"} />
          <InfoRow label="ローマ字" value={user.nameRomaji || "---"} />
          <InfoRow label="ログインID" value={user.loginId} mono />
          <InfoRow label="メール" value={user.email} />
          <InfoRow label="電話" value={user.phone || "---"} />
          <InfoRow label="生年月日" value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("ja-JP") : "---"} />
          <InfoRow label="住所" value={user.address || "---"} />
        </div>

        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">契約情報</h3>
          <InfoRow label="会員番号" value={membership?.memberNumber || "---"} mono />
          <InfoRow label="プラン" value="基本パッケージ（880万円）" />
          <InfoRow label="契約日" value={membership ? new Date(membership.contractDate).toLocaleDateString("ja-JP") : "---"} />
          <InfoRow label="入金状況" value={membership ? PAYMENT_STATUS_LABELS[membership.paymentStatus] : "---"} />
          <InfoRow label="入金額" value={membership ? `¥${membership.paidAmount.toLocaleString()} / ¥${membership.totalAmount.toLocaleString()}` : "---"} mono />
          <InfoRow label="営業担当／代理店" value={referralDisplay} />
          <div className="flex items-center py-2 border-t border-border mt-1">
            <div className="w-24 text-[11px] text-text-muted shrink-0">重要事項同意</div>
            <div className="text-[13px]">
              {user.hasAgreedTerms ? (
                <span className="text-status-active">同意済 {user.agreedTermsAt && <span className="text-text-muted text-[11px] ml-1">({new Date(user.agreedTermsAt).toLocaleDateString("ja-JP")})</span>}</span>
              ) : (
                <span className="text-status-warning">未同意</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ステータス（タブ切り替え）— 閲覧専用 */}
      <StatusTabs
        hasCultureFluidOrders={user.cultureFluidOrders.length > 0}
        ipsTab={
          membership ? (
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
              readOnly={true}
            />
          ) : <div className="text-text-muted text-sm py-4 text-center">会員権情報なし</div>
        }
        cultureFluidTab={
          <CultureFluidStatusManager
            userId={user.id}
            orders={user.cultureFluidOrders.map(o => ({
              id: o.id,
              planType: o.planType,
              planLabel: o.planLabel,
              totalAmount: o.totalAmount,
              status: o.status,
              paymentStatus: o.paymentStatus,
              paidAt: o.paidAt ? o.paidAt.toISOString() : null,
              producedAt: o.producedAt ? o.producedAt.toISOString() : null,
              expiresAt: o.expiresAt ? o.expiresAt.toISOString() : null,
              clinicDate: o.clinicDate ? o.clinicDate.toISOString() : null,
              clinicName: o.clinicName,
              clinicAddress: o.clinicAddress,
              clinicPhone: o.clinicPhone,
              cautionAgreedAt: o.cautionAgreedAt ? o.cautionAgreedAt.toISOString() : null,
              informedAgreedAt: o.informedAgreedAt ? o.informedAgreedAt.toISOString() : null,
              completedAt: o.completedAt ? o.completedAt.toISOString() : null,
              completedSessions: o.completedSessions ?? 0,
              createdAt: o.createdAt.toISOString(),
            }))}
            readOnly={true}
          />
        }
      />

      {/* 申込情報・健康状態 */}
      {(user.occupation || user.paymentMethod || user.currentIllness !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
          <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
            <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">申込情報</h3>
            <InfoRow label="職業" value={user.occupation || "---"} />
            <InfoRow label="郵便番号" value={user.postalCode || "---"} />
            <InfoRow label="支払方法" value={user.paymentMethod === "bank_transfer" ? "銀行振込" : user.paymentMethod || "---"} />
            <InfoRow label="支払予定日" value={user.paymentDate ? new Date(user.paymentDate).toLocaleDateString("ja-JP") : "---"} />
            <InfoRow label="営業担当" value={user.referredByStaff ? `${staffName || user.salesRepName || "---"}（${user.referredByStaff}）` : user.salesRepName || "---"} />
          </div>
          <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
            <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">健康状態（事前確認）</h3>
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

      {/* 書類管理（閲覧専用・UPボタンなし） */}
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
        readOnly={true}
      />

      {/* 培養上清液投与記録 */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">培養上清液投与記録</h3>
        {membership?.treatments.length ? (
          membership.treatments.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
              <div>
                <div className="text-[13px]">{TREATMENT_TYPE_LABELS[t.type]}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{t.volume}cc・{t.clinicName || "---"}</div>
              </div>
              <div className="text-[11px] text-text-muted font-mono">
                {t.completedAt ? new Date(t.completedAt).toLocaleDateString("ja-JP") : t.scheduledAt ? `予定: ${new Date(t.scheduledAt).toLocaleDateString("ja-JP")}` : "---"}
              </div>
            </div>
          ))
        ) : (
          <div className="text-text-muted text-sm py-4 text-center">投与記録なし</div>
        )}
      </div>

      {/* 管理者メモ（従業員は社内なので表示） */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">管理者メモ</h3>
        {user.notes.length ? (
          user.notes.map((note) => (
            <div key={note.id} className="py-3 border-b border-border last:border-b-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-gold">{note.author}</span>
                <span className="text-[11px] text-text-muted font-mono">{new Date(note.createdAt).toLocaleDateString("ja-JP")}</span>
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
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">ステータス変更履歴</h3>
        {user.statusHistory.length ? (
          user.statusHistory.map((h) => (
            <div key={h.id} className="flex items-center gap-4 py-3 border-b border-border last:border-b-0">
              <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              <div className="flex-1">
                <span className="text-xs text-text-secondary">{IPS_STATUS_LABELS[h.fromStatus]}</span>
                <span className="text-xs text-gold mx-1.5">→</span>
                <span className="text-xs text-gold">{IPS_STATUS_LABELS[h.toStatus]}</span>
                {h.note && <span className="text-[11px] text-text-muted ml-2">({h.note})</span>}
              </div>
              <div className="text-[11px] text-text-muted font-mono">{new Date(h.changedAt).toLocaleDateString("ja-JP")}</div>
            </div>
          ))
        ) : (
          <div className="text-text-muted text-sm py-4 text-center">変更履歴なし</div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center py-2 border-b border-border last:border-b-0">
      <div className="w-24 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className={`text-[13px] text-text-primary ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function HealthRow({ label, has, detail }: { label: string; has: boolean; detail: string | null }) {
  return (
    <div className="flex items-start py-2 border-b border-border last:border-b-0">
      <div className="w-28 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className="text-xs">
        {has ? <span className="text-status-warning">あり{detail && `（${detail}）`}</span> : <span className="text-text-secondary">なし</span>}
      </div>
    </div>
  );
}
