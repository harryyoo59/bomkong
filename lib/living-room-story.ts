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

export type LivingStorySpeaker = "bomi" | "kongi";

export type LivingStoryBeat = {
  id: string;
  target: LivingStoryTarget;
  speaker: LivingStorySpeaker;
  speak: string;
  /** 미리 만든 6살 봄이 / 4살 콩이 목소리 (콩이 「응 누나」는 영상 속 진짜 목소리) */
  audioSrc: string;
};

export const LIVING_ROOM_BEATS: LivingStoryBeat[] = [
  {
    id: "hello",
    target: "room",
    speaker: "bomi",
    speak: "콩아, 여기가 우리 봄이콩이 거실이야.",
    audioSrc: "/living-room/story/hello.mp3?v=5",
  },
  {
    id: "tv",
    target: "tv",
    speaker: "bomi",
    speak: "왼쪽 큰 티비를 누르면 영상을 볼 수 있어. 콩아, 리모컨 눌러 봐.",
    audioSrc: "/living-room/story/tv.mp3?v=5",
  },
  {
    id: "tv-reply",
    target: "tv",
    speaker: "kongi",
    speak: "응 누나!",
    audioSrc: "/living-room/story/tv-reply.mp3?v=5",
  },
  {
    id: "frames",
    target: "frames",
    speaker: "bomi",
    speak: "벽에 걸린 액자는 영상보기, 구독, 상품 바로가기야.",
    audioSrc: "/living-room/story/frames.mp3?v=5",
  },
  {
    id: "comment",
    target: "comment",
    speaker: "bomi",
    speak: "서랍장 위 노트북은 댓글 쓰는 곳이야.",
    audioSrc: "/living-room/story/comment.mp3?v=5",
  },
  {
    id: "mailbox",
    target: "mailbox",
    speaker: "bomi",
    speak: "서랍장 앞 우편함은 관리자에게 의견 보내는 곳이야.",
    audioSrc: "/living-room/story/mailbox.mp3?v=5",
  },
  {
    id: "sofa",
    target: "sofa",
    speaker: "bomi",
    speak: "소파 옆 수건 위 표시를 누르면 우리 회사 홈페이지로 가요.",
    audioSrc: "/living-room/story/sofa.mp3?v=6",
  },
  {
    id: "door",
    target: "door",
    speaker: "bomi",
    speak: "저 문은 관리자실이야. 어른 열쇠로만 들어갈 수 있어.",
    audioSrc: "/living-room/story/door.mp3?v=5",
  },
  {
    id: "menu",
    target: "menu",
    speaker: "bomi",
    speak: "아래 큰 칸들도 같아. 하나씩 눌러 보면 돼.",
    audioSrc: "/living-room/story/menu.mp3?v=5",
  },
];
