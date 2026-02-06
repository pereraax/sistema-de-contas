'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import logoTipoFundoClaro from '@/assets/fundo claro.png'

interface ModalLoginConcluidoProps {
  isOpen: boolean
  onClose: () => void
  mensagem?: string
  titulo?: string
}

export default function ModalLoginConcluido({ isOpen, onClose }: ModalLoginConcluidoProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 100)

      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(() => {
          onClose()
        }, 300)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-white transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center justify-center w-full h-full p-8">
        <Image
          src={logoTipoFundoClaro}
          alt="Logo"
          width={200}
          height={200}
          className="object-contain w-48 h-48 sm:w-56 sm:h-56"
          priority
        />
      </div>
    </div>
  )
}
