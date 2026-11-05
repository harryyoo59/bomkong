import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

const SHEETS = [
  {
    src: "/characters/kongi/03-kong-face.jpg",
    alt: "콩이 얼굴 분석 시트",
    label: "얼굴 분석 시트",
  },
  {
    src: "/characters/kongi/04-kong-sheet.jpg",
    alt: "콩이 전신 시트",
    label: "전신 시트",
  },
] as const;

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "기본",
    paragraphs: ["콩이는 4살 한국 남자아이예요."],
  },
  {
    title: "외모",
    paragraphs: [
      "외모는 둥근 찐빵 얼굴에 통통한 볼, 각 없는 둥근 턱, 굵은 일자 눈썹, 동그란 갈색 눈, 작은 코예요. 머리는 짧은 투블럭이에요. 옆은 짧고 위도 짧게 단정하게 정리한 모습입니다. 체는 통통한 4살이지만 뚱뚱하지는 않아요. 11번 노래하는 그림처럼 봄이와 키는 거의 같고, 콩이가 통통해서 몸집만 더 커 보여요. 봄이보다 크게 만들면 안 되고, 어깨 아래로 아주 작게 줄여도 안 돼요.",
    ],
  },
  {
    title: "옷",
    paragraphs: [
      "옷은 시트처럼 베이지 티, 초록 조거 바지, 노란 운동화가 기본이에요. 후드·점퍼·모자처럼 영상마다 옷을 바꿔 입히되, 로고는 항상 보이게 해요. 로고는 기존 소문자 Rhythm 디자인, BomKong 자수 로고, BomKong+Rhythm 자수 패치 중 옷에 어울리는 것을 고르고, Harry가 준 원본만 그대로 붙입니다. 시트의 대문자 RHYTHM은 쓰지 않아요.",
    ],
  },
  {
    title: "성격",
    paragraphs: [
      "성격은 “수줍음은 3초, 음악 나오면 내 무대”예요. 낯가림이 있어도 마이크를 잡으면 바로 퍼포머가 되고, 즉흥으로 노래하며, 피아노와 첼로는 몸으로 배워요. 누나를 따라 “나도!” 하고, 고집이 세서 절대 항복하지 않아요. “내가 할 수 있는데!” 하며 누나와 듀엣으로 한 팀을 이루는 아이입니다. 시트에도 상남자 스타일, 흥이 많고, 욕심 많고, 절대 포기 안 함, 음악 나오면 바로 춤, 마이크를 사랑한다고 적혀 있어요. 기쁨·슬픔·화남·놀람은 아이답게 자연스럽게 표현해요.",
    ],
  },
  {
    title: "목소리",
    paragraphs: [
      "목소리는 어리고 귀여운 4살 아기 목소리예요. 허스키하게 후처리하지는 않아요.",
    ],
  },
  {
    title: "호칭",
    paragraphs: [
      "호칭은 봄이를 항상 “누나”라고 하고, “언니”는 쓰지 않아요. 아주 화날 때만 “봄이야~~~!” 하고 이름을 불러도 돼요.",
    ],
  },
];

export default function KongiCharacterPage() {
  return (
    <SiteShell title="콩이">
      <section className="panel character-hero">
        <p className="eyebrow">캐릭터 소개</p>
        <h1 className="character-name">콩이</h1>
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
                height={520}
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
        <Link className="btn btn-soft btn-wide" href="/characters/bomi">
          봄이 소개로
        </Link>
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
