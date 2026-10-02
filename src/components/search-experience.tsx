"use client";

import {
  buildFieldSortCriterion,
  buildRelevanceSortCriterion,
  SortOrder,
} from "@coveo/headless/ssr";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { engineDefinition } from "@/lib/coveo-engine";
import styles from "./search-experience.module.css";

type FacetController = ReturnType<typeof engineDefinition.controllers.useGenerationFacet>;

const relevanceCriterion = buildRelevanceSortCriterion();
const generationCriterion = buildFieldSortCriterion("pm_generation", SortOrder.Ascending);

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

function displayField(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(displayField).filter(Boolean).join(", ") || undefined;
  }
  return undefined;
}

export default function SearchExperience() {
  const searchBox = engineDefinition.controllers.useSearchBox();
  const resultList = engineDefinition.controllers.useResultList();
  const generationFacet = engineDefinition.controllers.useGenerationFacet();
  const speciesFacet = engineDefinition.controllers.useSpeciesFacet();
  const typeFacet = engineDefinition.controllers.useTypeFacet();
  const abilitiesFacet = engineDefinition.controllers.useAbilitiesFacet();
  const pager = engineDefinition.controllers.usePager();
  const sort = engineDefinition.controllers.useSort();
  const [query, setQuery] = useState(searchBox.state.value);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const facets = [generationFacet, speciesFacet, typeFacet, abilitiesFacet];
  const hasActiveFilters = facets.some((facet) => facet.state.hasActiveValues);
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
              <button className={styles.textButton} onClick={() => facets.forEach((facet) => facet.methods?.deselectAll())}>
                Clear all
              </button>
            )}
          </div>
          <FacetSection label="Generation" controller={generationFacet} />
          <FacetSection label="Species" controller={speciesFacet} />
          <FacetSection label="Type" controller={typeFacet} />
          <FacetSection label="Abilities" controller={abilitiesFacet} />
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
                const metadata = [
                  ["", displayField(result.raw.pm_generation)],
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
                      <Image
                        className={styles.resultImage}
                        src={imageSrc}
                        alt={`${result.title || "Pokemon"} artwork`}
                        width={320}
                        height={220}
                        unoptimized
                      />
                    )}
                    <div className={styles.resultBody}>
                      <a href={result.clickUri} target="_blank" rel="noreferrer">
                        {result.title || result.clickUri}
                      </a>
                      <p className={styles.uri}>{result.printableUri}</p>
                      {result.excerpt && <p className={styles.excerpt}>{result.excerpt}</p>}
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