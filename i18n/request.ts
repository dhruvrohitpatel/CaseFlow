import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const supportedLocales = ["en", "es"];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  let locale = "en";

  if (cookieLocale && supportedLocales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const acceptLanguage = (await headers()).get("accept-language") ?? "";
    const preferred = acceptLanguage.split(",")[0].trim().split("-")[0].toLowerCase();
    if (supportedLocales.includes(preferred)) {
      locale = preferred;
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
