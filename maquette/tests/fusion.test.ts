import assert from "node:assert/strict";
import test from "node:test";
import { fusionner } from "../data/cms-fusion.js";

const BASE = "https://store.example/";
const photo = (id: string, extra: Record<string, unknown> = {}) => ({ id, file: `cms/photos/${id}.jpg`, w: 3000, h: 2000, alt: `Alt ${id}`, published: true, fx: 0.5, fy: 0.5, ...extra });
const manifeste = (m: Record<string, unknown> = {}) => ({ version: 1, rev: 3, photos: [photo("aaaa"), photo("bbbb")], slots: {}, events: [], ...m });

test("should_return_nothing_when_manifest_is_null", () => {
  assert.deepEqual(fusionner(null, 189, BASE), { photos: [], slots: {}, events: [] });
});
test("should_return_nothing_when_manifest_is_malformed", () => {
  assert.deepEqual(fusionner({ photos: "oups" }, 189, BASE), { photos: [], slots: {}, events: [] });
  assert.deepEqual(fusionner("texte", 189, BASE), { photos: [], slots: {}, events: [] });
});
test("should_append_photos_after_the_base_ones_with_ratio_and_public_url", () => {
  const r = fusionner(manifeste(), 189, BASE);
  assert.equal(r.photos.length, 2);
  assert.equal(r.photos[0]?.src, BASE + "cms/photos/aaaa.jpg");
  assert.equal(r.photos[0]?.r, 1.5);
  assert.equal(r.photos[0]?.alt, "Alt aaaa");
  assert.equal(r.photos[0]?.cms, true);
});
test("should_map_slots_and_events_to_indices_after_the_base", () => {
  const r = fusionner(manifeste({ slots: { intro: ["bbbb", "aaaa"] }, events: [{ id: "evt1", svc: 2, tag: "Famille", txt: "Une phrase", photos: ["aaaa", "bbbb"] }] }), 189, BASE);
  assert.deepEqual(r.slots, { intro: [190, 189] });
  assert.deepEqual(r.events, [{ svc: 2, tag: "Famille", txt: "Une phrase", ph: [189, 190] }]);
});
test("should_skip_unpublished_photos_and_drop_them_from_slots_and_events", () => {
  const r = fusionner(manifeste({ photos: [photo("aaaa", { published: false }), photo("bbbb")], slots: { intro: ["aaaa", "bbbb"] }, events: [{ id: "evt1", svc: 0, tag: "", txt: "", photos: ["aaaa"] }] }), 10, BASE);
  assert.equal(r.photos.length, 1);
  assert.deepEqual(r.slots, { intro: [10] });
  assert.deepEqual(r.events, []);
});
test("should_reject_files_outside_the_cms_folder_and_duplicate_ids", () => {
  const r = fusionner(manifeste({ photos: [photo("aaaa", { file: "../secret.jpg" }), photo("bbbb"), photo("bbbb")] }), 0, BASE);
  assert.equal(r.photos.length, 1);
});
test("should_ignore_events_with_invalid_service", () => {
  const r = fusionner(manifeste({ events: [{ id: "evt1", svc: 9, tag: "x", txt: "y", photos: ["aaaa"] }] }), 0, BASE);
  assert.deepEqual(r.events, []);
});
test("should_use_a_default_alt_when_missing", () => {
  const r = fusionner(manifeste({ photos: [photo("aaaa", { alt: "  " })] }), 0, BASE);
  assert.equal(r.photos[0]?.alt, "Photographie");
});

test("should_read_placement_objects_as_well_as_plain_ids", () => {
  const pl = (photo: string) => ({ photo, legende: { actif: false, texte: "" }, fx: null, fy: null, format: "auto" });
  const r = fusionner(manifeste({ slots: { intro: [pl("bbbb"), "aaaa"] }, events: [{ id: "evt1", svc: 0, tag: "t", txt: "x", photos: [pl("aaaa")] }] }), 189, BASE);
  assert.deepEqual(r.slots, { intro: [190, 189] });
  assert.deepEqual(r.events[0]?.ph, [189]);
});
