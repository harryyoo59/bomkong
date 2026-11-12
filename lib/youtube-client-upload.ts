/** Browser helper: stream a File/Blob to our chunked YouTube Shorts proxy. */

export type YoutubePrivacyStatus = "private" | "unlisted" | "public";

export type ShortsUploadProgress = {
  phase: "start" | "upload" | "done";
  sentBytes: number;
  totalBytes: number;
};

export type ShortsUploadResult = {
  videoId: string;
  watchUrl: string;
  shortsUrl: string;
  title: string;
  privacyStatus: YoutubePrivacyStatus;
};

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function uploadShortViaServer(input: {
  file: Blob;
  title: string;
  privacyStatus: YoutubePrivacyStatus;
  note?: string;
  fileName?: string;
  onProgress?: (p: ShortsUploadProgress) => void;
}): Promise<ShortsUploadResult> {
  const mimeType =
    input.file.type ||
    (input.fileName?.toLowerCase().endsWith(".webm")
      ? "video/webm"
      : "video/mp4");
  const totalSize = input.file.size;
  if (!totalSize) {
    throw new Error("올릴 파일이 비어 있어요.");
  }

  input.onProgress?.({
    phase: "start",
    sentBytes: 0,
    totalBytes: totalSize,
  });

  const startRes = await fetch("/api/admin/youtube/shorts/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      privacyStatus: input.privacyStatus,
      mimeType,
      totalSize,
      note: input.note || "",
    }),
  });
  const startJson = await readJson(startRes);
  if (!startRes.ok || startJson.ok !== true) {
    throw new Error(
      typeof startJson.error === "string"
        ? startJson.error
        : "유튜브 올리기 준비에 실패했어요.",
    );
  }

  const uploadToken = String(startJson.uploadToken ?? "");
  const chunkBytes = Number(startJson.chunkBytes) || 2 * 1024 * 1024;
  if (!uploadToken) {
    throw new Error("올리기 자리를 받지 못했어요.");
  }

  let offset = 0;
  while (offset < totalSize) {
    const end = Math.min(offset + chunkBytes, totalSize);
    const chunk = input.file.slice(offset, end);
    const buf = await chunk.arrayBuffer();

    const chunkRes = await fetch("/api/admin/youtube/shorts/chunk", {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Upload-Token": uploadToken,
        "X-Upload-Offset": String(offset),
      },
      body: buf,
    });
    const chunkJson = await readJson(chunkRes);
    if (!chunkRes.ok || chunkJson.ok !== true) {
      throw new Error(
        typeof chunkJson.error === "string"
          ? chunkJson.error
          : "유튜브로 파일을 보내는 중 실패했어요.",
      );
    }

    if (chunkJson.done === true) {
      input.onProgress?.({
        phase: "done",
        sentBytes: totalSize,
        totalBytes: totalSize,
      });
      return {
        videoId: String(chunkJson.videoId ?? ""),
        watchUrl: String(chunkJson.watchUrl ?? ""),
        shortsUrl: String(chunkJson.shortsUrl ?? ""),
        title: String(chunkJson.title ?? input.title),
        privacyStatus: (chunkJson.privacyStatus as YoutubePrivacyStatus) ||
          input.privacyStatus,
      };
    }

    const nextOffset = Number(chunkJson.nextOffset);
    offset = Number.isFinite(nextOffset) ? nextOffset : end;
    input.onProgress?.({
      phase: "upload",
      sentBytes: Math.min(offset, totalSize),
      totalBytes: totalSize,
    });
  }

  throw new Error("올리기가 끝나지 않았어요. 다시 시도해 주세요.");
}
