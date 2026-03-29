import { z } from "zod";

export const themePresetKeys = ["day", "night", "noir", "notepad", "custom"] as const;
export const fontPairKeys = [
  "system-sans",
  "editorial-serif",
  "humanist-sans",
  "notepad-mono",
] as const;

export const themePresetKeySchema = z.enum(themePresetKeys);
export const fontPairKeySchema = z.enum(fontPairKeys);

export type ThemePresetKey = z.infer<typeof themePresetKeySchema>;
export type FontPairKey = z.infer<typeof fontPairKeySchema>;

export type ThemeRecipe = {
  accent_color: string;
  border_color: string;
  canvas_color: string;
  card_color: string;
  font_pair_key: FontPairKey;
  imagery_prompt: string | null;
  primary_color: string;
  surface_tint: string;
  theme_preset_key: ThemePresetKey;
};

type ThemePreset = {
  description: string;
  label: string;
  recipe: ThemeRecipe;
};

export const fontPairTokens: Record<
  FontPairKey,
  { body: string; heading: string }
> = {
  "editorial-serif": {
    body: '"Public Sans", "Avenir Next", "Segoe UI", sans-serif',
    heading: '"Iowan Old Style", "Georgia", serif',
  },
  "humanist-sans": {
    body: '"Optima", "Segoe UI", "Helvetica Neue", sans-serif',
    heading: '"Optima", "Segoe UI", "Helvetica Neue", sans-serif',
  },
  "notepad-mono": {
    body: '"Courier Prime", "SFMono-Regular", "SF Mono", monospace',
    heading: '"Courier Prime", "SFMono-Regular", "SF Mono", monospace',
  },
  "system-sans": {
    body: '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
    heading: '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
  },
};

export const themePresets: Record<Exclude<ThemePresetKey, "custom">, ThemePreset> = {
  day: {
    description: "Bright neutral workspace with restrained contrast and clear utility surfaces.",
    label: "Day",
    recipe: {
      accent_color: "#d9d2c4",
      border_color: "#ddd6ce",
      canvas_color: "#f4efe8",
      card_color: "#fffdf8",
      font_pair_key: "system-sans",
      imagery_prompt: "Documentary photography, daylight interiors, organized desks, community service operations.",
      primary_color: "#1f1a17",
      surface_tint: "#efe8dd",
      theme_preset_key: "day",
    },
  },
  night: {
    description: "Dusky operations workspace with softer contrast and cooler surface tones.",
    label: "Night",
    recipe: {
      accent_color: "#557a9d",
      border_color: "#c7d0da",
      canvas_color: "#e9eef3",
      card_color: "#f8fafc",
      font_pair_key: "humanist-sans",
      imagery_prompt: "Evening operations, navy accents, focused workstations, subdued contrast, clean administrative interfaces.",
      primary_color: "#1f2a37",
      surface_tint: "#dde6ef",
      theme_preset_key: "night",
    },
  },
  noir: {
    description: "Monochrome editorial workspace with muted contrast and restrained accents.",
    label: "Noir",
    recipe: {
      accent_color: "#8d8d8d",
      border_color: "#cfcfcb",
      canvas_color: "#ecebe6",
      card_color: "#fafaf7",
      font_pair_key: "editorial-serif",
      imagery_prompt: "Editorial monochrome photography, paper textures, restrained grayscale palette, documentary portraiture.",
      primary_color: "#262626",
      surface_tint: "#e1e0da",
      theme_preset_key: "noir",
    },
  },
  notepad: {
    description: "Paper-toned utility theme with ink-like contrast and analog cues.",
    label: "Notepad",
    recipe: {
      accent_color: "#c7b48b",
      border_color: "#c0b29b",
      canvas_color: "#f5eddc",
      card_color: "#fffaf0",
      font_pair_key: "notepad-mono",
      imagery_prompt: "Field notes, clipboards, paper forms, handwritten annotations, service coordination materials.",
      primary_color: "#2b241b",
      surface_tint: "#efe4cf",
      theme_preset_key: "notepad",
    },
  },
};

export function getThemePreset(key: ThemePresetKey) {
  if (key === "custom") {
    return null;
  }

  return themePresets[key];
}
