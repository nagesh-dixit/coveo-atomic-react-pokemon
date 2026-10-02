import {
  defineFacet,
  definePager,
  defineResultList,
  defineSearchBox,
  defineSearchEngine,
  defineSort,
} from "@coveo/headless-react/ssr";

export const engineDefinition = defineSearchEngine({
  configuration: {
    organizationId: process.env.NEXT_PUBLIC_COVEO_ORG_ID!,
    accessToken: process.env.NEXT_PUBLIC_COVEO_ACCESS_TOKEN!,
    analytics: { trackingId: process.env.NEXT_PUBLIC_COVEO_TRACKING_ID },
    search: { searchHub: "Basic Search" },
  },
  controllers: {
    searchBox: defineSearchBox(),
    resultList: defineResultList({
      options: {
        fieldsToInclude: [
          "pm_generation",
          "pm_species",
          "pm_type",
          "pm_abilities",
          "pm_image",
          "source",
          "documenttype",
        ],
      },
    }),
    generationFacet: defineFacet({ options: { field: "pm_generation" } }),
    speciesFacet: defineFacet({ options: { field: "pm_species" } }),
    typeFacet: defineFacet({ options: { field: "pm_type" } }),
    abilitiesFacet: defineFacet({ options: { field: "pm_abilities" } }),
    pager: definePager(),
    sort: defineSort(),
  },
});
