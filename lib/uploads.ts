export type UploadValidationRule = {
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  emptyMessage: string;
  maxBytes: number;
  sizeMessage: string;
  typeMessage: string;
};

export const BRANDING_ASSET_UPLOAD_RULE: UploadValidationRule = {
  allowedExtensions: [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"],
  allowedMimeTypes: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "image/x-icon",
    "image/vnd.microsoft.icon",
  ],
  emptyMessage: "Choose a branding file before saving.",
  maxBytes: 1024 * 1024,
  sizeMessage: "Keep branding files under 1 MB.",
  typeMessage: "Upload a PNG, JPG, WEBP, SVG, or ICO file.",
};

export const INTAKE_PHOTO_UPLOAD_RULE: UploadValidationRule = {
  allowedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  emptyMessage: "Choose an intake image before starting photo-to-intake.",
  maxBytes: 6 * 1024 * 1024,
  sizeMessage: "Keep intake photos under 6 MB.",
  typeMessage: "Upload a JPG, PNG, or WEBP intake photo.",
};

export const CSV_UPLOAD_RULE: UploadValidationRule = {
  allowedExtensions: [".csv"],
  allowedMimeTypes: ["text/csv", "application/csv", "application/vnd.ms-excel"],
  emptyMessage: "Choose a CSV file before continuing.",
  maxBytes: 5 * 1024 * 1024,
  sizeMessage: "Keep CSV files under 5 MB.",
  typeMessage: "Upload a CSV file.",
};

export function formatUploadLimit(maxBytes: number) {
  if (maxBytes >= 1024 * 1024) {
    const megabytes = maxBytes / (1024 * 1024);
    return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
  }

  return `${Math.ceil(maxBytes / 1024)} KB`;
}

export function validateUploadFile(
  file: Pick<File, "name" | "size" | "type"> | null | undefined,
  rule: UploadValidationRule,
) {
  if (!file || !file.name || file.size === 0) {
    return rule.emptyMessage;
  }

  const normalizedName = file.name.toLowerCase();
  const matchesExtension = rule.allowedExtensions.some((extension) =>
    normalizedName.endsWith(extension),
  );
  const matchesMimeType = file.type ? rule.allowedMimeTypes.includes(file.type) : false;

  if (!matchesExtension && !matchesMimeType) {
    return rule.typeMessage;
  }

  if (file.size > rule.maxBytes) {
    return rule.sizeMessage;
  }

  return null;
}
