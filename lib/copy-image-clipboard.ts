/** 사진을 클립보드에 복사 (사파리: write를 클릭 직후 바로 호출) */

async function blobToPng(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") return blob;
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("사진을 읽지 못했어요."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    if (canvas.width < 1 || canvas.height < 1) {
      throw new Error("사진을 복사하지 못했어요.");
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("사진을 복사하지 못했어요.");
    ctx.drawImage(img, 0, 0);
    const png = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png");
    });
    if (!png) throw new Error("사진을 복사하지 못했어요.");
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function downloadPng(png: Blob, fileName: string): Promise<void> {
  const url = URL.createObjectURL(png);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, "") + ".png" || "image.png";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

/**
 * PNG Promise를 클립보드에 씀. write는 동기적으로 시작해야 사파리에서 됨.
 * 실패 시 파일로 받고, 안내 문구용 Error를 throw.
 */
export function copyPngPromiseToClipboard(
  pngPromise: Promise<Blob>,
  fileName: string,
): Promise<void> {
  const canWriteImage =
    typeof navigator !== "undefined" &&
    Boolean(navigator.clipboard?.write) &&
    typeof ClipboardItem !== "undefined" &&
    !/firefox/i.test(navigator.userAgent || "");

  if (!canWriteImage) {
    return pngPromise
      .then((png) => downloadPng(png, fileName))
      .then(() => {
        throw new Error(
          "이 기기에서는 복사가 안 돼서 파일로 받아 두었어요. AI에 그 파일을 넣어 주세요.",
        );
      });
  }

  return navigator.clipboard
    .write([
      new ClipboardItem({
        "image/png": pngPromise,
      }),
    ])
    .catch(async () => {
      try {
        const png = await pngPromise;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": png }),
        ]);
      } catch {
        const png = await pngPromise;
        await downloadPng(png, fileName);
        throw new Error(
          "복사가 안 돼서 파일로 받아 두었어요. AI에 그 파일을 넣어 주세요.",
        );
      }
    });
}

export async function pngFromBlob(blob: Blob): Promise<Blob> {
  return blobToPng(blob);
}

export async function pngFromImageUrl(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("로고 그림을 불러오지 못했어요.");
  const blob = await res.blob();
  return blobToPng(blob);
}
