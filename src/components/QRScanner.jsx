import { useEffect, useRef } from 'react'

export default function QRScanner({ onScan, active }) {
  const scannerRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    if (!active) return

    let scanner = null

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [0], // camera only
        },
        false
      )

      scanner.render(
        (decodedText) => {
          onScan(decodedText)
        },
        (error) => {
          // silent
        }
      )

      instanceRef.current = scanner
    })

    return () => {
      if (instanceRef.current) {
        instanceRef.current.clear().catch(() => {})
        instanceRef.current = null
      }
    }
  }, [active])

  return <div id="reader" ref={scannerRef} className="w-full rounded-lg overflow-hidden" />
}
