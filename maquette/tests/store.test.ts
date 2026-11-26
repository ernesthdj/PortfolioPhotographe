import assert from "node:assert/strict";
import test from "node:test";
import { BlobError } from "@vercel/blob";
import { ConflictError, emptyManifest, readManifest, updateManifest, writeManifest, addPhoto, type Manifest, type StoreDeps } from "../api/_lib/manifest.ts";

/** Faux stockage en mémoire : fichiers immuables, `put` refuse d'écraser comme le vrai Blob. */
function fauxStockage() {
  const fichiers = new Map<string, string>();
  const journal: string[] = [];
  const deps: StoreDeps = {
    list: async (prefix) => [...fichiers.keys()].filter((k) => k.startsWith(prefix)).map((pathname) => ({ pathname, url: `https://store.example/${pathname}` })),
    fetch: async (input) => {
      const chemin = String(input).replace("https://store.example/", "");
      const corps = fichiers.get(chemin);
      return corps === undefined ? new Response("", { status: 404 }) : new Response(corps);
    },
    put: async (pathname, body) => {
      if (fichiers.has(pathname)) throw new BlobError("This blob already exists, use `allowOverwrite: true`");
      fichiers.set(pathname, body);
      journal.push("put " + pathname);
    },
    del: async (pathnames) => { for (const n of pathnames) { fichiers.delete(n); journal.push("del " + n); } },
  };
  return { fichiers, journal, deps };
}
const photo = (id: string) => ({ id, file: `cms/photos/${id}.jpg`, w: 2000, h: 1333, alt: "t", published: false, fx: 0.5, fy: 0.5 });

test("should_return_null_when_no_version_exists_yet", async () => {
  assert.equal(await readManifest(fauxStockage().deps), null);
});
test("should_read_the_highest_version_when_several_exist", async () => {
  const { deps } = fauxStockage();
  for (const rev of [1, 2, 10, 3]) await writeManifest({ ...emptyManifest(), rev }, deps);
  assert.equal((await readManifest(deps))?.rev, 10);
});
test("should_store_each_version_in_its_own_padded_file_without_overwriting", async () => {
  const { fichiers, deps } = fauxStockage();
  await writeManifest({ ...emptyManifest(), rev: 7 }, deps);
  assert.deepEqual([...fichiers.keys()], ["cms/manifest/00000007.json"]);
});
test("should_throw_a_conflict_when_the_version_already_exists", async () => {
  const { deps } = fauxStockage();
  await writeManifest({ ...emptyManifest(), rev: 1 }, deps);
  await assert.rejects(writeManifest({ ...emptyManifest(), rev: 1 }, deps), ConflictError);
});
test("should_propagate_other_storage_errors_when_writing", async () => {
  const { deps } = fauxStockage();
  await assert.rejects(writeManifest(emptyManifest(), { ...deps, put: async () => { throw new Error("réseau"); } }), /réseau/);
});
test("should_ignore_unrelated_files_and_invalid_content_when_reading", async () => {
  const { fichiers, deps } = fauxStockage();
  fichiers.set("cms/manifest/notes.txt", "x");
  fichiers.set("cms/manifest/99999999.json", "pas du json");
  assert.equal(await readManifest(deps), null);   // la plus haute version est illisible : on ne devine pas
});
test("should_keep_only_the_last_ten_versions_when_writing", async () => {
  const { fichiers, deps } = fauxStockage();
  for (let rev = 1; rev <= 14; rev++) await writeManifest({ ...emptyManifest(), rev }, deps);
  const restants = [...fichiers.keys()].sort();
  assert.equal(restants.length, 10);
  assert.equal(restants[0], "cms/manifest/00000005.json");
  assert.equal(restants[9], "cms/manifest/00000014.json");
});
test("should_not_fail_the_write_when_the_cleanup_fails", async () => {
  const { deps } = fauxStockage();
  for (let rev = 1; rev <= 12; rev++) await writeManifest({ ...emptyManifest(), rev }, { ...deps, del: async () => { throw new Error("nettoyage"); } });
  assert.equal((await readManifest(deps))?.rev, 12);
});

test("should_increment_the_version_when_updating", async () => {
  const { deps } = fauxStockage();
  const a = await updateManifest((m) => addPhoto(m, photo("aaaa")), deps);
  const b = await updateManifest((m) => addPhoto(m, photo("bbbb")), deps);
  assert.equal(a?.rev, 1);
  assert.equal(b?.rev, 2);
  assert.deepEqual((await readManifest(deps))?.photos.map((p) => p.id), ["aaaa", "bbbb"]);
});
test("should_write_nothing_and_return_null_when_there_is_nothing_to_change", async () => {
  const { journal, deps } = fauxStockage();
  assert.equal(await updateManifest(() => null, deps), null);
  assert.deepEqual(journal, []);
});
test("should_not_lose_either_change_when_two_updates_run_at_the_same_time", async () => {
  const { deps } = fauxStockage();
  await Promise.all([
    updateManifest((m) => addPhoto(m, photo("aaaa")), deps),
    updateManifest((m) => addPhoto(m, photo("bbbb")), deps),
    updateManifest((m) => addPhoto(m, photo("cccc")), deps),
  ]);
  const final = await readManifest(deps) as Manifest;
  assert.deepEqual(final.photos.map((p) => p.id).sort(), ["aaaa", "bbbb", "cccc"]);
  assert.equal(final.rev, 3);
});
test("should_replay_on_fresh_state_when_a_conflict_happens", async () => {
  const { deps } = fauxStockage();
  let appels = 0;
  const concurrent: StoreDeps = {
    ...deps,
    put: async (pathname, body) => {
      if (appels++ === 0) await writeManifest({ ...addPhoto(emptyManifest(), photo("zzzz")), rev: 1 }, deps);   // un autre écrit juste avant nous
      return deps.put(pathname, body);
    },
  };
  const r = await updateManifest((m) => addPhoto(m, photo("aaaa")), concurrent);
  assert.equal(r?.rev, 2);
  assert.deepEqual(r?.photos.map((p) => p.id), ["zzzz", "aaaa"]);
});
test("should_give_up_with_a_conflict_after_four_failed_attempts", async () => {
  const { deps } = fauxStockage();
  await assert.rejects(updateManifest((m) => m, { ...deps, put: async () => { throw new BlobError("This blob already exists"); } }), ConflictError);
});
