import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

const SHEETS = [
  {
    src: "/characters/bomi/01-bom-expressions.jpg",
    alt: "봄이 표정 시트",
    label: "표정 시트",
  },
  {
    src: "/characters/bomi/02-bom-fullbody.jpg",
    alt: "봄이 전신 시트",
    label: "전신 시트",
  },
  {
    src: "/characters/bomi/05-bom-design-sheet.jpg",
    alt: "봄이 디자인 시트",
    label: "디자인 시트",
  },
] as const;

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "기본",
    paragraphs: ["봄이는 6살 한국 여자아이예요."],
  },
  {
    title: "외모",
    paragraphs: [
      "갈색 머리(#6C4E35)에 앞머리가 있고, 양갈래에 분홍 레이스 리본(#F55C7D)을 해요. 큰 갈색 눈과 둥근 얼굴이고, 색깔은 라벤더(#B89EDB), 레이스 화이트, 골드예요.",
    ],
  },
  {
    title: "옷",
    paragraphs: [
      "옷의 시그니처는 우아한 공주와 반전 매력이에요. 라벤더 레이스 공주 원피스에 클라이밍화를 신는 모습이에요. 드레스를 좋아하지만 그것만 고집하지는 않고, 상황에 따라 캐주얼 옷도 입어요.",
      "캐주얼일 때는 왼쪽 가슴에 잎사귀 달린 주황 o 얼굴 마크를 작게 붙이고, 옷 중앙에 BomKong 자수 로고 전체를 넣어요. 드레스에는 로고를 넣지 않아도 돼요.",
    ],
  },
  {
    title: "성격",
    paragraphs: [
      "성격은 학구파 클라이머예요. 밝고 씩씩하고, 피아노와 트럼펫을 좋아하며 한 가지에 푹 빠져요. 피아노에 몰입하면 콩이 장난도 잘 못 듣고, 피아노를 건드리면 혼내요. 자기 물건은 “내 거!” 하고 챙기고, 클라이밍에서는 “누나가 더 높이!” 하는 1등 마음이 있어요. 힘으로 밀리면 엄마 아빠에게 도움을 청해요. 기쁨·슬픔·화남·놀람은 아이답게 자연스럽게 표현해요.",
    ],
  },
  {
    title: "목소리",
    paragraphs: [
      "목소리는 높고 밝고 맑은 6살 목소리예요. 자신감 있고 통통 튀며, 못 알아들으면 “코! 스! 투! 에! 서!”처럼 한 글자씩 끊어서 말하고, 영어 노래는 뜻을 몰라도 소리만 흉내 내 즉석으로 지어 불러요. 웃음이 크고 환하게 터져요.",
    ],
  },
  {
    title: "소품",
    paragraphs: ["소품은 미니 피아노와 골든 트럼펫이에요."],
  },
  {
    title: "호칭·키",
    paragraphs: [
      "콩이에게는 자기를 항상 “누나”라고 해요. “언니”는 쓰지 않아요.",
      "키는 11번 노래하는 그림처럼 콩이와 거의 같고, 콩이가 통통해서 몸집만 더 커 보여요.",
    ],
  },
];

export default function BomiCharacterPage() {
  return (
    <SiteShell title="봄이">
      <section className="panel character-hero">
        <p className="eyebrow">캐릭터 소개</p>
        <h1 className="character-name">봄이</h1>
        <p className="muted">얼굴의 완전 기본 베이스는 아래 시트예요.</p>
      </section>

      <section className="panel">
        <h2 className="section-title">기준 시트</h2>
        <div className="sheet-stack">
          {SHEETS.map((sheet, index) => (
            <figure key={sheet.src} className="sheet-card">
              <Image
                src={sheet.src}
                alt={sheet.alt}
                width={780}
                height={980}
                className="sheet-image"
                sizes="(max-width: 390px) 100vw, 390px"
                priority={index === 0}
              />
              <figcaption className="sheet-caption">{sheet.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.title} className="panel character-section">
          <h2 className="section-title">{section.title}</h2>
          {section.paragraphs.map((para) => (
            <p key={para} className="character-copy">
              {para}
            </p>
          ))}
        </section>
      ))}

      <section className="panel stub-card">
        <Link className="btn btn-soft btn-wide" href="/rules">
          영상규칙으로
        </Link>
        <Link className="btn btn-soft btn-wide" href="/">
          홈으로
        </Link>
      </section>
    </SiteShell>
  );
}
