import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ApplicationActions from "./ApplicationActions";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) notFound();

  const healthItems = [
    { label: "現在治療中の病気", has: app.currentIllness, detail: app.currentIllnessDetail },
    { label: "過去の病気・手術歴", has: app.pastIllness, detail: app.pastIllnessDetail },
    { label: "現在使用中の薬", has: app.currentMedication, detail: app.currentMedicationDetail },
    { label: "持病", has: app.chronicDisease, detail: app.chronicDiseaseDetail },
    { label: "感染症", has: app.infectiousDisease, detail: app.infectiousDiseaseDetail },
    { label: "妊娠中/可能性", has: app.pregnancy, detail: null },
    { label: "アレルギー", has: app.allergy, detail: app.allergyDetail },
    { label: "その他", has: app.otherHealth, detail: app.otherHealthDetail },
  ];

  return (
    <div>
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/admin/applications" className="hover:text-gold transition-colors">申込管理</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">申込詳細</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        申込詳細 — {app.name}
      </h2>

      {/* 申込者情報 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <Card title="申込者情報">
          <Row label="氏名" value={app.name} />
          <Row label="フリガナ" value={app.nameKana} />
          <Row label="生年月日" value={new Date(app.dateOfBirth).toLocaleDateString("ja-JP")} />
          <Row label="住所" value={`〒${app.postalCode || "---"} ${app.address}`} />
          <Row label="電話番号" value={app.phone} />
          <Row label="メール" value={app.email} />
          <Row label="職業" value={app.occupation || "---"} />
          <Row label="申込日" value={new Date(app.applicationDate).toLocaleDateString("ja-JP")} />
        </Card>

        <Card title="申込内容">
          <Row label="会員価格" value="¥8,800,000（税込）" />
          <Row label="支払方法" value={app.paymentMethod === "bank_transfer" ? "銀行振込" : app.paymentMethodOther || "その他"} />
          <Row label="支払予定日" value={app.paymentDate ? new Date(app.paymentDate).toLocaleDateString("ja-JP") : "---"} />
          <Row label="紹介者" value={app.referrerName || "---"} />
          <Row label="営業担当" value={app.salesRepName || "---"} />
        </Card>
      </div>

      {/* 健康状態 */}
      <Card title="事前確認事項（健康状態）" className="mb-5">
        {healthItems.map((item, i) => (
          <div key={i} className="flex items-start py-2.5 border-b border-border last:border-b-0">
            <div className="w-40 text-xs text-text-muted shrink-0">{item.label}</div>
            <div className="text-xs">
              {item.has ? (
                <span className="text-status-warning">
                  あり{item.detail && `（${item.detail}）`}
                </span>
              ) : (
                <span className="text-text-secondary">なし</span>
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* 確認事項 */}
      <Card title="確認事項・受領文書" className="mb-5">
        <CheckRow checked={app.confirmNotMedical} label="医療行為でないことの確認" />
        <CheckRow checked={app.confirmScppRole} label="SCPP の役割確認" />
        <CheckRow checked={app.confirmClinicRole} label="提携医療機関の役割確認" />
        <CheckRow checked={app.confirmLabRole} label="提携先機関の役割確認" />
        <CheckRow checked={app.confirmDocuments} label="関連文書の確認" />
        <div className="border-t border-border mt-3 pt-3">
          <CheckRow checked={app.receivedContract} label="会員契約書" />
          <CheckRow checked={app.receivedTerms} label="会員規約" />
          <CheckRow checked={app.receivedImportant} label="重要事項説明書" />
          <CheckRow checked={app.receivedMedicalCheck} label="医師問診確認書" />
          <CheckRow checked={app.receivedPrivacy} label="個人情報同意書" />
          <CheckRow checked={app.receivedCellStorage} label="細胞保管同意書" />
          <CheckRow checked={app.receivedIpsConsent} label="iPS細胞説明書" />
        </div>
      </Card>

      {/* アクション（ステータス変更・会員登録） */}
      <ApplicationActions
        applicationId={app.id}
        status={app.status}
        nameKana={app.nameKana}
        convertedUserId={app.convertedUserId}
        adminNote={app.adminNote}
      />
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-bg-secondary border border-border rounded-md p-4 sm:p-6 ${className}`}>
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-2 border-b border-border last:border-b-0">
      <div className="w-24 sm:w-28 text-xs text-text-muted shrink-0">{label}</div>
      <div className="text-xs text-text-primary">{value}</div>
    </div>
  );
}

function CheckRow({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className={`text-xs ${checked ? "text-status-active" : "text-text-muted"}`}>
        {checked ? "✓" : "—"}
      </span>
      <span className={`text-xs ${checked ? "text-text-primary" : "text-text-muted"}`}>{label}</span>
    </div>
  );
}
