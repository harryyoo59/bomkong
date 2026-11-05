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
        <h1 className="character-name">봄이콩이 영상규칙 보관소</h1>
        <p className="muted">
          Harry가 정리·확인한 내용입니다. (2026-11-05)
        </p>
        <p className="character-copy">
          제작 전 이 문서를 먼저 읽고 따릅니다. 아래는 보관소 구조(1~7)와
          최종안(A~I)을 겹치지 않게 합친 공식본입니다. 빈칸은 아직
          미정입니다.
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
        <h2 className="section-title">2. 봄이 · 콩이 (캐릭터 일관성 · 최우선)</h2>
        <p className="character-copy">
          봄이와 콩이의 나이, 외모, 옷, 성격, 목소리, 호칭은 각자 공식 소개
          그대로예요. 모습을 새로 지어내면 안 돼요.
        </p>
        <div className="price-box">
          <p className="eyebrow">봄이</p>
          <p>봄이 소개</p>
          <Link className="btn btn-primary btn-wide" href="/characters/bomi">
            봄이 소개 보기
          </Link>
        </div>
        <div className="price-box">
          <p className="eyebrow">콩이</p>
          <p>콩이 소개</p>
          <Link className="btn btn-primary btn-wide" href="/characters/kongi">
            콩이 소개 보기
          </Link>
        </div>
        <p className="character-copy">
          얼굴의 완전 기본은 Harry가 디자인한 캐릭터 시트예요. 시트의
          그림체와 얼굴을 그대로 지켜요. 셀카와 시트가 다르면 시트를
          따릅니다.
        </p>
        <p className="character-copy">
          <strong>콩이:</strong> 둥근 찐빵 얼굴에 통통한 볼, 각 없는 둥근
          턱이에요. 눈썹은 굵은 일자, 눈은 동그란 갈색, 코는 작고, 머리는
          짧은 투블럭이에요. 몸은 통통한 4살이에요.
        </p>
        <p className="character-copy">
          <strong>콩이 금지:</strong> 갸름한 얼굴, 마른 몸, 나이 들어 보이는
          얼굴, 시트와 다른 얼굴.
        </p>
        <p className="character-copy">
          <strong>봄이:</strong> 갈색 양갈래 머리에 분홍 레이스 리본,
          앞머리, 큰 갈색 눈, 둥근 얼굴이에요.
        </p>
        <p className="character-copy">
          <strong>감정:</strong> 둘 다 기쁨, 슬픔, 화남, 놀람을 아이답게
          자연스럽게 표현해요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">3. 체격·사이즈 기준</h2>
        <p className="character-copy">
          키·몸집 비율은 둘이 노래하는 공연 그림을 기준으로 해요. 키는 거의
          같고, 콩이가 통통해서 몸집만 더 커 보여요. 캐릭터를 키우거나
          줄이거나, 둘 사이 비율을 바꾸면 안 돼요. 콩이를 봄이보다 크게만
          만들지 않아요. 억지로 작게 줄이지도 않아요. 무대 장면의 비율을
          참고해요.
        </p>
        <p className="character-copy muted">
          기준 그림: /cursor/stores/self/media/character-refs/duo/stage-performance.png
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">4. 화면·연출 공통</h2>
        <p className="character-copy">
          아동용 애니메이션이고, 한·영 버전은 그림은 같고 말만 달라요. 과한
          흔들림이나 무서운 연출은 안 되며, 아이들 눈높이에 맞는 친절한
          구도로 찍어요.
        </p>
        <p className="character-copy">아직 미정 (빈칸):</p>
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
        <h2 className="section-title">5. 한 편 스토리·학습 · 영어 학습</h2>
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
        <p className="character-copy">
          영상마다 남매 대화에 영어 표현을 1~2개 넣어요. 봄이가 가르쳐 주면
          콩이가 따라 해요. 이야기 재미가 먼저예요. 끝 로고 화면 직전에
          콩이가 그 표현을 한 번 더 외쳐요. 제목이나 설명에 &quot;오늘의 영어
          표현&quot;을 적어요.
        </p>
        <p className="character-copy">
          영어 채널용으로 같은 장면을 영어 대사로도 만들어요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">6. 목소리</h2>
        <p className="character-copy">
          봄이는 높고 밝고 맑은 6살 여자아이 목소리예요.
        </p>
        <p className="character-copy">
          콩이는 어리고 귀여운 4살 아기 목소리예요. 허스키 처리는 하지
          않아요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">7. 브랜드 노출 · 옷과 로고 (제1규칙)</h2>
        <p className="character-copy">
          왼쪽 위에 로고를 고정하고, 영상 끝은 연보라 로고 화면이에요.
        </p>
        <p className="character-copy">
          옷, 모자, 가방, 양말, 신발에 공식 로고를 넣어요. 봄이가 드레스를
          입을 때는 빼도 돼요. 다른 회사 브랜드는 넣지 않아요.
        </p>
        <p className="character-copy">
          콩이는 소문자 Rhythm 디자인, BomKong 자수 로고, BomKong + Rhythm
          자수 패치 중에서 그날 옷에 어울리는 걸 골라요. 옷은 후드, 점퍼,
          모자 등으로 영상마다 바꾸고, 로고는 항상 보이게 해요. 시트의
          대문자 RHYTHM은 쓰지 않아요.
        </p>
        <p className="character-copy">
          봄이는 드레스를 좋아하지만 고집하지 않아요. 상황에 따라 캐주얼한
          옷도 입어요. 봄이가 캐주얼한 옷을 입을 때는 왼쪽 가슴에 잎사귀
          &apos;o&apos; 얼굴 마크를, 옷 가운데에 BomKong 자수 로고를 달아요.
          드레스에는 로고를 넣지 않아도 돼요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">8. 쿠키 실사</h2>
        <p className="character-copy">
          본편 뒤에 그 편의 모티브가 된 실제 아이들 동영상이나 사진을
          붙이고, 얼굴은 알아볼 수 없게 블러해요. 영어 버전에도 같은 쿠키를
          붙이고, 번역하거나 더빙하지 않아요. 얼굴이 또렷한 컷, 쿠키만 따로
          영어 더빙·자막, 본편과 무관한 실사는 안 돼요.
        </p>
        <p className="character-copy">
          로고 화면 아래에 실제 영상을 끝까지 보여줘요. 얼굴만 알아볼 수
          없게 강하게 흐리게 하고, 실제 이름 소리는 지워요.
        </p>
        <p className="character-copy">
          실제 아이 영상은 참고용과 쿠키 영상에만 써요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">9. 저작권·개인정보</h2>
        <p className="character-copy">저작권 있는 노래는 쓰지 않아요.</p>
        <p className="character-copy">
          실제 아이 영상은 참고용과 쿠키 영상에만 써요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">10. 제작 순서</h2>
        <p className="character-copy">
          규칙서와 기준 자료를 확인하고 기준을 짚어 드려요.
        </p>
        <p className="character-copy">
          디자인 시트를 넣어 정지 그림을 먼저 만들고, 시트와 맞을 때만
          영상으로 만들어요.
        </p>
        <p className="character-copy">
          완성 영상을 다시 확인한 뒤 보내 드려요.
        </p>
        <p className="character-copy">
          영어 채널용으로 같은 장면을 영어 대사로도 만들어요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">11. 호칭</h2>
        <p className="character-copy">
          콩이는 봄이를 항상 &quot;누나&quot;라고 불러요. &quot;언니&quot;는
          쓰지 않아요.
        </p>
        <p className="character-copy">
          봄이도 자기를 &quot;누나&quot;라고 해요.
        </p>
        <p className="character-copy">
          콩이가 아주 화날 때만 &quot;봄이야~~~!&quot; 하고 이름을 불러요.
        </p>
      </section>

      <section className="panel character-section">
        <h2 className="section-title">12. 금지</h2>
        <p className="character-copy">
          봄이·콩이 나이·역할·외형을 마음대로 바꾸기, 기준 그림과 다르게
          키·몸집 비율 그리기, 한 편에 단어 여러 개 가르치기, 한·영 짝인데
          그림·스토리가 달라지게 만들기, 무섭거나 폭력적이거나 성인 농담,
          쿠키에서 얼굴 블러 빼기, 영어판 쿠키를 번역·더빙하기, 영상규칙
          보관소를 안 읽고 제작 시작하기, 갸름·마른·나이 들어 보이는 콩이
          얼굴, 시트와 다른 얼굴, 대문자 RHYTHM 사용.
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
