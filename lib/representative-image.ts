/**
 * Resolve a representative's image URL for the client.
 *
 * imageLocalPath values come in two shapes:
 *   1. Legacy NA: a basename or absolute local fs path. The public asset
 *      lives at /representatives/<basename>.
 *   2. New provincial: a relative web path like "kp/foo-1.jpg". The public
 *      asset lives at /representatives/<relativePath>.
 */
export function resolveRepresentativeImageUrl(
  imageLocalPath: string | null | undefined,
  fallback: string | null | undefined,
): string | null {
  if (!imageLocalPath) return fallback ?? null;

  // Already web-absolute
  if (imageLocalPath.startsWith("/")) return imageLocalPath;

  // Subfolder form like "kp/foo.jpg" — keep the path as-is under /representatives
  if (imageLocalPath.includes("/") && !imageLocalPath.startsWith("data/")) {
    return `/representatives/${imageLocalPath}`;
  }

  // Legacy: treat as basename (handles paths like "data/.../Foo.jpg" too)
  const parts = imageLocalPath.split("/");
  const basename = parts[parts.length - 1];
  return `/representatives/${basename}`;
}
