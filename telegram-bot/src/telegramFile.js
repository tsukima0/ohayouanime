import fetch from "node-fetch";

/**
 * Resolve a Telegram file_id into a streamable HTTPS response.
 * NOTE: Telegram Bot API caps file downloads at 20 MB by default. For large
 * H.264 videos, run a local Telegram Bot API server (TDLib) on the same host,
 * which lifts the limit to 2 GB. Point TELEGRAM_API_ROOT at it if used.
 */
export async function getTelegramFileStream(telegram, fileId) {
  const apiRoot = process.env.TELEGRAM_API_ROOT || "https://api.telegram.org";
  const token = process.env.TELEGRAM_BOT_TOKEN;

  const file = await telegram.getFile(fileId);
  const url = `${apiRoot}/file/bot${token}/${file.file_path}`;

  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to fetch Telegram file: ${res.status} ${res.statusText}`);
  }
  return {
    stream: res.body,                     // Node Readable (web stream in Node 18+ also works with lib-storage)
    size: file.file_size ?? null,
    suggestedName: file.file_path?.split("/").pop() || fileId,
  };
}
