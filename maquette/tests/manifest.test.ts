import assert from "node:assert/strict";
import test from "node:test";
import { compactManifest, emptyManifest, parseManifest, placementParDefaut, toPublic } from "../api/_lib/manifest.ts";

const photo = (id: string, published = true) => ({ id, file: `cms/photos/${id}.jpg`, w: 2000, h: 1333, alt: "Un texte", published, fx: 0.5, fy: 0.5 });
const base = () => ({ ...emptyManifest(), photos: [photo("aaaa"), photo("bbbb", false)] });

test("should_accept_the_empty_manifest", () => {
  assert.deepEqual(parseManifest(emptyManifest()), emptyManifest());
});
test("should_accept_a_manifest_with_photos_slots_and_events", () => {
  const m = { ...base(), slots: { intro: ["aaaa"], "service:0": ["bbbb"] }, events: [{ id: "evt1", svc: 0, tag: "Mariage", txt: "Une phrase", photos: ["aaaa"] }] };
  assert.notEqual(parseManifest(m), null);
});
test("should_reject_when_input_is_not_an_object_or_has_a_wrong_version", () => {
  for (const bad of [null, "x", 3, [], { ...emptyManifest(), version: 2 }]) assert.equal(parseManifest(bad), null);
});
test("should_reject_when_a_slot_name_is_unknown", () => {
  assert.equal(parseManifest({ ...base(), slots: { inconnu: ["aaaa"] } }), null);
});
test("should_reject_when_a_slot_exceeds_its_limit", () => {
  const m = { ...base(), photos: Array.from({ length: 7 }, (_, i) => photo(`ph0${i}x`)) };
  assert.equal(parseManifest({ ...m, slots: { "accueil:0": m.photos.map((p) => p.id) } }), null);
});
test("should_reject_when_a_slot_references_an_unknown_photo", () => {
  assert.equal(parseManifest({ ...base(), slots: { intro: ["zzzz"] } }), null);
});
test("should_reject_when_a_photo_file_is_outside_the_cms_folder", () => {
  const m = base();
  m.photos[0]!.file = "../secret.jpg";
  assert.equal(parseManifest(m), null);
  m.photos[0]!.file = "cms/photos/../../x.jpg";
  assert.equal(parseManifest(m), null);
});
test("should_reject_when_photo_ids_are_duplicated_or_invalid", () => {
  assert.equal(parseManifest({ ...base(), photos: [photo("aaaa"), photo("aaaa")] }), null);
  assert.equal(parseManifest({ ...base(), photos: [photo("AB")] }), null);
});
test("should_reject_when_numbers_are_out_of_range", () => {
  const m = base();
  m.photos[0]!.fx = 1.5;
  assert.equal(parseManifest(m), null);
  m.photos[0]!.fx = 0.5;
  m.photos[0]!.w = 0;
  assert.equal(parseManifest(m), null);
});
test("should_reject_when_an_event_uses_a_wrong_service_or_unknown_photo", () => {
  assert.equal(parseManifest({ ...base(), events: [{ id: "evt1", svc: 9, tag: "t", txt: "x", photos: [] }] }), null);
  assert.equal(parseManifest({ ...base(), events: [{ id: "evt1", svc: 0, tag: "t", txt: "x", photos: ["zzzz"] }] }), null);
});
test("should_reject_when_text_is_too_long", () => {
  const m = base();
  m.photos[0]!.alt = "x".repeat(201);
  assert.equal(parseManifest(m), null);
});

test("should_hide_unpublished_photos_when_building_the_public_view", () => {
  const m = parseManifest({ ...base(), slots: { intro: ["aaaa", "bbbb"] }, events: [{ id: "evt1", svc: 0, tag: "t", txt: "x", photos: ["bbbb"] }, { id: "evt2", svc: 1, tag: "t", txt: "x", photos: ["aaaa", "bbbb"] }] });
  assert.ok(m);
  const pub = toPublic(m);
  assert.deepEqual(pub.photos.map((p) => p.id), ["aaaa"]);
  assert.deepEqual(pub.slots.intro?.map((p) => p.photo), ["aaaa"]);
  assert.deepEqual(pub.events.map((e) => e.id), ["evt2"]);
  assert.deepEqual(pub.events[0]?.photos.map((p) => p.photo), ["aaaa"]);
});

test("should_add_a_photo_unpublished_and_in_no_slot_when_adding", async () => {
  const { addPhoto } = await import("../api/_lib/manifest.ts");
  const m = addPhoto(emptyManifest(), photo("cccc", false));
  assert.deepEqual(m.photos.map((p) => p.id), ["cccc"]);
  assert.equal(m.photos[0]?.published, false);
  assert.deepEqual(m.slots, {});
  assert.notEqual(parseManifest(m), null);
});
test("should_remove_a_photo_from_photos_slots_and_events_when_deleting", async () => {
  const { removePhoto } = await import("../api/_lib/manifest.ts");
  const m = parseManifest({ ...base(), slots: { intro: ["aaaa", "bbbb"], "service:0": ["aaaa"] }, events: [{ id: "evt1", svc: 0, tag: "t", txt: "x", photos: ["aaaa", "bbbb"] }] });
  assert.ok(m);
  const r = removePhoto(m, "aaaa");
  assert.deepEqual(r.photos.map((p) => p.id), ["bbbb"]);
  assert.deepEqual(r.slots.intro?.map((p) => p.photo), ["bbbb"]);
  assert.deepEqual(r.slots["service:0"], []);
  assert.deepEqual(r.events[0]?.photos.map((p) => p.photo), ["bbbb"]);
  assert.notEqual(parseManifest(r), null);
});
test("should_leave_the_manifest_unchanged_when_removing_an_unknown_photo", async () => {
  const { removePhoto } = await import("../api/_lib/manifest.ts");
  assert.deepEqual(removePhoto(base(), "zzzz"), base());
});

// ---- objet photo (placement) : forme, compatibilité, stockage -----------------------------------------------
const dressed = { photo: "aaaa", legende: { actif: true, texte: "Le premier regard" }, fx: 0.3, fy: 0.7, format: "portrait" };

test("should_read_a_plain_id_as_a_placement_without_dressing", () => {
  const m = parseManifest({ ...base(), slots: { intro: ["aaaa"] } });
  assert.deepEqual(m?.slots.intro, [placementParDefaut("aaaa")]);
});
test("should_accept_a_dressed_placement_in_a_slot_and_in_a_series", () => {
  const m = parseManifest({ ...base(), slots: { "service:0": [dressed] }, events: [{ id: "evt1", svc: 0, tag: "t", txt: "x", photos: [dressed, "bbbb"] }] });
  assert.deepEqual(m?.slots["service:0"]?.[0], dressed);
  assert.deepEqual(m?.events[0]?.photos[0], dressed);
  assert.deepEqual(m?.events[0]?.photos[1], placementParDefaut("bbbb"));
});
test("should_default_missing_dressing_fields_when_a_placement_only_names_the_photo", () => {
  const m = parseManifest({ ...base(), slots: { intro: [{ photo: "aaaa" }] } });
  assert.deepEqual(m?.slots.intro, [placementParDefaut("aaaa")]);
});
test("should_reject_an_invalid_dressing", () => {
  const mauvais = [
    { photo: "zzzz" },                                              // photo inconnue
    { photo: "aaaa", format: "carre-magique" },                     // format inconnu
    { photo: "aaaa", fx: 0.5 },                                     // fx sans fy
    { photo: "aaaa", fx: 2, fy: 0.5 },                              // hors de 0..1
    { photo: "aaaa", legende: { actif: "oui", texte: "x" } },       // actif n'est pas un booléen
    { photo: "aaaa", legende: { actif: true, texte: "x".repeat(161) } }, // légende trop longue
  ];
  for (const p of mauvais) assert.equal(parseManifest({ ...base(), slots: { intro: [p] } }), null, JSON.stringify(p));
});
test("should_drop_a_duplicate_photo_in_the_same_list_without_failing", () => {
  const m = parseManifest({ ...base(), slots: { intro: ["aaaa", "bbbb", "aaaa"] } });
  assert.deepEqual(m?.slots.intro?.map((p) => p.photo), ["aaaa", "bbbb"]);
});
test("should_accept_the_new_zones_and_their_limits", () => {
  for (const cle of ["apropos:portrait", "contact:mariage", "contact:portrait"]) {
    assert.notEqual(parseManifest({ ...base(), slots: { [cle]: ["aaaa"] } }), null, cle);
    assert.equal(parseManifest({ ...base(), slots: { [cle]: ["aaaa", "bbbb"] } }), null, cle + " : une seule photo");
  }
});
test("should_store_plain_ids_for_undressed_placements_so_the_old_code_can_still_read_them", () => {
  const habille = { ...dressed, photo: "bbbb" };
  const m = parseManifest({ ...base(), slots: { intro: ["aaaa", habille] }, events: [{ id: "evt1", svc: 0, tag: "t", txt: "x", photos: ["aaaa"] }] });
  assert.ok(m);
  const stocke = compactManifest(m) as { slots: Record<string, unknown[]>; events: { photos: unknown[] }[] };
  assert.deepEqual(stocke.slots.intro, ["aaaa", habille]);
  assert.deepEqual(stocke.events[0]?.photos, ["aaaa"]);
  assert.deepEqual(parseManifest(stocke), m, "ce qui est stocké se relit à l'identique");
});
test("should_store_a_manifest_without_any_dressing_exactly_as_before_the_photo_objects", () => {
  const m = parseManifest({ ...base(), slots: { intro: ["aaaa", "bbbb"], "service:0": ["aaaa"] }, events: [{ id: "evt1", svc: 0, tag: "t", txt: "x", photos: ["bbbb"] }] });
  assert.ok(m);
  const stocke = compactManifest(m) as { slots: unknown; events: unknown };
  assert.deepEqual(stocke.slots, { intro: ["aaaa", "bbbb"], "service:0": ["aaaa"] });
  assert.deepEqual(stocke.events, [{ id: "evt1", svc: 0, tag: "t", txt: "x", photos: ["bbbb"] }]);
});
