"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ORDER } from "@/types";

interface Doc {
  id: string;
  type: string;
  title: string;
  status: string;
  fileUrl: string | null;
  signedAt: string | null;
}

// 書類番号マップ（ユーザーページと統一）
const DOC_NUMBER_MAP: Record<string, string> = {
  CONTRACT: "001",
  PRIVACY_POLICY: "002",
  CONSENT_CELL_STORAGE: "003",
  CELL_STORAGE_CONSENT: "004",
  INFORMED_CONSENT: "005",
};

export default function DocumentManager({
  userId,
  documents,
  hasAgreedPamphlet,
  agreedPamphletAt,
}: {
  userId: string;
  documents: Doc[];
  hasAgreedPamphlet: boolean;
  agreedPamphletAt: string | null;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetDocId, setTargetDocId] = useState<string | null>(null);

  // SIMPLE_AGREEMENTを除外し、DOCUMENT_TYPE_ORDERに従ってソート
  const sortedDocs = [...documents]
    .filter((d) => d.type !== "SIMPLE_AGREEMENT")
    .sort((a, b) => {
      const ai = DOCUMENT_TYPE_ORDER.indexOf(a.type as (typeof DOCUMENT_TYPE_ORDER)[number]);
      const bi = DOCUMENT_TYPE_ORDER.indexOf(b.type as (typeof DOCUMENT_TYPE_ORDER)[number]);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  const handleUploadClick = (docId: string) => {
    setTargetDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetDocId) return;

    if (file.type !== "application/pdf") {
      setError("PDFファイルのみアップロードできます");
      return;
    }

    setUploading(targetDocId);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentId", targetDocId);

      const res = await fetch(`/api/admin/members/${userId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("アップロードしました");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "アップロードに失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setUploading(null);
      setTargetDocId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const statusVariant = (status: string) => {
    if (status === "SIGNED") return "bg-status-active/10 text-status-active border-status-active/20";
    if (status === "SENT") return "bg-status-warning/10 text-status-warning border-status-warning/20";
    return "bg-text-muted/10 text-text-muted border-text-muted/20";
  };

  const statusLabel = (status: string) => {
    if (status === "SIGNED") return "同意済";
    if (status === "SENT") return "送付済";
    if (status === "ARCHIVED") return "アーカイブ";
    return "未署名";
  };

  return (
    <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        契約・同意事項書類一覧
      </h3>

      {message && (
        <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">
          {error}
        </div>
      )}

      {/* 隠しファイルインプット */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {sortedDocs.map((doc) => {
        const docNum = DOC_NUMBER_MAP[doc.type] || "";
        return (
          <div
            key={doc.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-b-0 gap-2"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {docNum && (
                <div className="w-7 h-7 rounded bg-bg-elevated flex items-center justify-center text-[10px] text-gold font-mono shrink-0">
                  {docNum}
                </div>
              )}
              <div>
                <div className="text-[13px] text-text-primary">
                  {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] || doc.title}
                </div>
                {doc.signedAt && (
                  <div className="text-[11px] text-text-muted mt-0.5">
                    同意日: {new Date(doc.signedAt).toLocaleDateString("ja-JP")}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] px-2.5 py-1 rounded-full border ${statusVariant(doc.status)}`}>
                {statusLabel(doc.status)}
              </span>

              {doc.fileUrl && (
                <a
                  href={`/api/member/documents/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all cursor-pointer"
                >
                  PDF
                </a>
              )}

              <button
                onClick={() => handleUploadClick(doc.id)}
                disabled={uploading === doc.id}
                className="px-3 py-1.5 bg-transparent border border-border text-text-muted rounded-sm text-[11px] hover:border-gold hover:text-gold transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading === doc.id ? "..." : doc.fileUrl ? "再UP" : "UP"}
              </button>
            </div>
          </div>
        );
      })}

      {/* パンフレット免責事項 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-t border-border gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded bg-bg-elevated flex items-center justify-center text-[10px] text-gold font-mono shrink-0">006</div>
          <div>
            <div className="text-[13px] text-text-primary">パンフレット免責事項</div>
            {agreedPamphletAt && (
              <div className="text-[11px] text-text-muted mt-0.5">
                同意日: {new Date(agreedPamphletAt).toLocaleDateString("ja-JP")}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] px-2.5 py-1 rounded-full border ${hasAgreedPamphlet ? "bg-status-active/10 text-status-active border-status-active/20" : "bg-text-muted/10 text-text-muted border-text-muted/20"}`}>
            {hasAgreedPamphlet ? "同意済" : "未同意"}
          </span>
        </div>
      </div>
    </div>
  );
}
