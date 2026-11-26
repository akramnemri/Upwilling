/**
 * Stand-in for `sharp` in the migration bundle only (scripts/bundle-entries.mjs): payload.config.ts hands
 * sharp to Payload for image resizing, which migrations never do, and the native package cannot be
 * bundled. Anything that does call it fails loudly instead of silently skipping an image.
 */
function sharpUnavailable(): never {
  throw new Error("sharp is not available in the migration container");
}

export default sharpUnavailable;
