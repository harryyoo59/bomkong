/** 로비에서 봄이가 콩이에게 하나씩 알려 주는 이야기 */

export type LivingStoryTarget =
  | "room"
  | "tv"
  | "frames"
  | "comment"
  | "mailbox"
  | "sofa"
  | "door"
  | "menu";

export type LivingStoryLine = {
  speaker: "봄이" | "콩이";
  text: string;
};

export type LivingStoryStep = {
  id: string;
  target: LivingStoryTarget;
  title: string;
  lines: LivingStoryLine[];
};

export const LIVING_ROOM_STORY: LivingStoryStep[] = [
  {
    id: "hello",
    target: "room",
    title: "우리 거실",
    lines: [
      { speaker: "봄이", text: "콩아, 여기가 우리 봄이콩이 거실이야." },
      { speaker: "콩이", text: "와, 넓다 누나!" },
    ],
  },
  {
    id: "tv",
    target: "tv",
    title: "큰 티비",
    lines: [
      {
        speaker: "봄이",
        text: "왼쪽 큰 티비를 누르면 영상을 이어 볼 수 있어.",
      },
      { speaker: "콩이", text: "리모컨처럼 누르는 거지?" },
      { speaker: "봄이", text: "응. 콩아, 리모컨 눌러 봐." },
      { speaker: "콩이", text: "응 누나!" },
    ],
  },
  {
    id: "frames",
    target: "frames",
    title: "벽 액자",
    lines: [
      {
        speaker: "봄이",
        text: "벽에 걸린 액자는 바로가기야. 영상보기·구독·상품이 있어.",
      },
      { speaker: "콩이", text: "액자마다 다른 문이구나!" },
    ],
  },
  {
    id: "comment",
    target: "comment",
    title: "댓글쓰기 책상",
    lines: [
      {
        speaker: "봄이",
        text: "책상은 댓글 쓰는 곳이야. 보고 난 기분을 남길 수 있어.",
      },
      { speaker: "콩이", text: "나는 하트 많이 그릴래." },
    ],
  },
  {
    id: "mailbox",
    target: "mailbox",
    title: "우편함",
    lines: [
      {
        speaker: "봄이",
        text: "문 옆 우편함은 관리자에게 의견 보내는 곳이야.",
      },
      { speaker: "콩이", text: "편지도 넣을 수 있어?" },
      { speaker: "봄이", text: "응, 하고 싶은 말을 적으면 돼." },
    ],
  },
  {
    id: "sofa",
    target: "sofa",
    title: "소파 로고",
    lines: [
      {
        speaker: "봄이",
        text: "소파에 있는 표시를 누르면 우리 회사 이야기로 갈 수 있어.",
      },
      { speaker: "콩이", text: "신기하다!" },
    ],
  },
  {
    id: "door",
    target: "door",
    title: "관리자실 문",
    lines: [
      {
        speaker: "봄이",
        text: "저 문은 관리자실이야. 어른이 열쇠로만 들어갈 수 있어.",
      },
      { speaker: "콩이", text: "나는 거실에서 놀게!" },
    ],
  },
  {
    id: "menu",
    target: "menu",
    title: "아래 메뉴",
    lines: [
      {
        speaker: "봄이",
        text: "아래 큰 칸들도 같아. 영상보기, 구독, 상품, 댓글 쓰기…",
      },
      { speaker: "콩이", text: "하나씩 눌러 볼게 누나!" },
      { speaker: "봄이", text: "좋아. 천천히 같이 보자." },
    ],
  },
];
