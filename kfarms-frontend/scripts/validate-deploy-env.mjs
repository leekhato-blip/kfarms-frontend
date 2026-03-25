import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2] || ".env";
const resolvedPath = path.resolve(process.cwd(), inputPath);

function fail(message, errors) {
  errors.push(message);
}

function warn(message, warnings) {
  warnings.push(message);
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

function boolValue(value) {
  return `${value || ""}`.trim().toLowerCase() === "true";
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
    normalized.includes("api.example.com")
  );
}

function looksLikeHttpsUrl(value) {
  return /^https:\/\/.+/i.test(`${value || ""}`.trim());
}

if (!fs.existsSync(resolvedPath)) {
  console.error(`Deployment env file not found: ${resolvedPath}`);
  process.exit(1);
}

const env = readEnvFile(resolvedPath);
const errors = [];
const warnings = [];

if (isPlaceholder(env.POSTGRES_PASSWORD)) {
  fail("Set a real POSTGRES_PASSWORD.", errors);
}

if (isPlaceholder(env.KFARMS_PUBLIC_URL) || !looksLikeHttpsUrl(env.KFARMS_PUBLIC_URL)) {
  fail("KFARMS_PUBLIC_URL must be a real https URL.", errors);
}

if (isPlaceholder(env.KFARMS_JWT_SECRET) || `${env.KFARMS_JWT_SECRET || ""}`.trim().length < 32) {
  fail("KFARMS_JWT_SECRET must be a real secret with at least 32 characters.", errors);
}

if (!boolValue(env.KFARMS_COOKIE_SECURE)) {
  fail("KFARMS_COOKIE_SECURE must be true in production.", errors);
}

if (isPlaceholder(env.KFARMS_CORS_ALLOWED_ORIGINS)) {
  fail("KFARMS_CORS_ALLOWED_ORIGINS must be set to your real public app URL.", errors);
}

if (boolValue(env.KFARMS_AUTH_VERIFICATION_PREVIEW_ENABLED)) {
  fail("KFARMS_AUTH_VERIFICATION_PREVIEW_ENABLED must be false in production.", errors);
}

if (boolValue(env.KFARMS_SMS_PREVIEW_LOGGING_ENABLED)) {
  fail("KFARMS_SMS_PREVIEW_LOGGING_ENABLED must be false in production.", errors);
}

if (isBlank(env.KFARMS_SMTP_HOST) || isBlank(env.KFARMS_SMTP_PORT)) {
  fail("SMTP host and port are required for email verification and password reset.", errors);
}

if (isBlank(env.KFARMS_SMTP_USERNAME) || isBlank(env.KFARMS_SMTP_PASSWORD)) {
  fail("SMTP username and password are required for production email delivery.", errors);
}

if (!boolValue(env.KFARMS_SMS_ENABLED)) {
  fail("KFARMS_SMS_ENABLED must be true if phone verification is required in production.", errors);
}

if (isBlank(env.KFARMS_SMS_WEBHOOK_URL) || !looksLikeHttpsUrl(env.KFARMS_SMS_WEBHOOK_URL)) {
  fail("KFARMS_SMS_WEBHOOK_URL must be set to a real https endpoint for SMS delivery.", errors);
}

if (isBlank(env.KFARMS_SMS_API_KEY)) {
  warn("KFARMS_SMS_API_KEY is blank. Leave this only if your SMS provider webhook does not require bearer auth.", warnings);
}

if (boolValue(env.KFARMS_PAYSTACK_ENABLED)) {
  if (isBlank(env.KFARMS_PAYSTACK_SECRET_KEY)) {
    fail("KFARMS_PAYSTACK_SECRET_KEY is required when Paystack billing is enabled.", errors);
  }
  if (isBlank(env.KFARMS_PAYSTACK_PRO_MONTHLY_PLAN_CODE)) {
    fail("KFARMS_PAYSTACK_PRO_MONTHLY_PLAN_CODE is required when Paystack billing is enabled.", errors);
  }
} else {
  warn("KFARMS_PAYSTACK_ENABLED is false, so live subscription checkout will stay unavailable.", warnings);
}

const backendContext = `${env.KFARMS_BACKEND_BUILD_CONTEXT || ""}`.trim();
if (!backendContext) {
  fail("KFARMS_BACKEND_BUILD_CONTEXT must point to the backend repo on the deploy machine.", errors);
} else if (!fs.existsSync(backendContext)) {
  warn(`KFARMS_BACKEND_BUILD_CONTEXT does not exist on this machine: ${backendContext}`, warnings);
}

if (errors.length) {
  console.error(`Deployment env validation failed for ${resolvedPath}`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  if (warnings.length) {
    console.error("Warnings:");
    for (const warningMessage of warnings) {
      console.error(`- ${warningMessage}`);
    }
  }
  process.exit(1);
}

console.log(`Deployment env looks ready: ${resolvedPath}`);
if (warnings.length) {
  console.log("Warnings:");
  for (const warningMessage of warnings) {
    console.log(`- ${warningMessage}`);
  }
}
