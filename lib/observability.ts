type SpeedInsightsConfig = {
  enabled: boolean;
  sampleRate: number;
};

const DEFAULT_PREVIEW_SAMPLE_RATE = 0.25;
const DEFAULT_PRODUCTION_SAMPLE_RATE = 1;

function parseBooleanFlag(value: string | undefined, fallback = false) {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on", "enabled"].includes(value.trim().toLowerCase());
}

function parseSampleRate(value: string | undefined, fallback: number) {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (parsed < 0) {
    return 0;
  }

  if (parsed > 1) {
    return 1;
  }

  return parsed;
}

export function getSpeedInsightsConfig(): SpeedInsightsConfig {
  const isVercelRuntime = Boolean(process.env.VERCEL);
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const defaultSampleRate =
    vercelEnv === "preview" ? DEFAULT_PREVIEW_SAMPLE_RATE : DEFAULT_PRODUCTION_SAMPLE_RATE;
  const enabled = isVercelRuntime && parseBooleanFlag(process.env.ENABLE_SPEED_INSIGHTS, false);

  return {
    enabled,
    sampleRate: parseSampleRate(process.env.NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE, defaultSampleRate),
  };
}
