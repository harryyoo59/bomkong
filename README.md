# 봄이콩이 (BomKong) 웹 뼈대

한국어 UI · 핸드폰(390) 느낌 · Next.js App Router.

## 실행

```bash
cd /agent/bomkong
npm install
npm run dev
```

브라우저에서 http://localhost:3000

## 화면

| 경로 | 내용 |
|------|------|
| `/` | 홈 · 이어보기 시작 |
| `/watch/[id]?lang=ko\|en` | 재생 · 한→영→다음 한 |
| `/episodes` | 편 목록 |
| `/subscribe` | 정기 구독 맛보기 |
| `/admin` | 편 올리기 (화면만 저장) |
| `/rules` | 영상규칙 보관소 안내 |

## 빌드

```bash
npm run build
```
