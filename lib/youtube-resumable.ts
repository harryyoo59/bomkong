import type { YoutubePrivacyStatus } from "@/lib/youtube-upload-session";

const UPLOAD_ENDPOINT =
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

export type StartResumableInput = {
  accessToken: string;
  title: string;
  description?: string;
  privacyStatus: YoutubePrivacyStatus;
  mimeType: string;
};

export type ChunkUploadResult =
  | { done: false; nextOffset: number }
  | {
      done: true;
      videoId: string;
      watchUrl: string;
      shortsUrl: string;
    };

function buildShortsDescription(title: string, extra?: string): string {
  const base = (extra || "").trim();
  const lines = [
    title.trim(),
    "",
    "#Shorts",
    "봄이콩이 · BomKong",
  ];
  if (base) lines.push("", base);
  return lines.join("\n").slice(0, 4900);
}

/** Step 1: ask YouTube for a resumable upload Location URL. */
export async function startYoutubeResumableUpload(
  input: StartResumableInput,
): Promise<string> {
  const body = {
    snippet: {
      title: input.title.slice(0, 100),
      description: buildShortsDescription(input.title, input.description),
      categoryId: "22",
    },
    status: {
      privacyStatus: input.privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };

  const res = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": input.mimeType || "video/*",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = (await res.json()) as {
        error?: { message?: string };
      };
      detail = errJson.error?.message || "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(
      detail
        ? `유튜브 올리기 준비 실패: ${detail}`
        : `유튜브 올리기 준비 실패 (${res.status})`,
    );
  }

  const location = res.headers.get("location");
  if (!location) {
    throw new Error("유튜브 올리기 주소를 받지 못했어요.");
  }
  return location;
}

/** Step 2: PUT one byte range to the resumable Location (proxied server-side). */
export async function putYoutubeUploadChunk(input: {
  uploadUrl: string;
  chunk: Uint8Array;
  offset: number;
  totalSize: number;
  mimeType: string;
}): Promise<ChunkUploadResult> {
  const end = input.offset + input.chunk.length - 1;
  // Copy into a plain ArrayBuffer view so fetch BodyInit accepts it under DOM typings.
  const bodyBytes = new Uint8Array(input.chunk.byteLength);
  bodyBytes.set(input.chunk);
  const res = await fetch(input.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.mimeType || "application/octet-stream",
      "Content-Length": String(bodyBytes.length),
      "Content-Range": `bytes ${input.offset}-${end}/${input.totalSize}`,
    },
    body: bodyBytes,
  });

  // 308 Resume Incomplete — more bytes needed
  if (res.status === 308) {
    const range = res.headers.get("range"); // e.g. bytes=0-524287
    let nextOffset = end + 1;
    if (range) {
      const m = /bytes=0-(\d+)/.exec(range);
      if (m) nextOffset = Number(m[1]) + 1;
    }
    return { done: false, nextOffset };
  }

  if (res.status === 200 || res.status === 201) {
    const data = (await res.json()) as { id?: string };
    const videoId = String(data.id ?? "");
    if (!videoId) {
      throw new Error("올린 뒤 영상 번호를 받지 못했어요.");
    }
    return {
      done: true,
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      shortsUrl: `https://www.youtube.com/shorts/${videoId}`,
    };
  }

  let detail = "";
  try {
    const errJson = (await res.json()) as { error?: { message?: string } };
    detail = errJson.error?.message || "";
  } catch {
    detail = await res.text().catch(() => "");
  }
  throw new Error(
    detail
      ? `유튜브로 파일 보내는 중 실패: ${detail}`
      : `유튜브로 파일 보내는 중 실패 (${res.status})`,
  );
}
