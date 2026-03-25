import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2] || "deploy/render/backend-staging.env.example";
const resolvedPath = path.resolve(process.cwd(), inputPath);

function pushMessage(collection, message) {
  collection.push(message);
}

function readEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function isBlank(value) {
  return `${value || ""}`.trim() === "";
}

function isPlaceholder(value) {
  const normalized = `${value || ""}`.trim().toLowerCase();
  return (
    !normalized ||
    normalized.includes("replace-me") ||
    normalized.includes("replace-with") ||
    normalized.includes("example.com") ||
    normalized.includes("db-host")
  );
}

function isTrue(value) {
  return `${value || ""}`.trim().toLowerCase() === "true";
}

function looksLikeHttpsUrl(value) {
  return /^https:\/\/.+/i.test(`${value || ""}`.trim());
}

function looksLikeJdbcPostgres(value) {
  return /^jdbc:postgresql:\/\/.+/i.test(`${value || ""}`.trim());
}

if (!fs.existsSync(resolvedPath)) {
  console.error(`Staging env file not found: ${resolvedPath}`);
  process.exit(1);
}

const env = readEnvFile(resolvedPath);
const errors = [];
const warnings = [];

if (`${env.SPRING_PROFILES_ACTIVE || ""}`.trim().toLowerCase() !== "prod") {
  pushMessage(errors, "SPRING_PROFILES_ACTIVE should be set to prod.");
}

if (!looksLikeJdbcPostgres(env.KFARMS_DB_URL) || isPlaceholder(env.KFARMS_DB_URL)) {
  pushMessage(errors, "KFARMS_DB_URL must be a real PostgreSQL JDBC URL.");
}

if (isPlaceholder(env.KFARMS_DB_USERNAME)) {
  pushMessage(errors, "KFARMS_DB_USERNAME must be set.");
}

if (isPlaceholder(env.KFARMS_DB_PASSWORD)) {
  pushMessage(errors, "KFARMS_DB_PASSWORD must be set.");
}

if (!looksLikeHttpsUrl(env.KFARMS_FRONTEND_BASE_URL) || isPlaceholder(env.KFARMS_FRONTEND_BASE_URL)) {
  pushMessage(errors, "KFARMS_FRONTEND_BASE_URL must be a real https URL.");
}

if (!looksLikeHttpsUrl(env.KFARMS_CORS_ALLOWED_ORIGINS) || isPlaceholder(env.KFARMS_CORS_ALLOWED_ORIGINS)) {
  pushMessage(errors, "KFARMS_CORS_ALLOWED_ORIGINS must be a real https URL.");
}

if (`${env.KFARMS_JWT_SECRET || ""}`.trim().length < 32 || isPlaceholder(env.KFARMS_JWT_SECRET)) {
  pushMessage(errors, "KFARMS_JWT_SECRET must be a real secret with at least 32 characters.");
}

if (!isTrue(env.KFARMS_COOKIE_SECURE)) {
  pushMessage(errors, "KFARMS_COOKIE_SECURE must be true for remote staging.");
}

if (`${env.KFARMS_COOKIE_SAMESITE || ""}`.trim().toLowerCase() !== "none") {
  pushMessage(warnings, "KFARMS_COOKIE_SAMESITE is usually None when frontend and backend are on different Render subdomains.");
}

if (isBlank(env.SERVER_PORT)) {
  pushMessage(warnings, "SERVER_PORT is blank. Render commonly expects the app to bind to port 10000.");
}

if (!isTrue(env.KFARMS_AUTH_VERIFICATION_PREVIEW_ENABLED)) {
  if (isBlank(env.KFARMS_SMTP_USERNAME) || isBlank(env.KFARMS_SMTP_PASSWORD)) {
    pushMessage(errors, "SMTP credentials are required when email verification preview mode is disabled.");
  }
} else {
  pushMessage(warnings, "Email verification preview is enabled for staging. Testers will not use real email delivery.");
}

if (isTrue(env.KFARMS_SMS_ENABLED) && isBlank(env.KFARMS_SMS_WEBHOOK_URL)) {
  pushMessage(errors, "KFARMS_SMS_WEBHOOK_URL is required when SMS is enabled.");
}

if (!errors.length) {
  console.log(`Staging env looks ready: ${resolvedPath}`);
  if (warnings.length) {
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }
  process.exit(0);
}

console.error(`Staging env validation failed for ${resolvedPath}`);
for (const error of errors) {
  console.error(`- ${error}`);
}

if (warnings.length) {
  console.error("Warnings:");
  for (const warning of warnings) {
    console.error(`- ${warning}`);
  }
}

process.exit(1);
