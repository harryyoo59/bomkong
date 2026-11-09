import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export type MailboxFeedback = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  /** Soft spam signals only — never shown to guests */
  meta?: {
    ipHash?: string;
    userAgent?: string;
  };
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "mailbox-feedback.json");
const TMP_FILE = path.join("/tmp", "bomkong-mailbox-feedback.json");

const MAX_MESSAGE = 2000;
const MAX_NAME = 80;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

type RateBucket = { count: number; resetAt: number };
const rateByKey = new Map<string, RateBucket>();

function makeId(): string {
  return `fb-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

function hashIp(ip: string): string {
  // Short non-reversible-ish tag for rate/spam review (not a full hash library)
  let h = 0;
  for (let i = 0; i < ip.length; i += 1) {
    h = (h * 31 + ip.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

async function readFrom(filePath: string): Promise<MailboxFeedback[] | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is MailboxFeedback =>
        Boolean(row) &&
        typeof row === "object" &&
        typeof (row as MailboxFeedback).id === "string" &&
        typeof (row as MailboxFeedback).message === "string" &&
        typeof (row as MailboxFeedback).createdAt === "string",
    );
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return [];
    return null;
  }
}

async function writeTo(
  filePath: string,
  rows: MailboxFeedback[],
): Promise<boolean> {
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function listMailboxFeedback(): Promise<MailboxFeedback[]> {
  const primary = await readFrom(DATA_FILE);
  if (primary && primary.length > 0) return primary;
  const tmp = await readFrom(TMP_FILE);
  if (tmp) return tmp;
  return primary ?? [];
}

export async function appendMailboxFeedback(
  input: {
    name: string;
    message: string;
    ip?: string;
    userAgent?: string;
  },
): Promise<{ ok: true; item: MailboxFeedback } | { ok: false; error: string }> {
  const name = input.name.trim().slice(0, MAX_NAME);
  const message = input.message.trim().slice(0, MAX_MESSAGE);
  if (!message) {
    return { ok: false, error: "메시지를 적어 주세요." };
  }
  if (message.length < 2) {
    return { ok: false, error: "메시지를 조금 더 적어 주세요." };
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

  const item: MailboxFeedback = {
    id: makeId(),
    name,
    message,
    createdAt: new Date().toISOString(),
    meta: {
      ipHash: input.ip ? hashIp(input.ip) : undefined,
      userAgent: input.userAgent?.slice(0, 180),
    },
  };

  const existing = await listMailboxFeedback();
  const next = [item, ...existing].slice(0, 500);
  const savedPrimary = await writeTo(DATA_FILE, next);
  if (!savedPrimary) {
    const savedTmp = await writeTo(TMP_FILE, next);
    if (!savedTmp) {
      return { ok: false, error: "지금은 저장할 수 없어요. 잠시 뒤 다시 해 주세요." };
    }
  } else {
    // Mirror to tmp so cold serverless instances can still find recent writes when data/ is ephemeral
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

export const MAILBOX_LIMITS = {
  maxMessage: MAX_MESSAGE,
  maxName: MAX_NAME,
} as const;
