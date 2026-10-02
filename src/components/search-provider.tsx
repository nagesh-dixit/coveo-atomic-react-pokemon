"use client";

import type { InferHydratedState, InferStaticState, NavigatorContext } from "@coveo/headless/ssr";
import { useEffect, useState, type PropsWithChildren } from "react";
import { engineDefinition } from "@/lib/coveo-engine";

type SearchStaticState = InferStaticState<typeof engineDefinition>;
type SearchHydratedState = InferHydratedState<typeof engineDefinition>;

export function SearchProvider({
  staticState,
  navigatorContext,
  children,
}: PropsWithChildren<{ staticState: SearchStaticState; navigatorContext: NavigatorContext }>) {
  const [hydratedState, setHydratedState] = useState<SearchHydratedState>();

  useEffect(() => {
    engineDefinition.setNavigatorContextProvider(() => navigatorContext);
    engineDefinition
      .hydrateStaticState({ searchAction: staticState.searchAction })
      .then(setHydratedState);
  }, [staticState, navigatorContext]);

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