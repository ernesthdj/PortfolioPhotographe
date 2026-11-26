import assert from "node:assert/strict";
import test from "node:test";
import { detectImage } from "../api/_lib/image.ts";

const bytes = (...n: number[]) => new Uint8Array(n);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

test("should_detect_jpeg_when_it_starts_with_ffd8ff", () => {
  assert.deepEqual(detectImage(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0)), { ext: "jpg", type: "image/jpeg" });
});
test("should_detect_png_when_it_starts_with_the_png_signature", () => {
  assert.deepEqual(detectImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)), { ext: "png", type: "image/png" });
});
test("should_detect_webp_when_riff_and_webp_markers_are_present", () => {
  assert.deepEqual(detectImage(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP"))), { ext: "webp", type: "image/webp" });
});
test("should_reject_other_formats_and_empty_input", () => {
  for (const bad of [bytes(), bytes(0xff, 0xd8), bytes(...ascii("GIF89a")), bytes(...ascii("<svg xmlns=")), bytes(...ascii("<?php echo 1;")), bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE"))]) {
    assert.equal(detectImage(bad), null);
  }
});
