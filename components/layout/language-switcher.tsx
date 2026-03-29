"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
];

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const t = useTranslations("LanguageSwitcher");

  function switchLocale(locale: string) {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <div aria-label={t("label")} className="flex items-center gap-1" role="group">
      {LOCALES.map((loc) => (
        <button
          key={loc.code}
          aria-pressed={currentLocale === loc.code}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            currentLocale === loc.code
              ? "bg-[color:var(--brand-primary)] text-[color:var(--brand-primary-foreground)]"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
          onClick={() => switchLocale(loc.code)}
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}
