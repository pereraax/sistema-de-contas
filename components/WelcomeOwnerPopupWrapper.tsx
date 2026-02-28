'use client'

import { Suspense } from 'react'
import WelcomeOwnerPopup from './WelcomeOwnerPopup'

export default function WelcomeOwnerPopupWrapper() {
  return (
    <Suspense fallback={null}>
      <WelcomeOwnerPopup />
    </Suspense>
  )
}
