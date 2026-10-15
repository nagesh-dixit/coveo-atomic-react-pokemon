"use client";

import {
  buildSSRSearchParameterSerializer,
  type InferHydratedState,
  type InferStaticState,
  type NavigatorContext,
  type SearchParameters,
} from "@coveo/headless/ssr";
import { useEffect, useState, type PropsWithChildren } from "react";
import { engineDefinition } from "@/lib/coveo-engine";

type SearchStaticState = InferStaticState<typeof engineDefinition>;
type SearchHydratedState = InferHydratedState<typeof engineDefinition>;

export function SearchProvider({
  staticState,
  navigatorContext,
  parameters,
  children,
}: PropsWithChildren<{
  staticState: SearchStaticState;
  navigatorContext: NavigatorContext;
  parameters: SearchParameters;
}>) {
  const [hydratedState, setHydratedState] = useState<SearchHydratedState>();

  useEffect(() => {
    engineDefinition.setNavigatorContextProvider(() => navigatorContext);
    engineDefinition
      .hydrateStaticState({
        searchAction: staticState.searchAction,
        controllers: { parameterManager: { initialState: { parameters } } },
      })
      .then((hydrated) => {
        // On browser back/forward, Next.js reuses the cached server render, which can predate the
        // filters now in the URL. Re-sync from the URL; this is a no-op when they already match.
        const { toSearchParameters } = buildSSRSearchParameterSerializer();
        hydrated.controllers.parameterManager.synchronize(
          toSearchParameters(new URLSearchParams(window.location.search)),
        );
        setHydratedState(hydrated);
      });
  }, [staticState, navigatorContext, parameters]);

  if (hydratedState) {
    return (
      <engineDefinition.HydratedStateProvider
        engine={hydratedState.engine}
        controllers={hydratedState.controllers}
      >
        {children}
      </engineDefinition.HydratedStateProvider>
    );
  }

  return (
    <engineDefinition.StaticStateProvider controllers={staticState.controllers}>
      {children}
    </engineDefinition.StaticStateProvider>
  );
}