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
| `/` | 거실 홈 (영상+웹 메뉴·문) |
| `/watch/[id]?lang=ko\|en` | 재생 · 한→영→다음 한 |
| `/episodes` | 편 목록 |
| `/subscribe` | 정기 구독 맛보기 |
| `/goods` | 캐릭터 상품 (결제 없음·상태만) |
| `/admin` | 관리자 공부방 (서버 열쇠 필요) |
| `/admin/upload` | 편 올리기 |
| `/admin/login` | 관리자실 문 확인 |
| `/rules` | 영상규칙 보관소 안내 |

관리자 열쇠 설정: [docs/admin-auth-setup.md](docs/admin-auth-setup.md)

## 빌드

```bash
npm run build
```
