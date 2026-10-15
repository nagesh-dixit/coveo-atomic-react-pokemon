import {
  buildNumericRange,
  defineFacet,
  defineNumericFacet,
  defineNumericFilter,
  definePager,
  defineResultList,
  defineSearchBox,
  defineSearchEngine,
  defineSort,
} from "@coveo/headless-react/ssr";

function defineStatFilter(field: string) {
  return defineNumericFilter({ options: { field, facetId: field } });
}

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
    pager: definePager(),
    sort: defineSort(),
  },
});
