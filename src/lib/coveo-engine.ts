import { buildGeneratedAnswer, type SearchEngine } from "@coveo/headless";
import {
  buildNumericRange,
  defineFacet,
  defineNumericFacet,
  defineNumericFilter,
  definePager,
  defineResultList,
  defineSearchBox,
  defineSearchEngine,
  defineSearchParameterManager,
  defineSort,
} from "@coveo/headless-react/ssr";

function defineStatFilter(field: string) {
  return defineNumericFilter({ options: { field, facetId: field } });
}

export const engineDefinition = defineSearchEngine({
  configuration: {
    organizationId: process.env.NEXT_PUBLIC_COVEO_ORG_ID!,
    accessToken: process.env.NEXT_PUBLIC_COVEO_ACCESS_TOKEN!,
    // Relevance Generative Answering is a Coveo for Service feature that requires legacy analytics.
    analytics: { analyticsMode: "legacy", trackingId: process.env.NEXT_PUBLIC_COVEO_TRACKING_ID },
    search: { searchHub: "Basic Search" },
  },
  controllers: {
    searchBox: defineSearchBox(),
    resultList: defineResultList({
      options: {
        fieldsToInclude: [
          "pm_generation",
          "pm_description",
          "pm_species",
          "pm_type",
          "pm_secondary_type",
          "pm_abilities",
          "pm_image",
          "pm_form",
          "pm_hp",
          "pm_attack",
          "pm_defense",
          "pm_special_attack",
          "pm_special_defense",
          "pm_speed",
          "pm_total",
          "source",
          "documenttype",
          "identifiableuri",
        ],
      },
    }),
    // pm_generation is an Int32 field, so it needs a numeric facet: one single-value range per generation.
    generationFacet: defineNumericFacet({
      options: {
        field: "pm_generation",
        facetId: "pm_generation",
        generateAutomaticRanges: false,
        currentValues: Array.from({ length: 9 }, (_, index) =>
          buildNumericRange({ start: index + 1, end: index + 1, endInclusive: true }),
        ),
        sortCriteria: "ascending",
      },
    }),
    speciesFacet: defineFacet({ options: { field: "pm_species" } }),
    typeFacet: defineFacet({ options: { field: "pm_type" } }),
    abilitiesFacet: defineFacet({ options: { field: "pm_abilities" } }),
    hpFilter: defineStatFilter("pm_hp"),
    attackFilter: defineStatFilter("pm_attack"),
    defenseFilter: defineStatFilter("pm_defense"),
    specialAttackFilter: defineStatFilter("pm_special_attack"),
    specialDefenseFilter: defineStatFilter("pm_special_defense"),
    speedFilter: defineStatFilter("pm_speed"),
    totalFilter: defineStatFilter("pm_total"),
    parameterManager: defineSearchParameterManager(),
    // Registered on the server too, so the first search asks the pipeline for an RGA answer. It is
    // disabled there so only the browser consumes the answer stream.
    generatedAnswer: {
      build: (engine: SearchEngine) =>
        buildGeneratedAnswer(engine, {
          fieldsToIncludeInCitations: ["pm_image"],
          initialState: {
            isEnabled: typeof window !== "undefined",
            responseFormat: { contentFormat: ["text/markdown", "text/plain"] },
          },
        }),
    },
    pager: definePager(),
    sort: defineSort(),
  },
});
