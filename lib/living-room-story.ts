/** 로비 한 줄 안내 — 짧을 때만 자막, 길면 말만 */

export type LivingStoryTarget =
  | "room"
  | "tv"
  | "frames"
  | "comment"
  | "sofa"
  | "door"
  | "menu";

export type LivingStoryBeat = {
  id: string;
  target: LivingStoryTarget;
  /** 화면에 한 줄로 보여줄 말. 길면 비워 두고 소리만 */
  caption: string;
  /** 읽어 줄 말 (항상) */
  speak: string;
};

/** 봄이가 콩이에게 거실을 알려 주는 짧은 순서 */
export const LIVING_ROOM_BEATS: LivingStoryBeat[] = [
  {
    id: "hello",
    target: "room",
    caption: "콩아, 여기가 우리 거실이야",
    speak: "콩아, 여기가 우리 봄이콩이 거실이야.",
  },
  {
    id: "tv",
    target: "tv",
    caption: "콩아 리모컨 눌러봐 / 응 누나",
    speak: "왼쪽 큰 티비를 누르면 영상을 볼 수 있어. 콩아, 리모컨 눌러 봐. 응 누나!",
  },
  {
    id: "frames",
    target: "frames",
    caption: "벽 액자는 바로가기야",
    speak: "벽에 걸린 액자는 영상보기, 구독, 상품 바로가기야.",
  },
  {
    id: "comment",
    target: "comment",
    caption: "서랍장에서 댓글·의견",
    speak: "댓글쓰기 서랍장에서는 댓글도 쓰고, 관리자에게 의견도 보낼 수 있어.",
  },
  {
    id: "sofa",
    target: "sofa",
    caption: "소파 표시는 회사 홈",
    speak: "소파에 있는 표시를 누르면 우리 회사 홈페이지로 가요.",
  },
  {
    id: "door",
    target: "door",
    caption: "저 문은 관리자실",
    speak: "저 문은 관리자실이야. 어른 열쇠로만 들어갈 수 있어.",
  },
  {
    id: "menu",
    target: "menu",
    caption: "아래 칸도 같은 메뉴야",
    speak: "아래 큰 칸들도 같아. 영상보기, 구독, 상품, 댓글 쓰기가 있어요.",
  },
];
