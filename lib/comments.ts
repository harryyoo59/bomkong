import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { COMMENT_LIMITS } from "@/lib/comment-limits";

export type GuestComment = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  meta?: {
    ipHash?: string;
    userAgent?: string;
  };
};

export { COMMENT_LIMITS };

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "comments.json");
const TMP_FILE = path.join("/tmp", "bomkong-comments.json");

const MAX_MESSAGE = COMMENT_LIMITS.maxMessage;
const MAX_NAME = COMMENT_LIMITS.maxName;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

type RateBucket = { count: number; resetAt: number };
const rateByKey = new Map<string, RateBucket>();

function makeId(): string {
  return `cm-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

function hashIp(ip: string): string {
  let h = 0;
  for (let i = 0; i < ip.length; i += 1) {
    h = (h * 31 + ip.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

async function readFrom(filePath: string): Promise<GuestComment[] | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is GuestComment =>
        Boolean(row) &&
        typeof row === "object" &&
        typeof (row as GuestComment).id === "string" &&
        typeof (row as GuestComment).message === "string" &&
        typeof (row as GuestComment).createdAt === "string",
    );
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return [];
    return null;
  }
}

async function writeTo(
  filePath: string,
  rows: GuestComment[],
): Promise<boolean> {
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function listComments(): Promise<GuestComment[]> {
  const primary = await readFrom(DATA_FILE);
  if (primary && primary.length > 0) return primary;
  const tmp = await readFrom(TMP_FILE);
  if (tmp) return tmp;
  return primary ?? [];
}

export async function appendComment(input: {
  name: string;
  message: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ ok: true; item: GuestComment } | { ok: false; error: string }> {
  const name = input.name.trim().slice(0, MAX_NAME);
  const message = input.message.trim().slice(0, MAX_MESSAGE);
  if (!message) {
    return { ok: false, error: "하고 싶은 말을 적어 주세요." };
  }
  if (message.length < 2) {
    return { ok: false, error: "한 글자로는 부족해요. 조금만 더 적어 주세요." };
  }

  const rateKey = input.ip?.trim() || "unknown";
  const now = Date.now();
  const bucket = rateByKey.get(rateKey);
  if (!bucket || now > bucket.resetAt) {
    rateByKey.set(rateKey, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    bucket.count += 1;
    if (bucket.count > RATE_MAX) {
      return {
        ok: false,
        error: "너무 자주 보냈어요. 잠시 뒤에 다시 해 주세요.",
      };
    }
  }

  const item: GuestComment = {
    id: makeId(),
    name: name || "친구",
    message,
    createdAt: new Date().toISOString(),
    meta: {
      ipHash: input.ip ? hashIp(input.ip) : undefined,
      userAgent: input.userAgent?.slice(0, 180),
    },
  };

  const existing = await listComments();
  const next = [item, ...existing].slice(0, 200);
  const savedPrimary = await writeTo(DATA_FILE, next);
  if (!savedPrimary) {
    const savedTmp = await writeTo(TMP_FILE, next);
    if (!savedTmp) {
      return {
        ok: false,
        error: "지금은 저장할 수 없어요. 잠시 뒤 다시 해 주세요.",
      };
    }
  } else {
    await writeTo(TMP_FILE, next);
  }

  return { ok: true, item };
}

export function looksLikeSpam(fields: {
  honeypot?: string;
  message: string;
  name: string;
}): boolean {
  if (fields.honeypot && fields.honeypot.trim().length > 0) return true;
  const msg = fields.message.toLowerCase();
  if (/(https?:\/\/|www\.)/i.test(msg) && msg.split(/\s+/).length < 4) {
    return true;
  }
  if (/(viagra|casino|crypto\s*giveaway|비트코인\s*투자)/i.test(msg)) {
    return true;
  }
  return false;
}

export function toPublicComment(item: GuestComment): {
  id: string;
  name: string;
  message: string;
  createdAt: string;
} {
  return {
    id: item.id,
    name: item.name || "친구",
    message: item.message,
    createdAt: item.createdAt,
  };
}
