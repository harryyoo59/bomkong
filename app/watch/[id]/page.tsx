import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerPanel } from "@/components/PlayerPanel";
import { SiteShell } from "@/components/SiteShell";
import {
  canPlay,
  describeQueueItem,
  getEpisodeById,
  getNextInQueue,
  trackLabel,
} from "@/lib/episodes";
import type { PlayTrack } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string; t?: string }>;
};

export default async function WatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { lang, t } = await searchParams;
  const episode = getEpisodeById(id);
  if (!episode) notFound();

  const track: PlayTrack = lang === "en" ? "en" : "ko";
  if (!canPlay(episode, track)) notFound();

  const next = getNextInQueue(episode.id, track);
  const resumeSeconds = Number(t);
  const safeResume =
    Number.isFinite(resumeSeconds) && resumeSeconds > 0 ? resumeSeconds : 0;

  return (
    <SiteShell title="재생">
      <PlayerPanel
        episode={episode}
        track={track}
        resumeSeconds={safeResume}
      />
      <section className="panel">
        <h2 className="section-title">이어보기</h2>
        <p className="muted tiny">
          지금: {episode.number}편 {trackLabel(track)}
        </p>
        {next ? (
          <p className="queue-note">
            끝나면 →{" "}
            <Link
              className="queue-link"
              href={`/watch/${next.episodeId}?lang=${next.track}`}
            >
              {describeQueueItem(next)}
            </Link>
          </p>
        ) : (
          <p className="muted">이 다음 편이 아직 없어요.</p>
        )}
      </section>
    </SiteShell>
  );
}
