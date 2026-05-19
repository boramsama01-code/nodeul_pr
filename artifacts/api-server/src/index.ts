import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // ── 환경변수 로드 확인 ──
  const resendKey = process.env.RESEND_API_KEY;
  console.log("======================================");
  console.log("[STARTUP] RESEND_API_KEY loaded:", !!resendKey);
  if (resendKey) {
    console.log("[STARTUP] RESEND_API_KEY prefix:", resendKey.substring(0, 8) + "...");
  } else {
    console.log("[STARTUP] ⚠ RESEND_API_KEY is NOT set — emails will not be sent");
  }
  console.log("======================================");
});
