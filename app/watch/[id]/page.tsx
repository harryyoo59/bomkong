import { SiteShell } from "@/components/SiteShell";
import { WatchVaultPlayer } from "@/components/WatchVaultPlayer";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function WatchPage({ params, searchParams }: PageProps) {
  const { id: rawId } = await params;
  const { t } = await searchParams;
  const id = decodeURIComponent(rawId);
  const resumeSeconds = Number(t);
  const safeResume =
    Number.isFinite(resumeSeconds) && resumeSeconds > 0 ? resumeSeconds : 0;

  return (
    <SiteShell title="재생">
      <WatchVaultPlayer id={id} resumeSeconds={safeResume} />
    </SiteShell>
  );
}
