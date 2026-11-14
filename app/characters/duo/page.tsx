import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export default function DuoCharacterPage() {
  return (
    <SiteShell title="봄이·콩이">
      <section className="panel character-hero">
        <p className="eyebrow">캐릭터 소개</p>
        <h1 className="character-name">봄이·콩이</h1>
        <p className="muted">
          둘이 함께 있는 모습이에요. 혼자일 때와 다른 장면에 쓰는 기준이에요.
        </p>
      </section>

      <section className="panel">
        <h2 className="section-title">함께일 때</h2>
        <p>
          봄이와 콩이가 같은 장면에 나올 때는, 키는 거의 같고 콩이가 조금 더
          통통해 보여요. 누나·동생 말투와 사이 거리는 영상규칙의 함께
          맞춰요.
        </p>
        <p className="muted tiny">
          기준 사진·장면은 관리자실 「봄이·콩이」칸 아래 사진 보관(갤러리)에
          모아 두어요.
        </p>
      </section>

      <section className="panel">
        <h2 className="section-title">혼자 보기</h2>
        <div className="vault-nav-row">
          <Link className="btn btn-soft" href="/characters/bomi">
            봄이만
          </Link>
          <Link className="btn btn-soft" href="/characters/kongi">
            콩이만
          </Link>
          <Link className="btn btn-soft" href="/admin/duo-photos">
            함께 사진 보관
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
