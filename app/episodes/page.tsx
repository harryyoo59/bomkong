import { EpisodeList } from "@/components/EpisodeList";
import { SiteShell } from "@/components/SiteShell";
import { getEpisodes } from "@/lib/episodes";

export default function EpisodesPage() {
  const episodes = getEpisodes();

  return (
    <SiteShell title="편 목록">
      <section className="panel">
        <h1 className="section-title">편 목록</h1>
        <p className="muted">
          한·영 짝이 보이면 같이 볼 수 있어요. 영어가 없으면 「영어 준비 중」.
        </p>
      </section>
      <EpisodeList episodes={episodes} />
    </SiteShell>
  );
}
