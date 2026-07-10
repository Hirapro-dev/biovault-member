import { requireAffiliate } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { affiliateLpUrl } from "@/lib/affiliate";
import {
  AFFILIATE_CHANNEL_LABELS,
  AFFILIATE_REWARD_TYPE_LABELS,
  AFFILIATE_REWARD_STATUS_LABELS,
} from "@/lib/affiliate-labels";
import { CopyLpUrl, BankAccountForm, PasswordChangeForm } from "@/components/affiliate/PortalClient";

// ご紹介協力者ポータル（ダッシュボード・報酬履歴・設定を1ページに集約）
export default async function AffiliatePortalPage() {
  const user = await requireAffiliate();

  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId: user.id },
    include: {
      rewards: { orderBy: { createdAt: "desc" } },
      _count: { select: { clicks: true, leads: true } },
    },
  });

  if (!profile) {
    return (
      <div className="py-16 text-center text-text-muted text-sm">
        プロフィールが見つかりません。事務局までお問い合わせください。
      </div>
    );
  }

  // 今月の実績
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [monthClicks, monthLeads] = await Promise.all([
    prisma.affiliateClick.count({
      where: { affiliateProfileId: profile.id, clickedAt: { gte: monthStart } },
    }),
    prisma.affiliateLead.count({
      where: { affiliateProfileId: profile.id, createdAt: { gte: monthStart } },
    }),
  ]);

  const rewards = profile.rewards;
  const sum = (statuses: string[]) =>
    rewards.filter((r) => statuses.includes(r.status)).reduce((s, r) => s + r.rewardAmount, 0);
  const conversions = rewards.filter(
    (r) => r.rewardType === "CONVERSION" && r.status !== "CANCELLED"
  ).length;

  const lpUrl = affiliateLpUrl(profile.affiliateCode);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-jp text-lg sm:text-[22px] font-normal tracking-[2px]">
          ご紹介協力ポータル
        </h1>
        <p className="text-[12px] text-text-muted mt-1">
          {user.name} 様（{profile.affiliateCode} / {AFFILIATE_CHANNEL_LABELS[profile.channel]}）
        </p>
      </div>

      {/* 状態の注意表示 */}
      {profile.status === "PENDING" && (
        <div className="rounded border border-status-warning/30 bg-status-warning/5 px-4 py-3 text-[13px] text-status-warning">
          現在、登録内容を事務局で確認中です。承認されるとご紹介用URLが有効になります。
        </div>
      )}
      {profile.status === "SUSPENDED" && (
        <div className="rounded border border-status-warning/30 bg-status-warning/5 px-4 py-3 text-[13px] text-status-warning">
          現在、ご紹介用URLは停止中です。詳細は事務局までお問い合わせください。
        </div>
      )}

      {/* 専用URL */}
      <section className="bg-bg-secondary border border-border rounded-md p-5">
        <h2 className="text-[14px] mb-3">あなた専用のご紹介用URL</h2>
        <CopyLpUrl url={lpUrl} />
        <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
          このURLを経由してお申込みがあった場合に、ご紹介実績として記録されます。
        </p>
      </section>

      {/* 実績サマリー */}
      <section className="bg-bg-secondary border border-border rounded-md p-5">
        <h2 className="text-[14px] mb-3">実績</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Stat label="今月のクリック" value={monthClicks.toLocaleString()} />
          <Stat label="今月のご紹介" value={monthLeads.toLocaleString()} />
          <Stat label="累計ご紹介" value={profile._count.leads.toLocaleString()} />
          <Stat label="累計成約" value={conversions.toLocaleString()} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="承認待ち報酬" value={`¥${sum(["PENDING"]).toLocaleString()}`} />
          <Stat label="確定報酬（未払い）" value={`¥${sum(["CONFIRMED"]).toLocaleString()}`} gold />
          <Stat label="支払済み報酬" value={`¥${sum(["PAID"]).toLocaleString()}`} gold />
        </div>
      </section>

      {/* 報酬履歴 */}
      <section className="bg-bg-secondary border border-border rounded-md p-5">
        <h2 className="text-[14px] mb-3">報酬履歴</h2>
        {rewards.length === 0 ? (
          <p className="text-[13px] text-text-muted">報酬はまだありません</p>
        ) : (
          <div className="divide-y divide-border">
            {rewards.map((r) => (
              <div key={r.id} className="py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
                <span className="text-text-primary">{AFFILIATE_REWARD_TYPE_LABELS[r.rewardType]}</span>
                <span className="text-gold">¥{r.rewardAmount.toLocaleString()}</span>
                <span className="text-[11px] text-text-muted">
                  {AFFILIATE_REWARD_STATUS_LABELS[r.status]}
                </span>
                <span className="ml-auto text-[11px] text-text-muted">
                  {new Date(r.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-text-muted mt-3">
          ※ 報酬は事務局の確認後に確定します。お支払いは確定後、登録された振込先へ行われます。
        </p>
      </section>

      {/* 振込先口座 */}
      <section className="bg-bg-secondary border border-border rounded-md p-5">
        <h2 className="text-[14px] mb-3">振込先口座</h2>
        <BankAccountForm
          initial={{
            bankName: profile.bankName || "",
            bankBranch: profile.bankBranch || "",
            bankAccountType: profile.bankAccountType || "",
            bankAccountNumber: profile.bankAccountNumber || "",
            bankAccountName: profile.bankAccountName || "",
          }}
        />
      </section>

      {/* パスワード変更 */}
      <section className="bg-bg-secondary border border-border rounded-md p-5">
        <h2 className="text-[14px] mb-3">パスワード変更</h2>
        <PasswordChangeForm />
      </section>
    </div>
  );
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="bg-bg-primary border border-border rounded p-3 text-center">
      <div className="text-[11px] text-text-muted mb-1">{label}</div>
      <div className={`text-[17px] font-medium ${gold ? "text-gold" : "text-text-primary"}`}>{value}</div>
    </div>
  );
}
