'use client'
import { useEffect } from 'react'

// (Removed unused ensureLinkForFont function)

export async function loadGoogleFont(fontName: string, timeout = 5000) {
  if (typeof window === 'undefined') return Promise.resolve()
  // const href = ensureLinkForFont(fontName)

  // Try to wait for document.fonts to load the font
  try {
    // Use quoted family name to ensure exact match for families with spaces
    const fontToLoad = `1em "${fontName}"`
    const p = document.fonts.load(fontToLoad)

    // Timeout wrapper
    const race = new Promise<void>((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error('Font load timeout')),
        timeout
      )
      p.then(() => {
        clearTimeout(t)
        resolve()
      }).catch((err) => {
        clearTimeout(t)
        reject(err)
      })
    })
    return race
  } catch {
    // Fallback: resolve after small delay to allow CSS to apply
    return new Promise<void>((res) => setTimeout(res, 400))
  }
}

export default function useGoogleFont(fontName?: string) {
  useEffect(() => {
    if (!fontName) return
    let mounted = true
    loadGoogleFont(fontName)
      .catch(() => {
        // ignore load errors
      })
      .finally(() => {
        if (!mounted) return
      })
    return () => {
      mounted = false
    }
  }, [fontName])
}
