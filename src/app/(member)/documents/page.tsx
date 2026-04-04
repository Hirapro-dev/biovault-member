import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Badge from "@/components/ui/Badge";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ORDER } from "@/types";
import type { DocumentType } from "@/types";

export default async function DocumentsPage() {
  const user = await requireAuth();

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
  });

  // パンフレット同意状態を取得
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hasAgreedPamphlet: true, agreedPamphletAt: true },
  });

  // 同意規約(SIMPLE_AGREEMENT)を除外し、指定順にソート
  const sortedDocs = [...documents]
    .filter((d) => d.type !== "SIMPLE_AGREEMENT")
    .sort((a, b) => {
      const ai = DOCUMENT_TYPE_ORDER.indexOf(a.type as DocumentType);
      const bi = DOCUMENT_TYPE_ORDER.indexOf(b.type as DocumentType);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  const statusConfig = {
    SIGNED: { label: "署名済", variant: "success" as const },
    SENT: { label: "送付済", variant: "warning" as const },
    PENDING: { label: "未署名", variant: "muted" as const },
    ARCHIVED: { label: "アーカイブ", variant: "muted" as const },
  };

  const docNumberMap: Record<string, string> = {
    CONTRACT: "001",
    PRIVACY_POLICY: "002",
    CONSENT_CELL_STORAGE: "003",
    INFORMED_CONSENT: "004",
  };

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        契約・同意事項書類一覧
      </h2>

      <div className="flex flex-col gap-3">
        {sortedDocs.map((doc) => {
          const st = statusConfig[doc.status];
          const docNum = docNumberMap[doc.type] || "";
          return (
            <div
              key={doc.id}
              className="bg-bg-secondary border border-border rounded-md px-4 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors duration-300 hover:border-border-gold"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-bg-elevated flex items-center justify-center text-[10px] sm:text-xs text-gold font-mono shrink-0">
                  {docNum}
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base text-text-primary leading-snug">
                    {DOCUMENT_TYPE_LABELS[doc.type] || doc.title}
                  </div>
                  {doc.signedAt && (
                    <div className="text-xs text-text-secondary mt-0.5">
                      署名日: {new Date(doc.signedAt).toLocaleDateString("ja-JP")}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 pl-11 sm:pl-0">
                <Badge variant={st.variant}>{st.label}</Badge>
                {doc.fileUrl && (
                  <a
                    href={`/api/member/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-transparent border border-border text-text-secondary rounded-sm text-xs hover:border-border-gold hover:text-gold transition-all duration-300"
                  >
                    PDF を見る
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {/* パンフレット免責事項（一番下に表示） */}
        <div className="bg-bg-secondary border border-border rounded-md px-4 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors duration-300 hover:border-border-gold">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-bg-elevated flex items-center justify-center text-[10px] sm:text-xs text-gold font-mono shrink-0">
              005
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base text-text-primary leading-snug">
                パンフレット免責事項
              </div>
              {fullUser?.agreedPamphletAt && (
                <div className="text-xs text-text-secondary mt-0.5">
                  同意日: {new Date(fullUser.agreedPamphletAt).toLocaleDateString("ja-JP")}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 pl-11 sm:pl-0">
            <Badge variant={fullUser?.hasAgreedPamphlet ? "success" : "muted"}>
              {fullUser?.hasAgreedPamphlet ? "同意済" : "未同意"}
            </Badge>
          </div>
        </div>

        {sortedDocs.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">
            書類が登録されていません
          </div>
        )}
      </div>
    </div>
  );
}
