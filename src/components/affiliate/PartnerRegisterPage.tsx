import GaTag from "@/components/affiliate/GaTag";
import PartnerRegisterForm from "@/components/affiliate/PartnerRegisterForm";
import { AFFILIATE_CHANNEL_LABELS } from "@/lib/affiliate-labels";

// 協力者登録ページの共通レイアウト（nw / kawara の2ルートから利用）
export default function PartnerRegisterPage({ channel }: { channel: "NW" | "KAWARA" }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <GaTag />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-5 text-center">
          <div className="font-serif text-2xl tracking-widest">BioVault</div>
          <div className="mt-1 text-[10px] tracking-[0.3em] text-gray-500">iPS CELL BANKING</div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-center text-xs font-bold tracking-widest text-gray-500">
          {AFFILIATE_CHANNEL_LABELS[channel]}
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold leading-relaxed">
          紹介協力制度 登録フォーム
        </h1>
        <p className="mt-4 text-center text-sm leading-relaxed text-gray-600">
          ご登録いただくと、あなた専用のご紹介用URLが発行されます。
          <br />
          専用URL経由のお申込み実績に応じて報酬をお支払いします。
        </p>
        <PartnerRegisterForm channel={channel} />
      </main>
      <footer className="mt-10 border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        ©2026 株式会社BioVault
      </footer>
    </div>
  );
}
