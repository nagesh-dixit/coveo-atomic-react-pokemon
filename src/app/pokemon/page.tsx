import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

function getValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isWebUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export default async function PokemonPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const title = getValue(params.title);
  const source = getValue(params.source);
  const image = getValue(params.image);

  if (!title || !isWebUrl(source)) notFound();

  const metadata: [string, string | undefined][] = [
    ["Generation", getValue(params.generation)],
    ["Species", getValue(params.species)],
    ["Type", getValue(params.type)],
    ["Abilities", getValue(params.abilities)],
  ];

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/">
        Back to search
      </Link>
      <article className={styles.detail}>
        {image && isWebUrl(image) && (
          <Image
            className={styles.image}
            src={image}
            alt={`${title} artwork`}
            width={640}
            height={440}
            unoptimized
            priority
          />
        )}
        <div className={styles.content}>
          <p className={styles.kicker}>POKEMON DETAILS</p>
          <h1>{title}</h1>
          {getValue(params.uri) && <p className={styles.uri}>{getValue(params.uri)}</p>}
          {getValue(params.excerpt) && <p className={styles.excerpt}>{getValue(params.excerpt)}</p>}
          {metadata.some(([, value]) => value) && (
            <dl className={styles.metadata}>
              {metadata.filter((field): field is [string, string] => Boolean(field[1])).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <a className={styles.sourceLink} href={source} target="_blank" rel="noreferrer">
            Open original page
          </a>
        </div>
      </article>
    </main>
  );
}