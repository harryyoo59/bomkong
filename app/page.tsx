import { LivingRoomHome } from "@/components/LivingRoomHome";
import { getEpisodes } from "@/lib/episodes";

export default function HomePage() {
  const episodes = getEpisodes();
  const first = episodes.find((ep) => ep.hasKo);
  const firstWatchHref = first ? `/watch/${first.id}?lang=ko` : null;
  const youtubeChannelUrl =
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL?.trim() ||
    "https://www.youtube.com/@%EB%B4%84%EC%9D%B4%EC%BD%A9%EC%9D%B4BomKong";

  return (
    <LivingRoomHome
      firstWatchHref={firstWatchHref}
      youtubeChannelUrl={youtubeChannelUrl}
    />
  );
}
