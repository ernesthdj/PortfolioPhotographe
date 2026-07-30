// Génère un slug URL-safe à partir d'un texte libre (ex. noms des mariés) —
// voir docs/modules/GALERIE.md §5.
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
