import type { NavigatorContext } from "@coveo/headless/ssr";
import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import SearchExperience from "@/components/search-experience";
import { SearchProvider } from "@/components/search-provider";
import { engineDefinition } from "@/lib/coveo-engine";

export default async function Home() {
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const navigatorContext: NavigatorContext = {
    clientId: cookieStore.get("coveo_visitorId")?.value ?? randomUUID(),
    location: host ? `${protocol}://${host}/` : null,
    referrer: requestHeaders.get("referer"),
    userAgent: requestHeaders.get("user-agent"),
    forwardedFor: requestHeaders.get("x-forwarded-for") ?? undefined,
  };

  engineDefinition.setNavigatorContextProvider(() => navigatorContext);
  const staticState = await engineDefinition.fetchStaticState();

  return (
    <SearchProvider staticState={staticState} navigatorContext={navigatorContext}>
      <SearchExperience />
    </SearchProvider>
  );
}
