import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import FavoriteButton from "@/components/ui/FavoriteButton";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video || !video.isPublished) notFound();

  // お気に入り状態
  const fav = await prisma.favorite.findUnique({
    where: { userId_contentType_contentId: { userId: user.id, contentType: "VIDEO", contentId: id } },
  });

  // 他の動画（レコメンド用）
  const otherVideos = await prisma.video.findMany({
    where: { isPublished: true, id: { not: id } },
    orderBy: { publishedAt: "desc" },
    take: 6,
  });

  return (
    <div className="max-w-[900px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-4">
        <Link href="/dashboard?tab=videos" className="hover:text-gold transition-colors">
          動画一覧
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">再生</span>
      </div>

      {/* YouTube プレーヤー */}
      <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
        <iframe
          src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      {/* タイトル + お気に入り */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="text-base sm:text-lg text-text-primary font-medium leading-snug">
          {video.title}
        </h1>
        <FavoriteButton contentType="VIDEO" contentId={video.id} isFavorited={!!fav} />
      </div>

      <div className="text-[11px] text-text-muted font-mono mb-4">
        {new Date(video.publishedAt).toLocaleDateString("ja-JP")}
      </div>

      {/* 説明文 */}
      {video.description && (
        <div className="bg-bg-secondary border border-border rounded-md p-5 mb-8">
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {video.description}
          </p>
        </div>
      )}

      {/* 他の動画 */}
      {otherVideos.length > 0 && (
        <div>
          <h3 className="text-sm text-text-muted tracking-wider mb-4 pb-3 border-t border-border pt-6">
            その他の動画
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {otherVideos.map((v) => (
              <Link key={v.id} href={`/about-ips/video/${v.id}`} className="group">
                <div className="aspect-video rounded-md overflow-hidden bg-bg-elevated mb-2">
                  {v.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">🎬</div>
                  )}
                </div>
                <h4 className="text-[12px] text-text-primary group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                  {v.title.length > 30 ? v.title.slice(0, 30) + "..." : v.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
