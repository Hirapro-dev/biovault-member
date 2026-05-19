import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { BankAccountForm, BankAccountEditButton, BankAccountDeleteButton } from "./BankAccountActions";
import { getCompany } from "@/lib/scheme";

export default async function AdminBankAccountsPage() {
  await requireAdmin();

  const accounts = await prisma.bankAccount.findMany({
    orderBy: [{ scheme: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        振込先口座管理
      </h2>

      {/* 新規作成フォーム */}
      <BankAccountForm />

      {/* 口座一覧 */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {accounts.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">振込先口座はまだ登録されていません</div>
        ) : (
          <>
            {/* PC: テーブル */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["スキーム", "銀行名", "支店名", "口座種別", "口座番号", "口座名義", "ステータス", ""].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => {
                    const company = getCompany(a.scheme);
                    return (
                      <tr key={a.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${company.badgeClass}`}>
                            {company.shortName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-primary">{a.bankName}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{a.branchName}</td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{a.accountType}</td>
                        <td className="px-4 py-3 text-xs font-mono text-text-secondary">{a.accountNumber}</td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{a.accountName}</td>
                        <td className="px-4 py-3">
                          {a.isActive ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">有効</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">無効</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <BankAccountEditButton account={{
                              id: a.id,
                              bankName: a.bankName,
                              branchName: a.branchName,
                              accountType: a.accountType,
                              accountNumber: a.accountNumber,
                              accountName: a.accountName,
                              isActive: a.isActive,
                              scheme: a.scheme === "MRT" ? "MRT" : "SCPP",
                            }} />
                            {a.isActive && <BankAccountDeleteButton id={a.id} />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* モバイル: カードリスト */}
            <div className="sm:hidden divide-y divide-border">
              {accounts.map((a) => {
                const company = getCompany(a.scheme);
                return (
                  <div key={a.id} className="px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${company.badgeClass}`}>
                          {company.shortName}
                        </span>
                        <span className="text-sm text-text-primary font-medium">{a.bankName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {a.isActive ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">有効</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">無効</span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-text-muted mb-1">
                      {a.branchName} ・ {a.accountType} ・ {a.accountNumber}
                    </div>
                    <div className="text-xs text-text-secondary mb-3">{a.accountName}</div>
                    <div className="flex gap-1.5">
                      <BankAccountEditButton account={{
                        id: a.id,
                        bankName: a.bankName,
                        branchName: a.branchName,
                        accountType: a.accountType,
                        accountNumber: a.accountNumber,
                        accountName: a.accountName,
                        isActive: a.isActive,
                        scheme: a.scheme === "MRT" ? "MRT" : "SCPP",
                      }} />
                      {a.isActive && <BankAccountDeleteButton id={a.id} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
