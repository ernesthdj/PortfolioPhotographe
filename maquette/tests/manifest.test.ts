import assert from "node:assert/strict";
import test from "node:test";
import { emptyManifest, parseManifest, toPublic } from "../api/_lib/manifest.ts";

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
  assert.deepEqual(pub.slots.intro, ["aaaa"]);
  assert.deepEqual(pub.events.map((e) => e.id), ["evt2"]);
  assert.deepEqual(pub.events[0]?.photos, ["aaaa"]);
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
  assert.deepEqual(r.slots.intro, ["bbbb"]);
  assert.deepEqual(r.slots["service:0"], []);
  assert.deepEqual(r.events[0]?.photos, ["bbbb"]);
  assert.notEqual(parseManifest(r), null);
});
test("should_leave_the_manifest_unchanged_when_removing_an_unknown_photo", async () => {
  const { removePhoto } = await import("../api/_lib/manifest.ts");
  assert.deepEqual(removePhoto(base(), "zzzz"), base());
});

test("should_read_a_unique_url_without_cache_when_reading_the_manifest", async () => {
  const { readManifest } = await import("../api/_lib/manifest.ts");
  const vus: string[] = [];
  let t = 1000;
  const deps = {
    head: async () => ({ url: "https://store.example/cms/manifest.json" }),
    fetch: async (input: string | URL | Request, init?: RequestInit) => { vus.push(String(input)); assert.equal(init?.cache, "no-store"); return Response.json(emptyManifest()); },
    now: () => t++,
  };
  assert.deepEqual(await readManifest(deps), emptyManifest());
  await readManifest(deps);
  assert.equal(vus.length, 2);
  assert.notEqual(vus[0], vus[1]);
  assert.ok(vus.every((u) => u.startsWith("https://store.example/cms/manifest.json?v=")));
});
test("should_return_null_when_the_manifest_is_missing_unreadable_or_invalid", async () => {
  const { readManifest } = await import("../api/_lib/manifest.ts");
  const { BlobNotFoundError } = await import("@vercel/blob");
  const base = { head: async () => ({ url: "https://store.example/m.json" }), now: () => 1 };
  assert.equal(await readManifest({ ...base, head: async () => { throw new BlobNotFoundError(); }, fetch: async () => Response.json({}) }), null);
  assert.equal(await readManifest({ ...base, fetch: async () => new Response("", { status: 404 }) }), null);
  assert.equal(await readManifest({ ...base, fetch: async () => new Response("pas du json") }), null);
  assert.equal(await readManifest({ ...base, fetch: async () => Response.json({ version: 9 }) }), null);
});
test("should_propagate_the_error_when_the_store_is_unreachable", async () => {
  const { readManifest } = await import("../api/_lib/manifest.ts");
  await assert.rejects(readManifest({ head: async () => { throw new Error("réseau"); }, fetch: async () => Response.json({}), now: () => 1 }), /réseau/);
});
