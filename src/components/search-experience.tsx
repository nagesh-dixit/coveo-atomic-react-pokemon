"use client";

import {
  buildFieldSortCriterion,
  buildRelevanceSortCriterion,
  buildSSRSearchParameterSerializer,
  SortOrder,
} from "@coveo/headless/ssr";
import { buildInteractiveResult } from "@coveo/headless";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { engineDefinition } from "@/lib/coveo-engine";
import styles from "./search-experience.module.css";

type FacetController = ReturnType<typeof engineDefinition.controllers.useSpeciesFacet>;
type GenerationFacetController = ReturnType<typeof engineDefinition.controllers.useGenerationFacet>;
type NumericFilterController = ReturnType<typeof engineDefinition.controllers.useHpFilter>;
type SearchResult = ReturnType<typeof engineDefinition.controllers.useResultList>["state"]["results"][number];

const relevanceCriterion = buildRelevanceSortCriterion();
const generationCriterion = buildFieldSortCriterion("pm_generation", SortOrder.Ascending);
const { serialize } = buildSSRSearchParameterSerializer();

function FacetSection({ label, controller }: { label: string; controller: FacetController }) {
  return (
    <section className={styles.facet}>
      <h3>{label}</h3>
      <ul>
        {controller.state.values.map((value) => (
          <li key={value.value}>
            <label>
              <input
                type="checkbox"
                checked={value.state === "selected"}
                onChange={() => controller.methods?.toggleSelect(value)}
              />
              <span>{value.value}</span>
              <span className={styles.count}>{value.numberOfResults}</span>
            </label>
          </li>
        ))}
      </ul>
      {controller.state.canShowMoreValues && (
        <button className={styles.textButton} onClick={() => controller.methods?.showMoreValues()}>
          Show more
        </button>
      )}
      {controller.state.canShowLessValues && (
        <button className={styles.textButton} onClick={() => controller.methods?.showLessValues()}>
          Show less
        </button>
      )}
    </section>
  );
}

function GenerationFacet({ controller }: { controller: GenerationFacetController }) {
  const values = controller.state.values;

  return (
    <section className={styles.facet}>
      <div className={styles.numericFilterHeading}>
        <h3>Generation</h3>
        {controller.state.hasActiveValues && (
          <button
            className={styles.inlineTextButton}
            type="button"
            onClick={() => controller.methods?.deselectAll()}
          >
            Any
          </button>
        )}
      </div>
      <div className={styles.generationGrid} role="group" aria-label="Generation">
        {values.map((value) => (
          <button
            key={value.start}
            type="button"
            aria-pressed={value.state === "selected"}
            aria-label={`Generation ${value.start}, ${value.numberOfResults} results`}
            disabled={value.numberOfResults === 0 && value.state !== "selected"}
            title={`${value.numberOfResults} results`}
            onClick={() => controller.methods?.toggleSelect(value)}
          >
            <span>{value.start}</span>
            <small>{value.numberOfResults}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function NumericFilterSlider({
  label,
  maximum,
  controller,
}: {
  label: string;
  maximum: number;
  controller: NumericFilterController;
}) {
  // Local draft while a handle is being dragged, so a query only fires on release.
  const [draft, setDraft] = useState<{ start: number; end: number } | null>(null);
  const start = draft?.start ?? controller.state.range?.start ?? 0;
  const end = draft?.end ?? controller.state.range?.end ?? maximum;
  const isFiltered = start > 0 || end < maximum;
  const inputId = `stat-filter-${label.toLowerCase().replaceAll(" ", "-")}`;

  function commit() {
    if (!draft) return;
    if (draft.start <= 0 && draft.end >= maximum) {
      controller.methods?.clear();
    } else {
      controller.methods?.setRange(draft);
    }
    setDraft(null);
  }

  const commitHandlers = { onPointerUp: commit, onKeyUp: commit, onBlur: commit, onTouchEnd: commit };

  return (
    <section className={styles.facet}>
      <div className={styles.numericFilterHeading}>
        <h3>{label}</h3>
        <output htmlFor={`${inputId}-min ${inputId}-max`}>
          {isFiltered ? `${start} – ${end}` : "Any"}
        </output>
      </div>
      <div
        className={styles.rangeSlider}
        style={
          {
            "--range-start": `${(start / maximum) * 100}%`,
            "--range-end": `${(end / maximum) * 100}%`,
          } as CSSProperties
        }
      >
        <input
          aria-label={`Minimum ${label}`}
          id={`${inputId}-min`}
          max={maximum}
          min={0}
          // Keep the min handle grabbable when both handles meet at the top of the scale.
          style={start > maximum / 2 ? { zIndex: 2 } : undefined}
          type="range"
          value={start}
          onChange={(event) =>
            setDraft({ start: Math.min(Number(event.target.value), end), end })
          }
          {...commitHandlers}
        />
        <input
          aria-label={`Maximum ${label}`}
          id={`${inputId}-max`}
          max={maximum}
          min={0}
          type="range"
          value={end}
          onChange={(event) =>
            setDraft({ start, end: Math.max(Number(event.target.value), start) })
          }
          {...commitHandlers}
        />
      </div>
      <div className={styles.sliderScale} aria-hidden="true">
        <span>0</span>
        <span>{maximum}</span>
      </div>
    </section>
  );
}

function displayField(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(displayField).filter(Boolean).join(", ") || undefined;
  }
  return undefined;
}

// Primary and secondary type shown together, e.g. "Grass Poison".
function typeLabel(result: SearchResult): string | undefined {
  const types = [displayField(result.raw.pm_type), displayField(result.raw.pm_secondary_type)];
  return [...new Set(types.filter(Boolean))].join(" ") || undefined;
}

function identifiableUri(result: SearchResult): string | undefined {
  return displayField(result.raw.identifiableuri);
}

function parentIdentifiableUri(uri: string | undefined): string | undefined {
  return uri?.replace(/\/subitem:\d+$/i, "");
}

function isSubitem(uri: string | undefined): boolean {
  return Boolean(uri && /\/subitem:\d+$/i.test(uri));
}

function formLabel(
  result: SearchResult,
  parentTitle: string,
  parentSource: string,
): string {
  const image = displayField(result.raw.pm_image);
  const subitemNumber = identifiableUri(result)?.match(/\/subitem:(\d+)$/i)?.[1];

  if (image) {
    try {
      const imageName = new URL(image).pathname.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase();
      const parentSlug = new URL(parentSource).pathname.split("/").filter(Boolean).pop()?.toLowerCase();
      const pokemonName = parentTitle.replace(/\s+Pok[eé]dex.*$/i, "").trim();

      if (imageName && parentSlug && imageName.startsWith(`${parentSlug}-`)) {
        const variant = imageName.slice(parentSlug.length + 1).split("-").filter(Boolean);
        const titleCase = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
        if (variant[0] === "mega") {
          return `Mega ${pokemonName} ${variant.slice(1).map(titleCase).join(" ")}`;
        }
        return `${pokemonName} ${variant.map(titleCase).join(" ")}`;
      }
    } catch {
      return subitemNumber ? `Form ${subitemNumber}` : "Form";
    }
  }

  return subitemNumber ? `Form ${subitemNumber}` : "Form";
}

export default function SearchExperience() {
  const searchBox = engineDefinition.controllers.useSearchBox();
  const engine = engineDefinition.useEngine();
  const resultList = engineDefinition.controllers.useResultList();
  const generationFacet = engineDefinition.controllers.useGenerationFacet();
  const speciesFacet = engineDefinition.controllers.useSpeciesFacet();
  const typeFacet = engineDefinition.controllers.useTypeFacet();
  const abilitiesFacet = engineDefinition.controllers.useAbilitiesFacet();
  const hpFilter = engineDefinition.controllers.useHpFilter();
  const attackFilter = engineDefinition.controllers.useAttackFilter();
  const defenseFilter = engineDefinition.controllers.useDefenseFilter();
  const specialAttackFilter = engineDefinition.controllers.useSpecialAttackFilter();
  const specialDefenseFilter = engineDefinition.controllers.useSpecialDefenseFilter();
  const speedFilter = engineDefinition.controllers.useSpeedFilter();
  const totalFilter = engineDefinition.controllers.useTotalFilter();
  const pager = engineDefinition.controllers.usePager();
  const sort = engineDefinition.controllers.useSort();
  const parameterManager = engineDefinition.controllers.useParameterManager();
  const [query, setQuery] = useState(searchBox.state.value);
  const [syncedQuery, setSyncedQuery] = useState(searchBox.state.value);
  const searchParameters = parameterManager.state.parameters;
  // Search page URL with the current query, facets, sort and page, used for the details "Back" link.
  const searchHref = new URL(serialize(searchParameters, new URL("/", "http://localhost"))).search || "";

  // Keep the input in step when the engine's query changes outside of typing (e.g. restored from the URL).
  if (searchBox.state.value !== syncedQuery) {
    setSyncedQuery(searchBox.state.value);
    setQuery(searchBox.state.value);
  }

  // Mirror the search state into the URL so back navigation, refresh and shared links restore it.
  // replaceState keeps filter changes out of the history stack.
  const isHydrated = Boolean(parameterManager.methods);
  useEffect(() => {
    if (!isHydrated) return;
    const url = serialize(searchParameters, new URL(window.location.href));
    if (url !== window.location.href) {
      window.history.replaceState(null, "", url);
    }
  }, [isHydrated, searchParameters]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const facets = [generationFacet, speciesFacet, typeFacet, abilitiesFacet];
  const numericFilters = [
    { label: "HP", maximum: 255, controller: hpFilter },
    { label: "Attack", maximum: 255, controller: attackFilter },
    { label: "Defense", maximum: 255, controller: defenseFilter },
    { label: "Special Attack", maximum: 255, controller: specialAttackFilter },
    { label: "Special Defense", maximum: 255, controller: specialDefenseFilter },
    { label: "Speed", maximum: 255, controller: speedFilter },
    { label: "Total", maximum: 720, controller: totalFilter },
  ];
  const hasActiveFilters =
    facets.some((facet) => facet.state.hasActiveValues) ||
    numericFilters.some(({ controller }) => Boolean(controller.state.range));
  const sortByGeneration = sort.methods?.isSortedBy(generationCriterion) ?? false;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchBox.methods?.submit();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <p className={styles.kicker}>POKEMON DATABASE SEARCH</p>
          <h1>Find a Pokemon.</h1>
          <p className={styles.intro}>Search Pokemondb.net across species, types, abilities, and more.</p>
          <form className={styles.searchForm} onSubmit={submitSearch} role="search">
            <input
              aria-label="Search Pokemondb.net"
              autoComplete="off"
              placeholder="Try Pikachu, Water, or Thunderbolt"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                searchBox.methods?.updateText(event.target.value);
              }}
            />
            {query && (
              <button
                className={styles.clearButton}
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  searchBox.methods?.clear();
                }}
              >
                Clear
              </button>
            )}
            <button className={styles.searchButton} type="submit">
              Search
            </button>
          </form>
        </div>
      </header>

      <div className={styles.content}>
        <aside className={styles.filters} aria-label="Search filters">
          <div className={styles.filterHeading}>
            <h2>Refine results</h2>
            {hasActiveFilters && (
              <button
                className={styles.textButton}
                onClick={() => {
                  facets.forEach((facet) => facet.methods?.deselectAll());
                  numericFilters.forEach(({ controller }) => controller.methods?.clear());
                }}
              >
                Clear all
              </button>
            )}
          </div>
          <GenerationFacet controller={generationFacet} />
          <FacetSection label="Species" controller={speciesFacet} />
          <FacetSection label="Type" controller={typeFacet} />
          <FacetSection label="Abilities" controller={abilitiesFacet} />
          {numericFilters.map(({ label, maximum, controller }) => (
            <NumericFilterSlider
              key={label}
              label={label}
              maximum={maximum}
              controller={controller}
            />
          ))}
        </aside>

        <section className={styles.results} aria-label="Search results">
          <div className={styles.resultsToolbar}>
            <p>{resultList.state.results.length} results on this page</p>
            <div className={styles.sortControl} aria-label="Sort results">
              <span>Sort</span>
              <button
                type="button"
                aria-pressed={!sortByGeneration}
                onClick={() => sort.methods?.sortBy(relevanceCriterion)}
              >
                Relevance
              </button>
              <button
                type="button"
                aria-pressed={sortByGeneration}
                onClick={() => sort.methods?.sortBy(generationCriterion)}
              >
                Generation
              </button>
            </div>
            <div className={styles.viewToggle} role="group" aria-label="Result layout">
              <button
                type="button"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              >
                Grid
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
            </div>
          </div>

          {resultList.state.results.length > 0 ? (
            <ol className={`${styles.resultList} ${viewMode === "grid" ? styles.gridView : styles.listView}`}>
              {resultList.state.results.map((result) => {
                const imageSrc = displayField(result.raw.pm_image);
                const description = displayField(result.raw.pm_description);
                const stats = [
                  { label: "HP", value: displayField(result.raw.pm_hp), maximum: 255 },
                  { label: "Attack", value: displayField(result.raw.pm_attack), maximum: 255 },
                  { label: "Defense", value: displayField(result.raw.pm_defense), maximum: 255 },
                  {
                    label: "Special Attack",
                    value: displayField(result.raw.pm_special_attack),
                    maximum: 255,
                  },
                  {
                    label: "Special Defense",
                    value: displayField(result.raw.pm_special_defense),
                    maximum: 255,
                  },
                  { label: "Speed", value: displayField(result.raw.pm_speed), maximum: 255 },
                  { label: "Total", value: displayField(result.raw.pm_total), maximum: 720 },
                ].filter(
                  (stat): stat is typeof stat & { value: string } =>
                    stat.value !== undefined && Number.isFinite(Number(stat.value)),
                );
                const detailParams = new URLSearchParams({
                  title: result.title || result.clickUri,
                  source: result.clickUri,
                  returnTo: `/${searchHref}`,
                });
                const detailFields = {
                  uri: result.printableUri,
                  description,
                  image: imageSrc,
                  generation: displayField(result.raw.pm_generation),
                  hp: displayField(result.raw.pm_hp),
                  attack: displayField(result.raw.pm_attack),
                  defense: displayField(result.raw.pm_defense),
                  specialAttack: displayField(result.raw.pm_special_attack),
                  specialDefense: displayField(result.raw.pm_special_defense),
                  speed: displayField(result.raw.pm_speed),
                  total: displayField(result.raw.pm_total),
                  species: displayField(result.raw.pm_species),
                  type: typeLabel(result),
                  abilities: displayField(result.raw.pm_abilities),
                };
                Object.entries(detailFields).forEach(([key, value]) => {
                  if (value) detailParams.set(key, value);
                });
                const resultUri = identifiableUri(result);
                const parentUri = parentIdentifiableUri(resultUri);
                const relatedResults = parentUri
                  ? resultList.state.results.filter(
                      (candidate) => parentIdentifiableUri(identifiableUri(candidate)) === parentUri,
                    )
                  : [];
                const formResults = relatedResults.filter(
                  (candidate) =>
                    displayField(candidate.raw.documenttype)?.toLowerCase() === "form" &&
                    isSubitem(identifiableUri(candidate)),
                );

                if (formResults.length > 0) {
                  const parentResult =
                    relatedResults.find(
                      (candidate) => !displayField(candidate.raw.documenttype) && !isSubitem(identifiableUri(candidate)),
                    ) ??
                    relatedResults.find(
                      (candidate) =>
                        displayField(candidate.raw.documenttype)?.toLowerCase() === "form" &&
                        !isSubitem(identifiableUri(candidate)),
                    ) ??
                    relatedResults.find((candidate) => !isSubitem(identifiableUri(candidate))) ??
                    result;
                  const parentTitle = parentResult.title || parentResult.clickUri;
                  const parentSource = parentResult.clickUri;
                  const forms = [parentResult, ...formResults].map((form, index) => {
                    const formImage = displayField(form.raw.pm_image);
                    const formUri = identifiableUri(form);

                    return {
                      label:
                        index === 0
                          ? displayField(form.raw.pm_form) || form.title || "Base"
                          : formLabel(form, parentTitle, parentSource),
                      title: form.title || parentTitle,
                      source: form.clickUri || parentSource,
                      uri: form.printableUri,
                      description: displayField(form.raw.pm_description),
                      image: formImage,
                      generation: displayField(form.raw.pm_generation),
                      hp: displayField(form.raw.pm_hp),
                      attack: displayField(form.raw.pm_attack),
                      defense: displayField(form.raw.pm_defense),
                      specialAttack: displayField(form.raw.pm_special_attack),
                      specialDefense: displayField(form.raw.pm_special_defense),
                      speed: displayField(form.raw.pm_speed),
                      total: displayField(form.raw.pm_total),
                      species: displayField(form.raw.pm_species),
                      type: typeLabel(form),
                      abilities: displayField(form.raw.pm_abilities),
                      identifiableUri: formUri,
                    };
                  });
                  detailParams.set("forms", JSON.stringify(forms));
                }
                const detailsHref = `/pokemon?${detailParams.toString()}`;
                const interactiveResult = engine
                  ? buildInteractiveResult(engine, { options: { result } })
                  : undefined;
                const selectResult = () => interactiveResult?.select();
                const metadata = [
                  ["Generation:", displayField(result.raw.pm_generation)],
                  ["Species:", displayField(result.raw.pm_species)],
                  ["Type:", displayField(result.raw.pm_type)],
                  ["Abilities:", displayField(result.raw.pm_abilities)],
                ].filter((item): item is [string, string] => Boolean(item[1]));

                return (
                  <li
                    className={`${styles.result} ${viewMode === "list" && imageSrc ? styles.listResult : ""}`}
                    key={result.uniqueId}
                  >
                    {imageSrc && (
                      <Link
                        href={detailsHref}
                        aria-label={`View details for ${result.title || "Pokemon"}`}
                        onClick={selectResult}
                        onContextMenu={selectResult}
                        onMouseDown={selectResult}
                        onMouseUp={selectResult}
                        onTouchStart={() => interactiveResult?.beginDelayedSelect()}
                        onTouchEnd={() => interactiveResult?.cancelPendingSelect()}
                      >
                        <Image
                          className={styles.resultImage}
                          src={imageSrc}
                          alt={`${result.title || "Pokemon"} artwork`}
                          width={320}
                          height={220}
                          unoptimized
                        />
                      </Link>
                    )}
                    <div className={styles.resultBody}>
                      <Link
                        href={detailsHref}
                        onClick={selectResult}
                        onContextMenu={selectResult}
                        onMouseDown={selectResult}
                        onMouseUp={selectResult}
                        onTouchStart={() => interactiveResult?.beginDelayedSelect()}
                        onTouchEnd={() => interactiveResult?.cancelPendingSelect()}
                      >
                        {result.title || result.clickUri}
                      </Link>
                      <p className={styles.uri}>{result.printableUri}</p>
                      {description && <p className={styles.description}>{description}</p>}
                      {metadata.length > 0 && (
                        <ul className={styles.metadata}>
                          {metadata.map(([label, value]) => (
                            <li key={label}>
                              {label ? (
                                <>
                                  <span>{label}</span> {value}
                                </>
                              ) : (
                                value
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {stats.length > 0 && (
                        <div
                          className={styles.statsScroller}
                          role="region"
                          aria-label={`${result.title || "Pokemon"} base stats`}
                          tabIndex={0}
                        >
                          <p className={styles.statsHeading}>Base stats</p>
                          <ul className={styles.statsList}>
                            {stats.map((stat) => {
                              const numericValue = Number(stat.value);
                              const fill = Math.min(100, Math.max(0, (numericValue / stat.maximum) * 100));

                              return (
                                <li className={styles.stat} key={stat.label}>
                                  <div className={styles.statHeader}>
                                    <span>{stat.label}</span>
                                    <span>{stat.value}</span>
                                  </div>
                                  <div className={styles.statTrack} aria-hidden="true">
                                    <span style={{ width: `${fill}%` }} />
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className={styles.emptyState}>No results found. Try a different search or remove a filter.</p>
          )}

          {pager.state.maxPage > 0 && (
            <nav className={styles.pagination} aria-label="Search result pages">
              <button
                type="button"
                disabled={!pager.state.hasPreviousPage}
                onClick={() => pager.methods?.previousPage()}
              >
                Previous
              </button>
              <span>
                Page {pager.state.currentPage} of {pager.state.maxPage}
              </span>
              <button
                type="button"
                disabled={!pager.state.hasNextPage}
                onClick={() => pager.methods?.nextPage()}
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}