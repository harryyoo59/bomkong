# 유튜브 숏츠 올리기 — 비밀 값 넣는 방법

미공개 영상실의 「유튜브 숏츠로 올리기」는 **서버에만** 구글 비밀 값을 두고
동작해요. 저장소·채팅에 실제 값을 넣지 마세요.

대상 채널: **봄이콩이 / Siblings bomkong**
(`https://www.youtube.com/@봄이콩이BomKong`)

## Vercel에 넣을 이름 (값 비워 두지 않기)

| 이름 | 의미 |
|------|------|
| `YOUTUBE_CLIENT_ID` | Google Cloud OAuth 클라이언트 ID |
| `YOUTUBE_CLIENT_SECRET` | OAuth 클라이언트 비밀 |
| `YOUTUBE_REDIRECT_URI` | 돌아가는 주소 (아래와 **완전히 같게**) |
| `YOUTUBE_REFRESH_TOKEN` | 한 번 허락받은 뒤 나오는 **오래 쓰는 열쇠** |

돌아가는 주소 예:

```text
https://(사이트주소)/api/admin/youtube/oauth/callback
```

로컬 시험 시 예:

```text
http://localhost:3000/api/admin/youtube/oauth/callback
```

이미 쓰는 `BOMKONG_ADMIN_SECRET`도 그대로 필요해요 (관리자 입장 + 올리기 자리 서명).

## Google Cloud에서 할 일

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 만들기
2. **API 및 서비스 → 라이브러리**에서 **YouTube Data API v3** 사용 설정
3. **OAuth 동의 화면**
   - User type: 외부(테스트)로 시작해도 됨
   - 앱 이름·이메일 입력
   - 범위에 `https://www.googleapis.com/auth/youtube.upload` 추가
   - **테스트 사용자**에 봄이콩이 채널을 소유한 구글 계정 추가
4. **사용자 인증 정보 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - 승인된 리디렉션 URI에 위의 `YOUTUBE_REDIRECT_URI`와 **같은** 주소 추가
   - 만든 뒤 클라이언트 ID·비밀을 복사 → Vercel에 `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_REDIRECT_URI` 저장
5. 사이트 재배포(또는 환경 변수 반영) 후 관리자 로그인
6. `/admin/youtube-connect` → **구글에서 허락받기**
   - **채널 주인 계정**으로 로그인·동의
   - 화면에 나온 값을 Vercel `YOUTUBE_REFRESH_TOKEN`에 넣고 다시 배포
7. 미공개 영상실에서 「유튜브 숏츠로 올리기」 사용

## 파일이 어디에 있나

- 목록 글(제목·파일명)은 이 기기 브라우저 기억(localStorage)
- 실제 영상 본문은 이 기기 IndexedDB 미리보기에 있을 수 있음
- 올리기 때: 미리보기 파일이 있으면 그걸 서버로 조각내어 보내고, 없으면 **같은 파일을 다시 고른 뒤** 올림
- 서버가 YouTube **재개 가능(resumable) 업로드**로 채널에 넣음 (비밀 값은 서버에만)

## 공개 범위

기본 **비공개**. 올릴 때 비공개 / 일부공개 / 공개 중 고를 수 있어요.
성공 후 공개 영상실로 옮기기 창이 열리고 유튜브 주소가 채워져요.

## 아직 안 하는 것

- 비밀 값을 저장소에 넣기
- 「올려」승인 없이 인터넷 배포
