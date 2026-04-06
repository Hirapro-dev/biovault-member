import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { ClinicForm, ClinicEditButton, ClinicDeleteButton } from "./ClinicActions";

export default async function AdminClinicsPage() {
  await requireAdmin();

  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        クリニック管理
      </h2>

      {/* 新規作成フォーム */}
      <ClinicForm />

      {/* クリニック一覧 */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {clinics.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">クリニックはまだ登録されていません</div>
        ) : (
          <>
            {/* PC: テーブル */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["クリニック名", "住所", "電話番号", "ステータス", ""].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clinics.map((c) => (
                    <tr key={c.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary">{c.name}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{c.address || "---"}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary font-mono">{c.phone || "---"}</td>
                      <td className="px-4 py-3">
                        {c.isActive ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">有効</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">無効</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <ClinicEditButton clinic={{
                            id: c.id,
                            name: c.name,
                            address: c.address,
                            phone: c.phone,
                            note: c.note,
                            isActive: c.isActive,
                          }} />
                          {c.isActive && <ClinicDeleteButton id={c.id} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイル: カードリスト */}
            <div className="sm:hidden divide-y divide-border">
              {clinics.map((c) => (
                <div key={c.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-primary font-medium">{c.name}</span>
                    {c.isActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">有効</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">無効</span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-muted mb-1">
                    {c.address || "住所未登録"} ・ {c.phone || "電話未登録"}
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <ClinicEditButton clinic={{
                      id: c.id,
                      name: c.name,
                      address: c.address,
                      phone: c.phone,
                      note: c.note,
                      isActive: c.isActive,
                    }} />
                    {c.isActive && <ClinicDeleteButton id={c.id} />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
