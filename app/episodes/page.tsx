import { SiteShell } from "@/components/SiteShell";
import { WatchLobbyList } from "@/components/WatchLobbyList";

export default function EpisodesPage() {
  return (
    <SiteShell title="영상보기">
      <section className="panel">
        <h1 className="section-title">영상보기</h1>
        <p className="muted">
          지난번에 본 영상부터 이어서 나와요. 한 편이 끝나면 같은 번호 영어,
          없으면 다음 번호로 가요. 끝까지 가면 첫 영상부터 다시예요.
        </p>
      </section>
      <WatchLobbyList />
    </SiteShell>
  );
}
