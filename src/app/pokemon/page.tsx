import { notFound } from "next/navigation";
import PokemonFormTabs, { type PokemonForm } from "./form-tabs";

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

// Only accept a same-site path back to the search page, never an external URL.
function getReturnTo(value: string | string[] | undefined): string {
  const returnTo = getValue(value);
  return returnTo && /^\/(?:\?|$)/.test(returnTo) ? returnTo : "/";
}

function parseForms(value: string | string[] | undefined): PokemonForm[] {
  if (typeof value !== "string") return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item): PokemonForm[] => {
      if (typeof item !== "object" || item === null) return [];
      const form = item as Record<string, unknown>;
      const title = typeof form.title === "string" ? form.title : undefined;
      const source = typeof form.source === "string" ? form.source : undefined;

      if (!title || !isWebUrl(source)) return [];

      const optionalValue = (key: string) =>
        typeof form[key] === "string" ? (form[key] as string) : undefined;

      return [{
        label: optionalValue("label") || title,
        title,
        source,
        uri: optionalValue("uri"),
        excerpt: optionalValue("excerpt"),
        image: isWebUrl(optionalValue("image")) ? optionalValue("image") : undefined,
        generation: optionalValue("generation"),
        hp: optionalValue("hp"),
        attack: optionalValue("attack"),
        defense: optionalValue("defense"),
        specialAttack: optionalValue("specialAttack"),
        specialDefense: optionalValue("specialDefense"),
        speed: optionalValue("speed"),
        total: optionalValue("total"),
        species: optionalValue("species"),
        type: optionalValue("type"),
        abilities: optionalValue("abilities"),
      }];
    });
  } catch {
    return [];
  }
}

export default async function PokemonPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const forms = parseForms(params.forms);
  const title = getValue(params.title);
  const source = getValue(params.source);
  const returnTo = getReturnTo(params.returnTo);

  if (forms.length > 0) return <PokemonFormTabs forms={forms} returnTo={returnTo} />;
  if (!title || !isWebUrl(source)) notFound();

  return (
    <PokemonFormTabs
      returnTo={returnTo}
      forms={[
        {
          label: title,
          title,
          source,
          uri: getValue(params.uri),
          excerpt: getValue(params.excerpt),
          image: isWebUrl(getValue(params.image)) ? getValue(params.image) : undefined,
          generation: getValue(params.generation),
          hp: getValue(params.hp),
          attack: getValue(params.attack),
          defense: getValue(params.defense),
          specialAttack: getValue(params.specialAttack),
          specialDefense: getValue(params.specialDefense),
          speed: getValue(params.speed),
          total: getValue(params.total),
          species: getValue(params.species),
          type: getValue(params.type),
          abilities: getValue(params.abilities),
        },
      ]}
    />
  );
}