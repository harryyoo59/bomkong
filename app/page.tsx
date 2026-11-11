import { LivingRoomHome } from "@/components/LivingRoomHome";

export default function HomePage() {
  const youtubeChannelUrl =
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL?.trim() ||
    "https://www.youtube.com/@%EB%B4%84%EC%9D%B4%EC%BD%A9%EC%9D%B4BomKong";

  return (
    <LivingRoomHome
      firstWatchHref="/episodes"
      youtubeChannelUrl={youtubeChannelUrl}
    />
  );
}
