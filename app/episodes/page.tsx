import { SiteShell } from "@/components/SiteShell";
import { WatchLobbyList } from "@/components/WatchLobbyList";

export default function EpisodesPage() {
  return (
    <SiteShell title="영상보기">
      <section className="panel">
        <h1 className="section-title">영상보기</h1>
        <p className="muted">사장님이 영상보기 방에 넣어 둔 영상만 나와요.</p>
      </section>
      <WatchLobbyList />
    </SiteShell>
  );
}
