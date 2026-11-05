import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

const UNDECIDED = [
  "분위기",
  "배경 톤",
  "숏츠 비율",
  "길이",
  "로고·채널명 위치",
] as const;

export default function RulesPage() {
  return (
    <SiteShell title="영상규칙">
      <section className="panel character-hero">
        <p className="eyebrow">보관소</p>
        <h1 className="character-name">봄이콩이 영상규칙</h1>
        <p className="muted">
          어떤 AI든 영상을 만들기 전에 규칙을 읽고 따라야 해요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">1. 보관소 README</h2>
        <p className="character-copy">
          어떤 AI든 영상을 만들기 전에 이 보관소를 먼저 읽고 따라야 해요.
          캐릭터 모습은 여기서 정한 것과 같아야 하고, 마음대로 바꾸면 안
          돼요. 봄이는 6살 누나, 콩이는 4살 동생이에요. 한국어 편에서는
          봄이가 영어 단어 1개를 가르치고 콩이가 따라 하며, 영어 편에서는
          봄이가 한국어 단어 1개를 가르치고 콩이가 따라 해요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">2. 봄이 · 콩이</h2>
        <p className="character-copy">
          봄이와 콩이의 나이, 외모, 옷, 성격, 목소리, 호칭은 각자 공식 소개
          그대로예요. 모습을 새로 지어내면 안 돼요.
        </p>
        <div className="price-box">
          <p className="eyebrow">봄이</p>
          <p>봄이 공식 소개와 기준 시트를 볼 수 있어요.</p>
          <Link className="btn btn-primary btn-wide" href="/characters/bomi">
            봄이 소개 보기
          </Link>
        </div>
        <div className="price-box">
          <p className="eyebrow">콩이</p>
          <p>콩이 공식 소개와 기준 시트를 볼 수 있어요.</p>
          <Link className="btn btn-primary btn-wide" href="/characters/kongi">
            콩이 소개 보기
          </Link>
        </div>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">3. 체격·사이즈 기준</h2>
        <p className="character-copy">
          키·몸집 비율은 둘이 노래하는 공연 그림을 기준으로 해요. 키는 거의
          같고, 콩이가 통통해서 몸집만 더 커 보여요. 캐릭터를 키우거나
          줄이거나, 둘 사이 비율을 바꾸면 안 돼요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">4. 화면·연출 공통</h2>
        <p className="character-copy">
          아동용 애니메이션이고, 한·영 버전은 그림은 같고 말만 달라요. 과한
          흔들림이나 무서운 연출은 안 되며, 아이들 눈높이에 맞는 친절한
          구도로 찍어요. 분위기, 배경 톤, 숏츠 비율, 길이, 로고·채널명
          위치는 아직 미정이에요.
        </p>
        <ul className="rules-blank-list">
          {UNDECIDED.map((label) => (
            <li key={label} className="rules-blank-item">
              <span className="rules-blank-label">{label}</span>
              <span className="rules-blank-field" aria-label={`${label} 빈칸`}>
                —
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">5. 한 편 스토리·학습</h2>
        <p className="character-copy">
          한국어 편과 영어 편은 같은 이야기·같은 그림이고, 대사만 달라요. 한
          편이 완성되면 짝 언어 자리를 남겨 두고, 없으면 다음 한국어 편으로
          넘어가요. 한 편에는 단어를 딱 하나만 넣고, 이야기에 자연스럽게
          녹여요.
        </p>
        <p className="character-copy">
          본편 흐름은 짧은 상황 → 봄이가 단어 제시 → 콩이 따라 하기 → 짧게
          재미있게 마무리예요. 올릴 때는 편 번호, 한·영 제목, 그 편 단어,
          한국어·영어·쿠키 파일을 적어요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">6. 쿠키 실사</h2>
        <p className="character-copy">
          본편 뒤에 그 편의 모티브가 된 실제 아이들 동영상이나 사진을
          붙이고, 얼굴은 알아볼 수 없게 블러해요. 영어 버전에도 같은 쿠키를
          붙이고, 번역하거나 더빙하지 않아요. 얼굴이 또렷한 컷, 쿠키만 따로
          영어 더빙·자막, 본편과 무관한 실사는 안 돼요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">7. 금지</h2>
        <p className="character-copy">
          봄이·콩이 나이·역할·외형을 마음대로 바꾸기, 기준 그림과 다르게
          키·몸집 비율 그리기, 한 편에 단어 여러 개 가르치기, 한·영 짝인데
          그림·스토리가 달라지게 만들기, 무섭거나 폭력적이거나 성인 농담,
          쿠키에서 얼굴 블러 빼기, 영어판 쿠키를 번역·더빙하기, 영상규칙
          보관소를 안 읽고 제작 시작하기.
        </p>
      </section>

      <section className="panel stub-card">
        <Link className="btn btn-soft btn-wide" href="/admin">
          올리기 화면으로
        </Link>
        <Link className="btn btn-soft btn-wide" href="/">
          홈으로
        </Link>
      </section>
    </SiteShell>
  );
}
