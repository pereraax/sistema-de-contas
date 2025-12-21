'use client'

import { Suspense } from 'react'
import ModalEmailConfirmadoSucesso from './ModalEmailConfirmadoSucesso'

export default function EmailConfirmadoSucessoWrapper() {
  return (
    <Suspense fallback={null}>
      <ModalEmailConfirmadoSucesso />
    </Suspense>
  )
}













