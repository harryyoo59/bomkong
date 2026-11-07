import { LivingRoomHome } from "@/components/LivingRoomHome";
import { getEpisodes } from "@/lib/episodes";

export default function HomePage() {
  const episodes = getEpisodes();
  const first = episodes.find((ep) => ep.hasKo);
  const firstWatchHref = first ? `/watch/${first.id}?lang=ko` : null;

  return <LivingRoomHome firstWatchHref={firstWatchHref} />;
}
