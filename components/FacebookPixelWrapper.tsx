'use client'

import { useFacebookPixel } from '@/hooks/useFacebookPixel'

export default function FacebookPixelWrapper() {
  useFacebookPixel()
  return null // Não renderiza nada, apenas executa o hook
}
