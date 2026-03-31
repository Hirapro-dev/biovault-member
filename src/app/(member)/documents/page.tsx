import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Badge from "@/components/ui/Badge";
import { DOCUMENT_TYPE_LABELS } from "@/types";
import Link from "next/link";

export default async function DocumentsPage() {
  const user = await requireAuth();

  const [documents, fullUser] = await Promise.all([
    prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { hasAgreedTerms: true, agreedTermsAt: true },
    }),
  ]);

  const statusConfig = {
    SIGNED: { label: "署名済", variant: "success" as const },
    SENT: { label: "送付済", variant: "warning" as const },
    PENDING: { label: "未署名", variant: "muted" as const },
    ARCHIVED: { label: "アーカイブ", variant: "muted" as const },
  };

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        契約書類
      </h2>

      <div className="flex flex-col gap-3">
        {/* 重要事項説明 */}
        <Link
          href="/important-notice"
          className="bg-bg-secondary border border-border rounded-md px-4 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors duration-300 hover:border-border-gold"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-bg-elevated flex items-center justify-center text-sm sm:text-base text-gold shrink-0">
              📋
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base text-text-primary leading-snug">
                重要事項説明書 / 個人情報同意書
              </div>
              {fullUser?.agreedTermsAt && (
                <div className="text-xs text-text-secondary mt-0.5">
                  同意日: {new Date(fullUser.agreedTermsAt).toLocaleDateString("ja-JP")}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 pl-11 sm:pl-0">
            <Badge variant={fullUser?.hasAgreedTerms ? "success" : "warning"}>
              {fullUser?.hasAgreedTerms ? "同意済" : "未同意"}
            </Badge>
            <span className="text-xs text-text-muted">内容を見る →</span>
          </div>
        </Link>

        {documents.map((doc) => {
          const st = statusConfig[doc.status];
          return (
            <div
              key={doc.id}
              className="bg-bg-secondary border border-border rounded-md px-4 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors duration-300 hover:border-border-gold"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-bg-elevated flex items-center justify-center text-sm sm:text-base text-gold shrink-0">
                  ◇
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base text-text-primary leading-snug">
                    {DOCUMENT_TYPE_LABELS[doc.type] || doc.title}
                  </div>
                  {doc.signedAt && (
                    <div className="text-xs text-text-secondary mt-0.5">
                      {new Date(doc.signedAt).toLocaleDateString("ja-JP")}
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

        {documents.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">
            書類が登録されていません
          </div>
        )}
      </div>
    </div>
  );
}
