# 부모 이메일 로그인 — 사장님이 한 번만 맞춰 줄 설정

사이트 화면의 이메일 로그인이 **끝까지** 되려면, 인터넷 저장(Supabase) 쪽에
아래를 **한 번** 맞춰 주세요. 구글·애플은 당분간 안 켭니다.

## 1. 사이트 주소

1. [봄콩 저장소 인증 설정](https://supabase.com/dashboard/project/gjqekmpapsqozahabytt/auth/url-configuration) 을 열어요.
2. **Site URL** 을 아래로 맞춰요.

```text
https://www.bom-kong.com
```

3. **Redirect URLs** 에 아래를 **모두** 넣어요.

```text
https://www.bom-kong.com/auth/callback
https://www.bom-kong.com/auth/confirm
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
```

4. 저장해요.

## 2. 로그인 메일 문구 (권장)

메일 링크가 **다른 폰**에서도 잘 들어오게 하려면:

1. [메일 템플릿](https://supabase.com/dashboard/project/gjqekmpapsqozahabytt/auth/templates) 을 열어요.
2. **Magic Link** 와 **Confirm signup** 에서 확인 링크 자리를 아래로 바꿔요.

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/
```

3. (선택) 숫자 6자리도 쓰려면 같은 메일에 `{{ .Token }}` 한 줄을 넣어요.
4. 저장해요.

## 3. 호스팅 비밀값 (있으면 확인)

호스팅(Vercel 등)에 아래가 있으면 좋아요. 없으면 사이트 기본값을 씁니다.

```text
NEXT_PUBLIC_SITE_URL=https://www.bom-kong.com
```

## 확인 방법

1. 거실 → **로그인**
2. 본인 이메일로 **로그인 링크 받기**
3. 메일함(스팸함 포함)에서 링크를 누르거나, 숫자 6자리가 있으면 입력
4. 거실 왼쪽 아래가 **부모 나가기**로 바뀌면 성공

## 아직 안 하는 것

- 구글 로그인
- 애플 로그인
- 전화 로그인
