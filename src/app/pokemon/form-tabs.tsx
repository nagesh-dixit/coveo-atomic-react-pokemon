"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./page.module.css";

export type PokemonForm = {
  label: string;
  title: string;
  source: string;
  uri?: string;
  excerpt?: string;
  image?: string;
  generation?: string;
  hp?: string;
  attack?: string;
  defense?: string;
  specialAttack?: string;
  specialDefense?: string;
  speed?: string;
  total?: string;
  species?: string;
  type?: string;
  abilities?: string;
};

export default function PokemonFormTabs({ forms, returnTo }: { forms: PokemonForm[]; returnTo: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedForm = forms[selectedIndex];
  const metadata = [
    ["Generation", selectedForm.generation],
    ["Species", selectedForm.species],
    ["Type", selectedForm.type],
    ["Abilities", selectedForm.abilities],
  ].filter((field): field is [string, string] => Boolean(field[1]));
  const baseStats = [
    ["HP", selectedForm.hp],
    ["Attack", selectedForm.attack],
    ["Defense", selectedForm.defense],
    ["Special Attack", selectedForm.specialAttack],
    ["Special Defense", selectedForm.specialDefense],
    ["Speed", selectedForm.speed],
    ["Total", selectedForm.total],
  ].filter((field): field is [string, string] => Boolean(field[1]));

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href={returnTo}>
        Back to search
      </Link>
      <div className={styles.tabs} role="tablist" aria-label={`${forms[0].title} forms`}>
        {forms.map((form, index) => (
          <button
            aria-controls={`pokemon-form-panel-${index}`}
            aria-selected={index === selectedIndex}
            className={styles.tab}
            id={`pokemon-form-tab-${index}`}
            key={`${form.label}-${form.source}`}
            onClick={() => setSelectedIndex(index)}
            role="tab"
            tabIndex={index === selectedIndex ? 0 : -1}
            type="button"
          >
            {form.label}
          </button>
        ))}
      </div>
      <article
        aria-labelledby={`pokemon-form-tab-${selectedIndex}`}
        className={styles.detail}
        id={`pokemon-form-panel-${selectedIndex}`}
        role="tabpanel"
        tabIndex={0}
      >
        {selectedForm.image && (
          <Image
            className={styles.image}
            src={selectedForm.image}
            alt={`${selectedForm.title} artwork`}
            width={640}
            height={440}
            unoptimized
            priority
          />
        )}
        <div className={styles.content}>
          <p className={styles.kicker}>POKEMON DETAILS</p>
          <h1>{selectedForm.title}</h1>
          {selectedForm.uri && <p className={styles.uri}>{selectedForm.uri}</p>}
          {selectedForm.excerpt && <p className={styles.excerpt}>{selectedForm.excerpt}</p>}
          {metadata.length > 0 && (
            <dl className={styles.metadata}>
              {metadata.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {baseStats.length > 0 && (
            <section className={styles.baseStats} aria-label="Base stats">
              <h2>Base stats</h2>
              <dl className={styles.metadata}>
                {baseStats.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <a className={styles.sourceLink} href={selectedForm.source} target="_blank" rel="noreferrer">
            Open original page
          </a>
        </div>
      </article>
    </main>
  );
}