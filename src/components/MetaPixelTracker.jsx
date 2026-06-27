import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

import { isMetaTrackedPath, trackMetaEvent } from '../lib/metaPixel.js'

const WHATSAPP_LINK = /(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|whatsapp:\/\/)/i

export default function MetaPixelTracker() {
  const location = useLocation()
  const previousPath = useRef(window.location.pathname)

  useEffect(() => {
    const currentPath = location.pathname

    if (previousPath.current !== currentPath) {
      previousPath.current = currentPath

      if (isMetaTrackedPath(currentPath)) {
        trackMetaEvent('PageView')
      }
    }
  }, [location.pathname])

  useEffect(() => {
    const trackWhatsAppClick = (event) => {
      const link = event.target.closest?.('a[href]')
      const href = link?.getAttribute('href') || ''

      if (WHATSAPP_LINK.test(href)) {
        trackMetaEvent('Contact', {
          content_name: 'WhatsApp',
          content_category: 'Feijoada Nômade',
        })
      }
    }

    document.addEventListener('click', trackWhatsAppClick)
    return () => document.removeEventListener('click', trackWhatsAppClick)
  }, [])

  return null
}
