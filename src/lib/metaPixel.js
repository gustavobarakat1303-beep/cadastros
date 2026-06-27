const META_TRACKED_PATHS = [
  /^\/feijoada\/?$/,
  /^\/feijoada\/convite\/[^/]+\/?$/,
]

export const isMetaTrackedPath = (pathname) =>
  META_TRACKED_PATHS.some((pattern) => pattern.test(pathname))

export function trackMetaEvent(eventName, parameters = {}) {
  if (
    typeof window === 'undefined' ||
    !isMetaTrackedPath(window.location.pathname) ||
    typeof window.fbq !== 'function'
  ) {
    return false
  }

  window.fbq('track', eventName, parameters)
  return true
}
