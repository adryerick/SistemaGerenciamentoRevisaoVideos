/** Keep a valid selection when the first upload arrives or a version is removed. */
export function selectedVersionId(versions: readonly { id: number }[], currentId: number): number {
  return versions.some((version) => version.id === currentId) ? currentId : versions[0]?.id ?? 0;
}
