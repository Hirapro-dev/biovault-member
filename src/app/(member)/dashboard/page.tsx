import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function ContentPage() {
  await requireAuth();

  // 動画URL（SiteSettingから取得、なければVideoモデル）
  const videoSetting = await prisma.siteSetting.findUnique({ where: { key: "ips_video_url" } });
  const latestVideo = videoSetting?.content
    ? null
    : await prisma.video.findFirst({ where: { isPublished: true }, orderBy: { publishedAt: "desc" } });

  // YouTube IDを抽出
  const extractId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^?&]+)/);
    return m?.[1] || null;
  };
  const youtubeId = videoSetting?.content ? extractId(videoSetting.content) : latestVideo?.youtubeId || null;

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-6">
        コンテンツ
      </h2>

      {/* ── 動画セクション ── */}
      {youtubeId && (
        <div className="mb-8">
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={latestVideo?.title || "iPS細胞について"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          {latestVideo && (
            <div className="mt-3">
              <h3 className="text-sm text-text-primary font-medium leading-snug">{latestVideo.title}</h3>
              {latestVideo.description && (
                <p className="text-[12px] text-text-muted mt-1 line-clamp-2">{latestVideo.description}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── iPSとは？ / 歴史 / 用語集 ── */}
      <div className="space-y-3">
        <Link href="/about-ips/what-is-ips" className="flex items-center gap-4 bg-bg-secondary border border-border rounded-md p-5 transition-all duration-300 hover:border-border-gold group">
          <div className="w-14 h-14 rounded-lg bg-bg-elevated flex items-center justify-center text-2xl shrink-0">🧬</div>
          <div className="flex-1">
            <h3 className="text-sm text-text-primary group-hover:text-gold transition-colors font-medium">iPS細胞とは？</h3>
            <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">人工多能性幹細胞の仕組みと可能性、再生医療・創薬への応用について</p>
          </div>
          <span className="text-text-muted group-hover:text-gold transition-colors">→</span>
        </Link>

        <Link href="/about-ips/history" className="flex items-center gap-4 bg-bg-secondary border border-border rounded-md p-5 transition-all duration-300 hover:border-border-gold group">
          <div className="w-14 h-14 rounded-lg bg-bg-elevated flex items-center justify-center text-2xl shrink-0">📜</div>
          <div className="flex-1">
            <h3 className="text-sm text-text-primary group-hover:text-gold transition-colors font-medium">iPS細胞の歴史</h3>
            <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">1962年の核移植実験から2026年の世界初承認まで、60年以上の軌跡</p>
          </div>
          <span className="text-text-muted group-hover:text-gold transition-colors">→</span>
        </Link>

        <Link href="/about-ips/glossary" className="flex items-center gap-4 bg-bg-secondary border border-border rounded-md p-5 transition-all duration-300 hover:border-border-gold group">
          <div className="w-14 h-14 rounded-lg bg-bg-elevated flex items-center justify-center text-2xl shrink-0">📖</div>
          <div className="flex-1">
            <h3 className="text-sm text-text-primary group-hover:text-gold transition-colors font-medium">用語集</h3>
            <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">iPS細胞・再生医療に関する専門用語をわかりやすく解説</p>
          </div>
          <span className="text-text-muted group-hover:text-gold transition-colors">→</span>
        </Link>
      </div>
    </div>
  );
}
