const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===================== CONFIG =====================
const IG_SESSION = process.env.INSTAGRAM_SESSION_ID;

if (!IG_SESSION) {
  console.error("❌ INSTAGRAM_SESSION_ID is missing in .env");
  process.exit(1);
}

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const USER_AGENTS = [
  "Instagram 289.0.0.77.109 Android",
  "Instagram 287.0.0.16.72 Android",
];

// ===================== HELPERS =====================
function shortcodeToId(shortcode) {
  let id = 0n;
  for (const char of shortcode) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error("Invalid shortcode character");
    id = id * 64n + BigInt(index);
  }
  return id.toString();
}

function validateInstagramUrl(url) {
  return url.match(
    /^https?:\/\/(www\.)?instagram\.com\/(reel|reels|p)\/([A-Za-z0-9_-]+)/
  );
}

function timeoutFetch(url, options = {}, timeout = 10000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);
}

// ===================== ROUTE =====================
app.get("/download", async (req, res) => {
  try {
    const { url } = req.query;

    // 1️⃣ Validate input
    if (!url) {
      return res.status(400).json({
        error: "MISSING_URL",
        message: "Instagram URL is required",
      });
    }

    const match = validateInstagramUrl(url);
    if (!match) {
      return res.status(400).json({
        error: "INVALID_URL",
        message: "Only Instagram reel, reels, or post URLs are supported",
      });
    }

    const shortcode = match[3];

    // 2️⃣ Convert shortcode → media ID
    let mediaId;
    try {
      mediaId = shortcodeToId(shortcode);
    } catch {
      return res.status(400).json({
        error: "INVALID_SHORTCODE",
        message: "Failed to decode Instagram shortcode",
      });
    }

    // 3️⃣ Fetch media info
    const igRes = await timeoutFetch(
      `https://i.instagram.com/api/v1/media/${mediaId}/info/`,
      {
        headers: {
          "User-Agent":
            USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          "Cookie": `sessionid=${IG_SESSION}`,
          "Accept": "*/*",
        },
      }
    );

    if (!igRes.ok) {
      return res.status(502).json({
        error: "INSTAGRAM_API_ERROR",
        message: "Instagram blocked or rate-limited the request",
      });
    }

    const data = await igRes.json();
    const video =
      data?.items?.[0]?.video_versions?.[0];

    if (!video?.url) {
      return res.status(404).json({
        error: "NO_VIDEO",
        message: "This post does not contain a downloadable video",
      });
    }

    // 4️⃣ Fetch video binary
    const videoRes = await timeoutFetch(video.url, {}, 15000);
    if (!videoRes.ok) {
      return res.status(502).json({
        error: "VIDEO_FETCH_FAILED",
        message: "Failed to download video from Instagram CDN",
      });
    }

    const buffer = Buffer.from(await videoRes.arrayBuffer());

    // 5️⃣ Send video
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="instagram-${shortcode}.mp4"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.send(buffer);

  } catch (err) {
    console.error("🔥 Server Error:", err.message);

    return res.status(500).json({
      error: "SERVER_ERROR",
      message: err.message || "Unexpected server error",
    });
  }
});

// ===================== START =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
