'use client'

import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Configurar tamanho do canvas
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Canvas com tamanho exato da viewport
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
      
      // Estilo do canvas com tamanho exato
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Cores do tema
    const colors = {
      midnight: '#0D1B2A',
      royal: '#1B263B',
      aqua: '#00C2FF',
    }

    // Partículas de luz
    const particles: Array<{
      x: number
      y: number
      radius: number
      vx: number
      vy: number
      color: string
      opacity: number
      pulse: number
    }> = []

    // Criar partículas
    const createParticles = () => {
      particles.length = 0
      const particleCount = 10 // Aumentado para mais cobertura
      for (let i = 0; i < particleCount; i++) {
        // Distribuir melhor pela tela para evitar concentração
        const x = (i % 3) * (window.innerWidth / 3) + Math.random() * (window.innerWidth / 3)
        const y = Math.floor(i / 3) * (window.innerHeight / 4) + Math.random() * (window.innerHeight / 4)
        
        particles.push({
          x: x,
          y: y,
          radius: 3000 + Math.random() * 2000, // Muito maior ainda
          vx: (Math.random() - 0.5) * 50, // Velocidade muito reduzida
          vy: (Math.random() - 0.5) * 50, // Velocidade muito reduzida
          color: i % 2 === 0 ? colors.aqua : colors.royal,
          opacity: 0.12 + Math.random() * 0.18,
          pulse: Math.random() * Math.PI * 2,
        })
      }
    }
    createParticles()

    let animationFrameId: number
    let lastTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    // Função de animação
    const animate = (currentTime: number) => {
      // Sempre continuar o loop, independente do deltaTime
      animationFrameId = requestAnimationFrame(animate)
      
      const deltaTime = currentTime - lastTime

      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval)

        // Criar gradiente base estático sem animação para evitar piscar
        const gradient = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight)
        
        // Gradiente estático - sem animação para evitar efeito de piscar
        gradient.addColorStop(0, colors.royal)
        gradient.addColorStop(0.5, colors.midnight)
        gradient.addColorStop(1, colors.royal)

        // Preencher com gradiente cobrindo toda a área
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

        // Desenhar partículas de luz com blur
        particles.forEach((particle, index) => {
          // Atualizar posição
          particle.x += particle.vx
          particle.y += particle.vy

          // Rebater nas bordas suavemente
          if (particle.x < -particle.radius || particle.x > window.innerWidth + particle.radius) {
            particle.vx *= -1
            particle.x = Math.max(-particle.radius, Math.min(window.innerWidth + particle.radius, particle.x))
          }
          if (particle.y < -particle.radius || particle.y > window.innerHeight + particle.radius) {
            particle.vy *= -1
            particle.y = Math.max(-particle.radius, Math.min(window.innerHeight + particle.radius, particle.y))
          }

          // Sem efeito de pulso - valores constantes
          const currentRadius = particle.radius
          const currentOpacity = particle.opacity

          // Criar gradiente radial para cada partícula com blur mais suave (mais desfoque)
          const particleGradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            currentRadius
          )
          
          const color = particle.color
          const alpha1 = Math.floor(currentOpacity * 255).toString(16).padStart(2, '0')
          const alpha2 = Math.floor(currentOpacity * 0.15 * 255).toString(16).padStart(2, '0') // Mais suave
          const alpha3 = Math.floor(currentOpacity * 0.03 * 255).toString(16).padStart(2, '0') // Mais suave
          const alpha4 = Math.floor(currentOpacity * 0.005 * 255).toString(16).padStart(2, '0') // Muito suave
          
          particleGradient.addColorStop(0, `${color}${alpha1}`)
          particleGradient.addColorStop(0.1, `${color}${alpha2}`) // Fade muito rápido
          particleGradient.addColorStop(0.25, `${color}${alpha3}`) // Fade mais gradual
          particleGradient.addColorStop(0.5, `${color}${alpha4}`) // Fade ainda mais gradual
          particleGradient.addColorStop(0.75, `${color}${Math.floor(currentOpacity * 0.001 * 255).toString(16).padStart(2, '0')}`) // Fade extremamente gradual
          particleGradient.addColorStop(1, `${color}00`)

          // Aplicar composição screen para efeito de luz
          ctx.globalCompositeOperation = 'screen'
          ctx.fillStyle = particleGradient
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, currentRadius, 0, Math.PI * 2)
          ctx.fill()
        })

        ctx.globalCompositeOperation = 'source-over'
      }
    }

    animate(0)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div 
      className="fixed inset-0 w-full h-full z-0"
      style={{
        background: '#0D1B2A', // Cor de fundo escura para cobrir bordas
        overflow: 'hidden', // Garantir que nada apareça fora
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ 
          filter: 'blur(60px)', // Aplicar blur CSS para muito mais desfoque
          pointerEvents: 'none', // Permitir cliques através do canvas
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          objectFit: 'cover', // Garantir que cubra toda a área
        }}
      />
    </div>
  )
}

