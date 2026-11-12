/** 로비 스토리 안내 (말은 재생, 자막은 없어도 됨) */

export type LivingStoryTarget =
  | "room"
  | "tv"
  | "frames"
  | "comment"
  | "mailbox"
  | "sofa"
  | "door"
  | "menu";

export type LivingStoryBeat = {
  id: string;
  target: LivingStoryTarget;
  speak: string;
};

export const LIVING_ROOM_BEATS: LivingStoryBeat[] = [
  {
    id: "hello",
    target: "room",
    speak: "콩아, 여기가 우리 봄이콩이 거실이야.",
  },
  {
    id: "tv",
    target: "tv",
    speak: "왼쪽 큰 티비를 누르면 영상을 볼 수 있어. 콩아, 리모컨 눌러 봐.",
  },
  {
    id: "tv-reply",
    target: "tv",
    speak: "응 누나!",
  },
  {
    id: "frames",
    target: "frames",
    speak: "벽에 걸린 액자는 영상보기, 구독, 상품 바로가기야.",
  },
  {
    id: "comment",
    target: "comment",
    speak: "서랍장 위 노트북은 댓글 쓰는 곳이야.",
  },
  {
    id: "mailbox",
    target: "mailbox",
    speak: "서랍장 앞 우편함은 관리자에게 의견 보내는 곳이야.",
  },
  {
    id: "sofa",
    target: "sofa",
    speak: "소파에 있는 표시를 누르면 우리 회사 홈페이지로 가요.",
  },
  {
    id: "door",
    target: "door",
    speak: "저 문은 관리자실이야. 어른 열쇠로만 들어갈 수 있어.",
  },
  {
    id: "menu",
    target: "menu",
    speak: "아래 큰 칸들도 같아. 하나씩 눌러 보면 돼.",
  },
];
