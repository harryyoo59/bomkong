import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

const LOGO_ROOMS = [
  {
    id: "01-bomkong-glossy",
    title: "봄콩 광택 글씨",
    blurb: "광택(글로시) 워드마크예요.",
    src: "/assets/logos/01-bomkong-glossy/logo.png",
    width: 1120,
    height: 2240,
  },
  {
    id: "02-bomkong-embroidered",
    title: "봄콩 자수 패치",
    blurb: "자수 패치 느낌 워드마크예요.",
    src: "/assets/logos/02-bomkong-embroidered/logo.png",
    width: 1904,
    height: 1280,
  },
  {
    id: "03-rhythm-parts",
    title: "리듬 부품",
    blurb: "자수·번개·별 부품이에요.",
    src: "/assets/logos/03-rhythm-parts/logo.png",
    width: 1904,
    height: 1280,
  },
  {
    id: "04-bomkong-rhythm-patch",
    title: "봄콩+리듬 합친 자수",
    blurb: "봄콩과 리듬이 합쳐진 자수 패치예요.",
    src: "/assets/logos/04-bomkong-rhythm-patch/logo.png",
    width: 1536,
    height: 1024,
  },
] as const;

export default function LogosPage() {
  return (
    <SiteShell title="로고 보관">
      <section className="panel logo-hero">
        <p className="eyebrow">공식 로고</p>
        <h1 className="logo-page-title">로고 보관</h1>
        <p className="muted">영상·옷·사이트에 쓰는 로고만 모아 두었어요.</p>
      </section>

      {LOGO_ROOMS.map((room, index) => (
        <section key={room.id} className="panel logo-room" id={room.id}>
          <h2 className="section-title">{room.title}</h2>
          <p className="muted logo-room-blurb">{room.blurb}</p>
          <figure className="logo-card">
            <Image
              src={room.src}
              alt={room.title}
              width={room.width}
              height={room.height}
              className="logo-image"
              sizes="(max-width: 390px) 100vw, 390px"
              priority={index === 0}
            />
            <figcaption className="logo-caption">{room.title}</figcaption>
          </figure>
        </section>
      ))}

      <section className="panel stub-card">
        <Link className="btn btn-soft btn-wide" href="/">
          홈으로
        </Link>
      </section>
    </SiteShell>
  );
}
