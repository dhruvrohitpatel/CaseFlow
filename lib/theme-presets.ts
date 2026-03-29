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
    description: "Dark-first operations workspace with high contrast and softer panel tones.",
    label: "Night",
    recipe: {
      accent_color: "#355c7d",
      border_color: "#3f4a59",
      canvas_color: "#11161d",
      card_color: "#1a212b",
      font_pair_key: "humanist-sans",
      imagery_prompt: "Low-light operations center, subtle reflections, night-shift coordination, focused workstations.",
      primary_color: "#f2efe8",
      surface_tint: "#232c38",
      theme_preset_key: "night",
    },
  },
  noir: {
    description: "Editorial monochrome theme with minimal accent and strong hierarchy.",
    label: "Noir",
    recipe: {
      accent_color: "#8e8e8e",
      border_color: "#505050",
      canvas_color: "#131313",
      card_color: "#1d1d1d",
      font_pair_key: "editorial-serif",
      imagery_prompt: "Black-and-white editorial photography, documentary portraiture, high-contrast composition.",
      primary_color: "#f3f3f0",
      surface_tint: "#272727",
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
