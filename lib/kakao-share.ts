/** 카카오톡으로 사이트 주소 알리기 */

const KAKAO_SDK_SRC =
  "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

type KakaoShareApi = {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: {
    sendDefault: (options: Record<string, unknown>) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoShareApi;
  }
}

function kakaoJsKey() {
  return process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim() || "";
}

function loadKakaoSdk(): Promise<KakaoShareApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 쓸 수 있어요."));
  }
  if (window.Kakao) return Promise.resolve(window.Kakao);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${KAKAO_SDK_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Kakao) resolve(window.Kakao);
        else reject(new Error("카카오톡 준비를 못 했어요."));
      });
      existing.addEventListener("error", () =>
        reject(new Error("카카오톡 준비를 못 했어요.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.onload = () => {
      if (window.Kakao) resolve(window.Kakao);
      else reject(new Error("카카오톡 준비를 못 했어요."));
    };
    script.onerror = () => reject(new Error("카카오톡 준비를 못 했어요."));
    document.head.appendChild(script);
  });
}

async function shareWithKakaoSdk(url: string, text: string) {
  const key = kakaoJsKey();
  if (!key) return false;

  const Kakao = await loadKakaoSdk();
  if (!Kakao.isInitialized()) {
    Kakao.init(key);
  }
  Kakao.Share.sendDefault({
    objectType: "text",
    text: `${text}\n${url}`,
    link: {
      mobileWebUrl: url,
      webUrl: url,
    },
  });
  return true;
}

/** 카카오톡 앱·연결이 없을 때: 글 복사 후 카톡 열기 시도 */
async function shareKakaoFallback(url: string, text: string) {
  const message = `${text}\n${url}`;
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);

  try {
    await navigator.clipboard.writeText(message);
  } catch {
    /* 복사 실패해도 앱 열기는 시도 */
  }

  if (isAndroid) {
    const intent =
      "intent://send/#Intent;" +
      "action=android.intent.action.SEND;" +
      "type=text/plain;" +
      `S.android.intent.extra.TEXT=${encodeURIComponent(message)};` +
      "package=com.kakao.talk;" +
      "end";
    window.location.href = intent;
    return "카카오톡으로 보내는 화면을 열었어요. 안 열리면 복사한 글을 카톡에 붙여 넣어 주세요.";
  }

  if (isIos) {
    window.location.href = "kakaotalk://";
    return "글을 복사했어요. 카카오톡이 열리면 붙여 넣어 주세요.";
  }

  window.open("https://www.kakao.com/talk", "_blank", "noopener,noreferrer");
  return "글을 복사했어요. 카카오톡에 붙여 넣어 주세요.";
}

/** 카카오톡으로 사이트 알리기. 안내 문장을 돌려줄 수 있음. */
export async function shareSiteViaKakao(
  url: string,
  text: string,
): Promise<string | null> {
  try {
    const usedSdk = await shareWithKakaoSdk(url, text);
    if (usedSdk) return null;
  } catch {
    /* 아래 대체 방법으로 */
  }
  return shareKakaoFallback(url, text);
}
