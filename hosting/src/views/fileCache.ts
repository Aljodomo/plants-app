async function getFileCache() {
  return await window.caches.open('plants-app-files')
}

export async function cachedBlobUrl(url?: string | null): Promise<string | undefined> {
  if (!url) return undefined
  const request = new URL(url)
  const fileCache = await getFileCache()
  const cacheEntry = await fileCache.match(request)
  if (!cacheEntry) {
    console.warn(`Cache miss: ${url}`)
    await fileCache.add(request)
  }
  const cacheHit = (await fileCache.match(request))!
  return URL.createObjectURL(await cacheHit.blob())
}
