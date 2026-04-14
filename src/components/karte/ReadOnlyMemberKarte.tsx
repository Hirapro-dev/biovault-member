/**
 * 閲覧専用 会員カルテビュー
 *
 * 従業員・代理店ダッシュボードから会員カルテを「閲覧のみ」で表示するための
 * 共通コンポーネント。管理者用カルテ（/admin/members/[id]）と異なり、
 * 編集系コンポーネント（AdminStatusTimeline / CultureFluidStatusManager /
 * DocumentManager / MemberKarteActions / IssueIdSection / DeleteAccount）は
 * 一切インポートせず、純粋な表示要素のみで構成する。
 *
 * Server Component として、呼び出し側で取得した user オブジェクトを props で受け取る。
 *
 * showAdminNotes prop で管理者メモの表示を切り替え（従業員=true, 代理店=false）。
 */
import {
  IPS_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  TREATMENT_TYPE_LABELS,
  type DocumentType,
  type IpsStatus,
  type PaymentStatus,
  type TreatmentType,
  type DocumentStatus,
} from "@/types";
import DocumentModal from "@/app/(member)/mypage/DocumentModal";

// CultureFluidOrder のステータス → 表示ラベル
const CF_STATUS_LABELS: Record<string, string> = {
  APPLIED: "申込済",
  PAYMENT_CONFIRMED: "入金確認済",
  PRODUCING: "精製中",
  CLINIC_BOOKING: "クリニック予約手配中",
  INFORMED_AGREED: "事前説明同意済",
  RESERVATION_CONFIRMED: "予約確定",
  COMPLETED: "施術完了",
};

// 管理者ページと同じ13ステップのタイムライン定義
// docType / dbStatus / dateField を持たせて表示判定に利用
type TimelineStep = {
  key: string;
  label: string;
  icon: string;
  // 完了判定に使う Document タイプ（書類同意系のみ）
  docType?: DocumentType;
  // 完了判定に使う IpsStatus（DBステータス系のみ）
  dbStatus?: IpsStatus;
};

const TIMELINE_STEPS: TimelineStep[] = [
  { key: "TERMS_AGREED", label: "iPS細胞作製適合確認", icon: "📋", dbStatus: "TERMS_AGREED" },
  { key: "REGISTERED", label: "メンバーシップ会員ID発行", icon: "🔑" }, // isIdIssued で判定
  { key: "DOC_PRIVACY", label: "重要事項確認／個人情報取扱同意", icon: "📜", docType: "PRIVACY_POLICY" },
  { key: "SERVICE_APPLIED", label: "iPSサービス利用申込", icon: "✍️", dbStatus: "SERVICE_APPLIED" },
  { key: "CONTRACT_SIGNING", label: "iPSサービス利用契約書署名", icon: "📝" }, // contractSignedAt で判定
  { key: "PAYMENT_CONFIRMED", label: "iPSサービス利用契約締結・入金確認", icon: "💰" }, // paymentStatus で判定
  { key: "SCHEDULE_ARRANGED", label: "iPS細胞作製におけるクリニックの日程調整", icon: "📅", dbStatus: "SCHEDULE_ARRANGED" },
  { key: "DOC_CELL_CONSENT", label: "細胞提供・保管同意", icon: "🧫", docType: "CELL_STORAGE_CONSENT" },
  { key: "CLINIC_CONFIRMED", label: "日程確定", icon: "🏥" }, // clinicDate で判定
  { key: "DOC_INFORMED", label: "iPS細胞作製における事前説明・同意", icon: "📄", docType: "INFORMED_CONSENT" },
  { key: "BLOOD_COLLECTED", label: "問診・採血", icon: "💉", dbStatus: "BLOOD_COLLECTED" },
  { key: "IPS_CREATING", label: "iPS細胞作製中", icon: "🧬", dbStatus: "IPS_CREATING" },
  { key: "STORAGE_ACTIVE", label: "iPS細胞保管", icon: "🏛️", dbStatus: "STORAGE_ACTIVE" },
];

// IpsStatus の進行順（インデックスで前後比較する）
const IPS_STATUS_ORDER: IpsStatus[] = [
  "REGISTERED",
  "TERMS_AGREED",
  "SERVICE_APPLIED",
  "SCHEDULE_ARRANGED",
  "BLOOD_COLLECTED",
  "IPS_CREATING",
  "STORAGE_ACTIVE",
];

// 書類型 → 閲覧ページパス（DocumentModal の pageUrl に渡す）
const DOC_VIEW_LINKS: Record<string, string> = {
  CONTRACT: "/documents/important-notice",
  PRIVACY_POLICY: "/documents/privacy-consent",
  SERVICE_TERMS: "/documents/service-terms",
  CONSENT_CELL_STORAGE: "/documents/contract",
  CELL_STORAGE_CONSENT: "/documents/cell-consent",
  INFORMED_CONSENT: "/mypage/informed-consent",
};

// 必要最小限の型定義（呼び出し側はこの型に合わせて user を整形する）
type DocumentLite = {
  id: string;
  type: DocumentType;
  title: string;
  status: DocumentStatus;
  fileUrl: string | null;
  signedAt: Date | null;
};

type TreatmentLite = {
  id: string;
  type: TreatmentType;
  volume: number;
  clinicName: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
};

type MembershipLite = {
  memberNumber: string;
  ipsStatus: IpsStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  totalAmount: number;
  contractDate: Date;
  contractSignedAt: Date | null;
  clinicDate: Date | null;
  clinicName: string | null;
  clinicAddress: string | null;
  ipsCompletedAt: Date | null;
  storageStartAt: Date | null;
  deathWish: string | null;
  referrerName: string | null;
  treatments: TreatmentLite[];
};

type CultureFluidOrderLite = {
  id: string;
  planLabel: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paidAt: Date | null;
  producedAt: Date | null;
  expiresAt: Date | null;
  clinicDate: Date | null;
  clinicName: string | null;
  clinicAddress: string | null;
  completedAt: Date | null;
  completedSessions: number;
  createdAt: Date;
};

type NoteLite = {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
};

type StatusHistoryLite = {
  id: string;
  fromStatus: IpsStatus;
  toStatus: IpsStatus;
  note: string | null;
  changedAt: Date;
};

export type ReadOnlyKarteUser = {
  id: string;
  name: string;
  nameKana: string | null;
  nameRomaji: string | null;
  loginId: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  postalCode: string | null;
  occupation: string | null;
  paymentMethod: string | null;
  paymentDate: Date | null;
  hasAgreedTerms: boolean;
  agreedTermsAt: Date | null;
  isIdIssued: boolean;
  salesRepName: string | null;
  referredByStaff: string | null;
  // 健康状態
  currentIllness: boolean;
  currentIllnessDetail: string | null;
  pastIllness: boolean;
  pastIllnessDetail: string | null;
  currentMedication: boolean;
  currentMedicationDetail: string | null;
  chronicDisease: boolean;
  chronicDiseaseDetail: string | null;
  infectiousDisease: boolean;
  infectiousDiseaseDetail: string | null;
  pregnancy: boolean;
  allergy: boolean;
  allergyDetail: string | null;
  otherHealth: boolean;
  otherHealthDetail: string | null;
  // 関連
  membership: MembershipLite | null;
  documents: DocumentLite[];
  cultureFluidOrders: CultureFluidOrderLite[];
  notes: NoteLite[];
  statusHistory: StatusHistoryLite[];
};

const formatDate = (d: Date | string | null) => {
  if (!d) return "---";
  return new Date(d).toLocaleDateString("ja-JP");
};

export default function ReadOnlyMemberKarte({
  user,
  staffName = null,
  showAdminNotes = false,
  backHref,
  backLabel = "← 一覧に戻る",
}: {
  user: ReadOnlyKarteUser;
  staffName?: string | null;
  showAdminNotes?: boolean;
  backHref: string;
  backLabel?: string;
}) {
  const membership = user.membership;

  // 担当の統合表示
  const referralDisplay =
    [
      staffName ? `${staffName}（${user.referredByStaff}）` : (user.salesRepName || null),
      membership?.referrerName ? `代理店: ${membership.referrerName}` : null,
    ]
      .filter(Boolean)
      .join(" ／ ") || "---";

  // 署名済み書類タイプの集合
  const signedDocTypes = new Set(
    user.documents.filter((d) => d.status === "SIGNED").map((d) => d.type)
  );

  // 死亡時意思表示（CELL_STORAGE_CONSENT モーダルに渡す）
  const deathWish = (membership?.deathWish ?? null) as "donate" | "dispose" | null;

  // 各タイムラインステップの完了判定と日付取得
  const currentIpsIdx = membership ? IPS_STATUS_ORDER.indexOf(membership.ipsStatus) : -1;

  const isStepDone = (step: TimelineStep): boolean => {
    if (step.key === "REGISTERED") return user.isIdIssued;
    if (step.key === "DOC_PRIVACY")
      return signedDocTypes.has("PRIVACY_POLICY") || user.hasAgreedTerms;
    if (step.key === "CONTRACT_SIGNING") return !!membership?.contractSignedAt;
    if (step.key === "PAYMENT_CONFIRMED") return membership?.paymentStatus === "COMPLETED";
    if (step.key === "DOC_CELL_CONSENT") return signedDocTypes.has("CELL_STORAGE_CONSENT");
    if (step.key === "CLINIC_CONFIRMED") return !!membership?.clinicDate;
    if (step.key === "DOC_INFORMED") return signedDocTypes.has("INFORMED_CONSENT");
    if (step.dbStatus) {
      const idx = IPS_STATUS_ORDER.indexOf(step.dbStatus);
      return idx !== -1 && currentIpsIdx >= idx;
    }
    return false;
  };

  // dbStatus 系のステップの日付を StatusHistory から探すヘルパー
  const findHistoryDate = (toStatus: IpsStatus): Date | null => {
    const history = user.statusHistory
      .filter((h) => h.toStatus === toStatus)
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())[0];
    return history?.changedAt ?? null;
  };

  const getStepDate = (step: TimelineStep): Date | null => {
    // 書類同意系: 該当 Document の signedAt
    if (step.docType) {
      const doc = user.documents.find(
        (d) => d.type === step.docType && d.status === "SIGNED"
      );
      return doc?.signedAt ?? null;
    }
    // 個別フィールドベースの判定
    if (step.key === "REGISTERED") {
      // ID発行日は記録されていないので membership.contractDate でフォールバック
      return membership?.contractDate ?? null;
    }
    if (step.key === "TERMS_AGREED") {
      return user.agreedTermsAt ?? findHistoryDate("TERMS_AGREED");
    }
    if (step.key === "CONTRACT_SIGNING") return membership?.contractSignedAt ?? null;
    if (step.key === "PAYMENT_CONFIRMED") {
      // 入金日の正確なフィールドが無いため契約署名日でフォールバック
      return membership?.paymentStatus === "COMPLETED"
        ? membership?.contractSignedAt ?? null
        : null;
    }
    if (step.key === "CLINIC_CONFIRMED") return membership?.clinicDate ?? null;
    if (step.key === "STORAGE_ACTIVE") {
      return membership?.storageStartAt ?? findHistoryDate("STORAGE_ACTIVE");
    }
    if (step.key === "IPS_CREATING") {
      return membership?.ipsCompletedAt ?? findHistoryDate("IPS_CREATING");
    }
    if (step.key === "BLOOD_COLLECTED") return findHistoryDate("BLOOD_COLLECTED");
    // その他のステータス遷移系: StatusHistory から該当 toStatus の最新を探す
    if (step.dbStatus) return findHistoryDate(step.dbStatus);
    return null;
  };

  return (
    <div>
      {/* パンくず & 閲覧モードバッジ */}
      <div className="flex items-center justify-between mb-5 sm:mb-7 flex-wrap gap-2">
        <a href={backHref} className="text-[11px] text-text-muted hover:text-gold transition-colors">
          {backLabel}
        </a>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border">
          👁 閲覧モード
        </span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        会員カルテ
      </h2>

      {/* 基本情報・契約情報 */}
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
          <InfoRow label="生年月日" value={formatDate(user.dateOfBirth)} />
          <InfoRow label="住所" value={user.address || "---"} />
        </div>

        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
            契約情報
          </h3>
          <InfoRow label="会員番号" value={membership?.memberNumber || "---"} mono />
          <InfoRow label="プラン" value="基本パッケージ(880万円)" />
          <InfoRow label="契約日" value={membership ? formatDate(membership.contractDate) : "---"} />
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
          <InfoRow label="担当" value={referralDisplay} />
          <div className="flex items-center py-2 border-t border-border mt-1">
            <div className="w-24 text-[11px] text-text-muted shrink-0">重要事項同意</div>
            <div className="text-[13px]">
              {user.hasAgreedTerms ? (
                <span className="text-status-active">
                  同意済
                  {user.agreedTermsAt && (
                    <span className="text-text-muted text-[11px] ml-1">
                      ({formatDate(user.agreedTermsAt)})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-status-warning">未同意</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* iPS作製・保管 ステータスタイムライン（線で繋ぐ・日付・書類リンク付き） */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-5 sm:mb-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          iPS作製・保管 ステータス
        </h3>
        <div className="relative">
          {TIMELINE_STEPS.map((step, i) => {
            const done = isStepDone(step);
            const isLast = i === TIMELINE_STEPS.length - 1;
            const nextDone = !isLast && isStepDone(TIMELINE_STEPS[i + 1]);
            const stepDate = getStepDate(step);
            const docLink = step.docType ? DOC_VIEW_LINKS[step.docType] : null;
            const linkedDoc = step.docType
              ? user.documents.find((d) => d.type === step.docType && d.status === "SIGNED")
              : null;

            return (
              <div
                key={step.key}
                className={`flex items-start gap-4 relative ${isLast ? "" : "pb-5"}`}
              >
                {/* 縦線（次のステップとの接続） */}
                {!isLast && (
                  <div
                    className="absolute left-[15px] top-[32px] bottom-0 w-[2px] z-[1]"
                    style={{
                      background:
                        done && nextDone
                          ? "var(--color-gold-primary)"
                          : done && !nextDone
                          ? "linear-gradient(to bottom, var(--color-gold-primary), var(--color-border))"
                          : "var(--color-border)",
                    }}
                  />
                )}
                {/* ステップノード（円形） */}
                <div
                  className={`relative z-[2] w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 text-sm transition-all ${
                    done
                      ? "text-bg-primary font-bold"
                      : "border border-border text-text-muted"
                  }`}
                  style={{
                    background: done
                      ? "linear-gradient(135deg, var(--color-gold-primary), var(--color-gold-light))"
                      : "var(--color-bg-elevated)",
                  }}
                >
                  {done ? "✓" : step.icon}
                </div>
                {/* ラベル & 日付 & 書類リンク */}
                <div className="pt-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 書類同意系で同意済みなら DocumentModal でリンク表示 */}
                    {done && docLink && linkedDoc ? (
                      <DocumentModal
                        label={step.label}
                        pdfUrl={linkedDoc.fileUrl}
                        pageUrl={docLink}
                        done={true}
                        deathWish={
                          step.docType === "CELL_STORAGE_CONSENT" ? deathWish : null
                        }
                      />
                    ) : (
                      <span
                        className={`text-[13px] sm:text-sm ${
                          done ? "text-gold" : "text-text-muted"
                        }`}
                      >
                        {step.label}
                      </span>
                    )}
                  </div>
                  {/* 完了日表示 */}
                  {done && stepDate && (
                    <div className="text-[10px] text-text-muted font-mono mt-0.5">
                      {formatDate(stepDate)}
                    </div>
                  )}
                  {/* 日程確定ステップではクリニック情報も表示 */}
                  {step.key === "CLINIC_CONFIRMED" && done && membership?.clinicName && (
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {membership.clinicName}
                      {membership.clinicAddress && ` ／ ${membership.clinicAddress}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* iPS培養上清液 注文一覧（読み取り専用） */}
      {user.cultureFluidOrders.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-5 sm:mb-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
            iPS培養上清液 注文
          </h3>
          <div className="space-y-3">
            {user.cultureFluidOrders.map((o) => (
              <div key={o.id} className="bg-bg-elevated border border-border rounded-md p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm text-text-primary font-medium">{o.planLabel}</span>
                  <span className="text-sm text-gold font-mono">¥{o.totalAmount.toLocaleString()}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">
                    {CF_STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mt-2">
                  <DataCell label="購入日" value={formatDate(o.createdAt)} />
                  {o.paidAt && <DataCell label="入金日" value={formatDate(o.paidAt)} />}
                  {o.producedAt && <DataCell label="精製完了日" value={formatDate(o.producedAt)} />}
                  {o.expiresAt && <DataCell label="管理期限" value={formatDate(o.expiresAt)} />}
                  {o.clinicDate && <DataCell label="施術予定日" value={formatDate(o.clinicDate)} />}
                  {o.clinicName && <DataCell label="クリニック" value={o.clinicName} />}
                  {o.completedAt && <DataCell label="施術完了日" value={formatDate(o.completedAt)} />}
                  {o.completedSessions > 0 && (
                    <DataCell label="完了回数" value={`${o.completedSessions}回`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 申込情報・健康状態 */}
      {(user.occupation || user.paymentMethod || user.currentIllness !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
          <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
            <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
              申込情報
            </h3>
            <InfoRow label="職業" value={user.occupation || "---"} />
            <InfoRow label="郵便番号" value={user.postalCode || "---"} />
            <InfoRow
              label="支払方法"
              value={user.paymentMethod === "bank_transfer" ? "銀行振込" : user.paymentMethod || "---"}
            />
            <InfoRow label="支払予定日" value={formatDate(user.paymentDate)} />
            <InfoRow
              label="担当"
              value={
                user.referredByStaff
                  ? `${staffName || user.salesRepName || "---"}（${user.referredByStaff}）`
                  : user.salesRepName || "---"
              }
            />
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

      {/* 契約・同意書類一覧（同意済みのものはモーダルでリンク表示） */}
      {user.documents.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-5 sm:mb-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
            契約・同意書類
          </h3>
          <div className="space-y-2">
            {user.documents
              .filter((d) => d.type !== "SIMPLE_AGREEMENT")
              .map((doc) => {
                const label = DOCUMENT_TYPE_LABELS[doc.type] || doc.title;
                const viewLink = DOC_VIEW_LINKS[doc.type];
                const isSigned = doc.status === "SIGNED";
                const canOpenModal = isSigned && (!!doc.fileUrl || !!viewLink);

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 rounded bg-bg-elevated border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-text-primary">{label}</div>
                      {doc.signedAt && (
                        <div className="text-[10px] text-text-muted mt-0.5">
                          同意日: {formatDate(doc.signedAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          isSigned
                            ? "bg-status-active/15 text-status-active border border-status-active/30"
                            : doc.status === "SENT"
                            ? "bg-status-warning/15 text-status-warning border border-status-warning/30"
                            : "bg-bg-elevated text-text-muted border border-border"
                        }`}
                      >
                        {isSigned ? "同意済" : doc.status === "SENT" ? "送付済" : "未同意"}
                      </span>
                      {canOpenModal && (
                        <DocumentModal
                          label={label}
                          pdfUrl={doc.fileUrl}
                          pageUrl={viewLink || ""}
                          done={true}
                          triggerLabel={doc.fileUrl ? "PDF を見る" : "内容を確認"}
                          variant="button"
                          deathWish={doc.type === "CELL_STORAGE_CONSENT" ? deathWish : null}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 培養上清液投与記録 */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-5 sm:mb-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          培養上清液投与記録
        </h3>
        {membership?.treatments && membership.treatments.length > 0 ? (
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
                  ? formatDate(t.completedAt)
                  : t.scheduledAt
                  ? `予定: ${formatDate(t.scheduledAt)}`
                  : "---"}
              </div>
            </div>
          ))
        ) : (
          <div className="text-text-muted text-sm py-4 text-center">投与記録なし</div>
        )}
      </div>

      {/* 管理者メモ（従業員のみ表示） */}
      {showAdminNotes && (
        <div className="bg-bg-secondary border border-border rounded-md p-6 mb-5 sm:mb-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
            管理者メモ
          </h3>
          {user.notes.length > 0 ? (
            user.notes.map((note) => (
              <div key={note.id} className="py-3 border-b border-border last:border-b-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-gold">{note.author}</span>
                  <span className="text-[11px] text-text-muted font-mono">{formatDate(note.createdAt)}</span>
                </div>
                <p className="text-[13px] text-text-primary leading-relaxed">{note.content}</p>
              </div>
            ))
          ) : (
            <div className="text-text-muted text-sm py-4 text-center">メモなし</div>
          )}
        </div>
      )}

      {/* ステータス変更履歴 */}
      <div className="bg-bg-secondary border border-border rounded-md p-6 mb-5 sm:mb-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          ステータス変更履歴
        </h3>
        {user.statusHistory.length > 0 ? (
          user.statusHistory.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-4 py-3 border-b border-border last:border-b-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              <div className="flex-1">
                <span className="text-xs text-text-secondary">{IPS_STATUS_LABELS[h.fromStatus]}</span>
                <span className="text-xs text-gold mx-1.5">→</span>
                <span className="text-xs text-gold">{IPS_STATUS_LABELS[h.toStatus]}</span>
                {h.note && <span className="text-[11px] text-text-muted ml-2">({h.note})</span>}
              </div>
              <div className="text-[11px] text-text-muted font-mono">{formatDate(h.changedAt)}</div>
            </div>
          ))
        ) : (
          <div className="text-text-muted text-sm py-4 text-center">変更履歴なし</div>
        )}
      </div>
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
      <div className={`text-[13px] text-text-primary ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function HealthRow({
  label,
  has,
  detail,
}: {
  label: string;
  has: boolean;
  detail: string | null;
}) {
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

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-text-muted mb-0.5">{label}</div>
      <div className="text-text-secondary font-mono">{value}</div>
    </div>
  );
}
