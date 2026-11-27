import assert from "node:assert/strict";
import test from "node:test";
import {
  ajouterSerie, changements, deplacer, deplacerDansSerie, deplacerSerie, depuisManifeste, etiquettes, limite, majSerie, nomZone,
  placer, placerDansSerie, reporter, retirer, retirerDeSerie, retirerSerie, versManifeste, parDefaut, idsDe,
} from "../js/admin/placement.js";
import { parseManifest } from "../api/_lib/manifest.ts";

const photo = (id: string, published = true) => ({ id, file: `cms/photos/${id}.jpg`, w: 3000, h: 2000, alt: `Alt ${id}`, published, fx: 0.5, fy: 0.5 });
const serveur = () => ({ version: 1 as const, rev: 4, photos: [photo("aaaa"), photo("bbbb"), photo("cccc", false)], slots: {}, events: [] });
const ed = () => depuisManifeste(serveur());

test("should_give_each_slot_its_limit", () => {
  assert.equal(limite("intro"), 5);
  assert.equal(limite("accueil:3"), 6);
  assert.equal(limite("service:5"), 1);
  assert.equal(limite("service:9"), 0);
  assert.equal(limite("n-importe-quoi"), 0);
});
test("should_name_zones_for_humans", () => {
  assert.equal(nomZone("intro"), "Intro");
  assert.equal(nomZone("accueil:0"), "Accueil · Mariages");
  assert.equal(nomZone("service:5"), "Services · Culinaire & studio");
});
test("should_place_a_photo_in_a_slot", () => {
  const r = placer(ed(), "intro", "aaaa");
  assert.equal(r.erreur, undefined);
  assert.deepEqual(r.ed.slots["intro"], [parDefaut("aaaa")]);
});
test("should_refuse_a_duplicate_in_the_same_slot", () => {
  const r = placer(placer(ed(), "intro", "aaaa").ed, "intro", "aaaa");
  assert.match(r.erreur ?? "", /déjà/);
});
test("should_refuse_when_a_multi_slot_is_full", () => {
  let e = ed();
  for (const id of ["aaaa", "bbbb", "cccc", "dddd", "eeee"]) e = placer(e, "intro", id).ed;
  assert.equal(e.slots["intro"]?.length, 5);
  assert.match(placer(e, "intro", "ffff").erreur ?? "", /pleine/);
});
test("should_replace_the_photo_of_a_single_place_slot", () => {
  const r = placer(placer(ed(), "service:0", "aaaa").ed, "service:0", "bbbb");
  assert.equal(r.erreur, undefined);
  assert.deepEqual(r.ed.slots["service:0"], [parDefaut("bbbb")]);
});
test("should_refuse_an_unknown_slot", () => {
  assert.match(placer(ed(), "autre", "aaaa").erreur ?? "", /inconnu/);
});
test("should_remove_a_photo_from_a_slot", () => {
  const e = retirer(placer(ed(), "intro", "aaaa").ed, "intro", "aaaa");
  assert.deepEqual(e.slots["intro"], []);
});
test("should_move_within_bounds_only", () => {
  assert.deepEqual(deplacer(["a", "b", "c"], 1, -1), ["b", "a", "c"]);
  assert.deepEqual(deplacer(["a", "b", "c"], 0, -1), ["a", "b", "c"]);
  assert.deepEqual(deplacer(["a", "b", "c"], 2, 1), ["a", "b", "c"]);
});
test("should_add_a_series_with_a_valid_unique_id", () => {
  const r1 = ajouterSerie(ed(), 2);
  const r2 = ajouterSerie(r1.ed, 0);
  assert.equal(r2.ed.events.length, 2);
  assert.match(r2.ed.events[0]?.id ?? "", /^[a-z0-9_-]{4,40}$/);
  assert.notEqual(r2.ed.events[0]?.id, r2.ed.events[1]?.id);
  assert.equal(r1.ed.events[0]?.svc, 2);
});
test("should_refuse_more_than_20_series", () => {
  let e = ed();
  for (let i = 0; i < 20; i++) e = ajouterSerie(e, 0).ed;
  assert.match(ajouterSerie(e, 0).erreur ?? "", /Maximum/);
});
test("should_manage_the_photos_of_a_series", () => {
  let e = ajouterSerie(ed(), 0).ed;
  const id = e.events[0]!.id;
  e = placerDansSerie(e, id, "aaaa").ed;
  e = placerDansSerie(e, id, "bbbb").ed;
  assert.match(placerDansSerie(e, id, "aaaa").erreur ?? "", /déjà/);
  e = deplacerDansSerie(e, id, 1, -1);
  assert.deepEqual(idsDe(e.events[0]!.photos), ["bbbb", "aaaa"]);
  e = retirerDeSerie(e, id, "bbbb");
  assert.deepEqual(idsDe(e.events[0]!.photos), ["aaaa"]);
});
test("should_reorder_and_remove_series", () => {
  let e = ajouterSerie(ajouterSerie(ed(), 0).ed, 1).ed;
  const [a, b] = [e.events[0]!.id, e.events[1]!.id];
  e = deplacerSerie(e, b, -1);
  assert.deepEqual(e.events.map((x: { id: string }) => x.id), [b, a]);
  assert.deepEqual(retirerSerie(e, a).events.map((x: { id: string }) => x.id), [b]);
});
test("should_list_where_a_photo_is_placed", () => {
  let e = placer(ed(), "intro", "aaaa").ed;
  e = placer(e, "accueil:1", "aaaa").ed;
  e = ajouterSerie(e, 0).ed;
  e = majSerie(e, e.events[0]!.id, { tag: "Mariage Paris" });
  e = placerDansSerie(e, e.events[0]!.id, "aaaa").ed;
  assert.deepEqual(etiquettes(e, "aaaa"), ["Intro", "Accueil · Engagement", "Galerie · Mariage Paris"]);
  assert.deepEqual(etiquettes(e, "bbbb"), []);
});
test("should_report_no_change_on_a_fresh_copy", () => {
  assert.deepEqual(changements(ed(), ed()), []);
});
test("should_describe_pending_changes", () => {
  const base = ed();
  let e = placer(base, "intro", "aaaa").ed;
  e = { ...e, photos: e.photos.map((p: { id: string }) => (p.id === "cccc" ? { ...p, published: true } : p.id === "aaaa" ? { ...p, alt: "Nouveau" } : p)) };
  e = ajouterSerie(e, 1).ed;
  const l = changements(base, e);
  assert.ok(l.some((x) => /1 photo publiée/.test(x)));
  assert.ok(l.some((x) => /1 texte alternatif modifié/.test(x)));
  assert.ok(l.some((x) => /^Intro : \+1/.test(x)));
  assert.ok(l.some((x) => /Série « Engagement » ajoutée/.test(x)));
});
test("should_build_a_manifest_the_server_accepts", () => {
  let e = placer(ed(), "intro", "aaaa").ed;
  e = placer(e, "service:2", "bbbb").ed;
  e = ajouterSerie(e, 3).ed;
  e = majSerie(e, e.events[0]!.id, { tag: "  Anniversaire  ", txt: "Une phrase" });
  e = placerDansSerie(e, e.events[0]!.id, "aaaa").ed;
  e = retirer(e, "service:2", "bbbb");
  const m = versManifeste(serveur(), e);
  assert.ok(!("service:2" in m.slots), "un emplacement vide n'est pas envoyé");
  assert.equal(m.events[0]?.tag, "Anniversaire");
  assert.ok(parseManifest(m), "le serveur doit accepter le manifeste");
});
test("should_keep_server_only_fields_when_building_the_manifest", () => {
  const m = versManifeste(serveur(), ed());
  assert.equal(m.photos[0]?.file, "cms/photos/aaaa.jpg");
  assert.equal(m.rev, 4);
});
test("should_keep_pending_edits_and_drop_deleted_photos_when_the_server_changes", () => {
  let e = placer(placer(ed(), "intro", "aaaa").ed, "intro", "bbbb").ed;
  e = { ...e, photos: e.photos.map((p: { id: string }) => (p.id === "bbbb" ? { ...p, alt: "Modifié" } : p)) };
  const apres = { ...serveur(), rev: 5, photos: [photo("bbbb"), photo("cccc", false), photo("dddd")] };
  const r = reporter(e, apres);
  assert.deepEqual(r.photos.map((p: { id: string }) => p.id), ["bbbb", "cccc", "dddd"]);
  assert.equal(r.photos[0]?.alt, "Modifié");
  assert.deepEqual(idsDe(r.slots["intro"]!), ["bbbb"]);
});

// ---- objet photo : l'habillage voyage avec la photo ---------------------------------------------------------
const habille = { photo: "aaaa", legende: { actif: true, texte: "Le premier regard" }, fx: 0.2, fy: 0.8, format: "paysage" };

test("should_create_placements_without_dressing_when_placing", () => {
  const e = placer(ed(), "accueil:0", "aaaa").ed;
  assert.deepEqual(e.slots["accueil:0"]?.[0], parDefaut("aaaa"));
  assert.equal(e.slots["accueil:0"]?.[0]?.legende.actif, false);
  assert.equal(e.slots["accueil:0"]?.[0]?.format, "auto");
});
test("should_keep_the_dressing_when_reordering_or_when_the_server_changes", () => {
  const e = { ...ed(), slots: { intro: [habille, parDefaut("bbbb")] } };
  const bouge = { ...e, slots: { intro: deplacer(e.slots["intro"]!, 0, 1) } };
  assert.deepEqual(bouge.slots["intro"]?.[1], habille);
  const apres = reporter(bouge, { ...serveur(), rev: 9 });
  assert.deepEqual(apres.slots["intro"]?.[1], habille);
});
test("should_report_a_dressing_change_even_when_the_photos_are_the_same", () => {
  const base = { ...ed(), slots: { intro: [parDefaut("aaaa")] } };
  const e = { ...base, slots: { intro: [habille] } };
  assert.ok(changements(base, e).some((x) => /^Intro : habillage modifié/.test(x)), changements(base, e).join(" | "));
});
test("should_send_the_dressing_to_the_server_which_accepts_it", () => {
  const e = { ...ed(), slots: { intro: [habille] }, events: [] };
  const m = versManifeste(serveur(), e);
  assert.deepEqual(parseManifest(m)?.slots["intro"]?.[0], habille);
});
test("should_know_the_new_zones", () => {
  assert.equal(limite("apropos:portrait"), 1);
  assert.equal(limite("contact:mariage"), 1);
  assert.equal(nomZone("contact:portrait"), "Contact · Portrait");
  assert.equal(placer(ed(), "contact:mariage", "aaaa").erreur, undefined);
});
