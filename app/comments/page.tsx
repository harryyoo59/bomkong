import { SiteShell } from "@/components/SiteShell";
import { CommentDesk } from "@/components/CommentDesk";

export default function CommentsPage() {
  return (
    <SiteShell title="댓글쓰기">
      <CommentDesk />
    </SiteShell>
  );
}
