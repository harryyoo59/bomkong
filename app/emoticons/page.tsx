import Link from "next/link";
import { PublicEmoticonGallery } from "@/components/PublicEmoticonGallery";
import { SiteShell } from "@/components/SiteShell";

export default function EmoticonsPage() {
  return (
    <SiteShell title="이모티콘">
      <PublicEmoticonGallery />

      <Link className="btn btn-soft btn-wide" href="/">
        거실로 돌아가기
      </Link>
    </SiteShell>
  );
}
