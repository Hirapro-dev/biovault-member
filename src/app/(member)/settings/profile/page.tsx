import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PasswordChangeForm from "./PasswordChangeForm";
import ProfileEditableFields from "./ProfileEditableFields";

export default async function ProfilePage() {
  const user = await requireAuth();

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { membership: true },
  });

  if (!fullUser) return null;

  return (
    <div className="max-w-[600px]">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/settings" className="hover:text-gold transition-colors">設定</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">プロフィール</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        プロフィール
      </h2>

      {/* 基本情報 */}
      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6 mb-5">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          基本情報
        </h3>

        {/* 変更不可フィールド */}
        <div className="space-y-0">
          <InfoRow label="ログインID" value={fullUser.loginId} mono />
          <InfoRow label="氏名" value={fullUser.name} />
          <InfoRow label="フリガナ" value={fullUser.nameKana || "---"} />
          <InfoRow label="会員番号" value={fullUser.membership?.memberNumber || "---"} mono />
          <InfoRow
            label="契約日"
            value={
              fullUser.membership
                ? new Date(fullUser.membership.contractDate).toLocaleDateString("ja-JP")
                : "---"
            }
          />
        </div>

        <p className="text-[10px] text-text-muted mt-3 mb-5 leading-relaxed">
          ※ ログインID・氏名・フリガナ・会員番号は変更できません
        </p>

        {/* 編集可能フィールド */}
        <ProfileEditableFields
          userId={fullUser.id}
          initialEmail={fullUser.email}
          initialPhone={fullUser.phone || ""}
          initialDateOfBirth={fullUser.dateOfBirth ? fullUser.dateOfBirth.toISOString().split("T")[0] : ""}
          initialAddress={fullUser.address || ""}
        />
      </div>

      {/* パスワード変更 */}
      <PasswordChangeForm mustChange={(user as any).mustChangePassword} />
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center py-3 border-b border-border last:border-b-0">
      <div className="w-28 sm:w-32 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className={`text-[13px] text-text-primary ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
