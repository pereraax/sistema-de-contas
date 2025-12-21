'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react'

interface ImageEditorProps {
  imageFile: File
  aspectRatio?: number // 8/3 para banners 1920x720
  onSave: (croppedImageBlob: Blob) => void
  onCancel: () => void
}

export default function ImageEditor({ imageFile, aspectRatio = 8/3, onSave, onCancel }: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [baseScale, setBaseScale] = useState(1) // Escala base para preencher container
  const [zoomScale, setZoomScale] = useState(1) // Zoom adicional (começa em 1 = 100%)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  
  // Calcular escala total
  const totalScale = baseScale * zoomScale

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string)
    }
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  // Função para limitar posição dentro dos limites (useCallback para evitar problemas de dependência)
  const constrainPosition = useCallback((newPosition: { x: number, y: number }, scale: number = totalScale) => {
    if (!imageRef.current || !containerRef.current) return newPosition
    
    const img = imageRef.current
    const container = containerRef.current
    
    const imgWidth = (img.naturalWidth || img.width) * scale
    const imgHeight = (img.naturalHeight || img.height) * scale
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    // Se a imagem é menor que o container, não pode se mover
    if (imgWidth <= containerWidth && imgHeight <= containerHeight) {
      return { x: 0, y: 0 }
    }
    
    // Calcular limites: imagem não pode sair completamente do container
    // A imagem está centralizada, então os limites são baseados na diferença de tamanho
    const maxX = Math.max(0, (imgWidth - containerWidth) / 2)
    const maxY = Math.max(0, (imgHeight - containerHeight) / 2)
    const minX = -maxX
    const minY = -maxY
    
    return {
      x: Math.max(minX, Math.min(maxX, newPosition.x)),
      y: Math.max(minY, Math.min(maxY, newPosition.y))
    }
  }, [totalScale])

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        }
        const constrained = constrainPosition(newPosition)
        setPosition(constrained)
      }
    }

    const handleGlobalMouseUp = () => {
      setIsDragging(false)
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const touch = e.touches[0]
        const newPosition = {
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y
        }
        const constrained = constrainPosition(newPosition)
        setPosition(constrained)
      }
    }

    const handleGlobalTouchEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove)
      window.addEventListener('mouseup', handleGlobalMouseUp)
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
      window.addEventListener('touchend', handleGlobalTouchEnd)
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove)
        window.removeEventListener('mouseup', handleGlobalMouseUp)
        window.removeEventListener('touchmove', handleGlobalTouchMove)
        window.removeEventListener('touchend', handleGlobalTouchEnd)
      }
    }
  }, [isDragging, dragStart, constrainPosition])

  const handleImageLoad = () => {
    // Ajustar escala inicial para preencher o container
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current
      const container = containerRef.current
      
      // Usar dimensões naturais da imagem
      const imgWidth = img.naturalWidth || img.width
      const imgHeight = img.naturalHeight || img.height
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      
      // Calcular escala para preencher o container mantendo aspect ratio
      const scaleX = containerWidth / imgWidth
      const scaleY = containerHeight / imgHeight
      const scale = Math.max(scaleX, scaleY) // Preencher sem deixar espaços
      
      setBaseScale(scale)
      setZoomScale(1) // Resetar zoom ao carregar nova imagem
      setPosition({ x: 0, y: 0 })
    }
  }
  
  // Ajustar posição quando zoom mudar para manter imagem dentro dos limites
  useEffect(() => {
    if (imageRef.current && containerRef.current) {
      setPosition(prev => constrainPosition(prev))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomScale])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Apenas botão esquerdo
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      })
    }
  }


  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
    // Reajustar posição após rotação
    setTimeout(() => {
      if (imageRef.current && containerRef.current) {
        setPosition(prev => constrainPosition(prev))
      }
    }, 50)
  }
  
  const handleZoomIn = () => {
    setZoomScale(prev => {
      const newZoom = Math.min(3, prev * 1.1) // Máximo 300%
      return newZoom
    })
  }
  
  const handleZoomOut = () => {
    setZoomScale(prev => {
      const newZoom = Math.max(1, prev * 0.9) // Mínimo 100%
      return newZoom
    })
  }

  const handleCropAndSave = () => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imageRef.current
    const container = containerRef.current

    // Definir tamanho do canvas (1920x720 para banners)
    const outputWidth = 1920
    const outputHeight = 720
    canvas.width = outputWidth
    canvas.height = outputHeight

    // Limpar canvas com fundo preto
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, outputWidth, outputHeight)

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // Calcular a área visível da imagem no container
    // A imagem está transformada com totalScale (baseScale * zoomScale) e position
    const scaledImgWidth = img.naturalWidth * totalScale
    const scaledImgHeight = img.naturalHeight * totalScale

    // Posição do topo-esquerdo da imagem escalada no container
    const imgLeft = (containerWidth / 2) - (scaledImgWidth / 2) + position.x
    const imgTop = (containerHeight / 2) - (scaledImgHeight / 2) + position.y

    // Calcular qual parte da imagem original está visível
    const visibleLeft = Math.max(0, -imgLeft / totalScale)
    const visibleTop = Math.max(0, -imgTop / totalScale)
    const visibleRight = Math.min(img.naturalWidth, (containerWidth - imgLeft) / totalScale)
    const visibleBottom = Math.min(img.naturalHeight, (containerHeight - imgTop) / totalScale)

    const sourceX = visibleLeft
    const sourceY = visibleTop
    const sourceWidth = visibleRight - visibleLeft
    const sourceHeight = visibleBottom - visibleTop

    // Aplicar rotação se necessário
    if (rotation !== 0) {
      ctx.save()
      ctx.translate(outputWidth / 2, outputHeight / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-outputWidth / 2, -outputHeight / 2)
    }

    // Desenhar a parte visível da imagem, redimensionada para o canvas de saída
    if (sourceWidth > 0 && sourceHeight > 0) {
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      )
    }

    if (rotation !== 0) {
      ctx.restore()
    }

    // Converter para blob
    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob)
      }
    }, 'image/jpeg', 0.95)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 glass-backdrop">
      <div className="bg-brand-royal rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl border border-white/20 max-w-4xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-2xl font-display font-bold text-brand-clean">
            Editar Imagem do Banner
          </h2>
          <button
            onClick={onCancel}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-smooth"
          >
            <X size={20} className="sm:w-6 sm:h-6 text-brand-clean" />
          </button>
        </div>

        {/* Área de edição */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-4 min-h-0">
          {/* Container da imagem */}
          <div
            ref={containerRef}
            className="flex-1 bg-brand-midnight rounded-lg sm:rounded-xl overflow-hidden relative border-2 border-brand-aqua/30 min-h-[150px] sm:min-h-[300px] max-h-[70vh]"
            style={{ 
              aspectRatio: aspectRatio,
              width: '100%'
            }}
          >
            {imageSrc && (
              <>
                <div
                  className="absolute inset-0 touch-none"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Preview"
                    className="absolute top-1/2 left-1/2"
                    style={{
                      transform: `translate(-50%, -50%) scale(${totalScale}) rotate(${rotation}deg)`,
                      maxWidth: 'none',
                      height: 'auto',
                      transition: isDragging ? 'none' : 'transform 0.2s',
                      pointerEvents: 'none'
                    }}
                    onLoad={handleImageLoad}
                    draggable={false}
                  />
                </div>
              </>
            )}
            
            {/* Overlay de guias */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-dashed border-brand-aqua/50"></div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 p-2 sm:p-4 bg-brand-midnight/50 rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-brand-clean/70 hidden sm:inline">Controles:</span>
              
              <button
                onClick={handleRotate}
                className="p-1.5 sm:p-2 bg-brand-midnight hover:bg-white/10 rounded-lg transition-smooth text-brand-clean"
                title="Rotacionar 90°"
              >
                <RotateCw size={16} className="sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handleZoomIn}
                className="p-1.5 sm:p-2 bg-brand-midnight hover:bg-white/10 rounded-lg transition-smooth text-brand-clean"
                title="Aumentar zoom"
              >
                <ZoomIn size={16} className="sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={handleZoomOut}
                className="p-1.5 sm:p-2 bg-brand-midnight hover:bg-white/10 rounded-lg transition-smooth text-brand-clean"
                title="Diminuir zoom"
              >
                <ZoomOut size={16} className="sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => {
                  setPosition({ x: 0, y: 0 })
                  setZoomScale(1)
                  setRotation(0)
                }}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-brand-midnight hover:bg-white/10 rounded-lg transition-smooth text-brand-clean text-xs sm:text-sm"
                title="Resetar Posição e Zoom"
              >
                Resetar
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-midnight text-brand-clean rounded-lg font-medium hover:bg-white/10 transition-smooth text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleCropAndSave}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-aqua text-brand-midnight rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Aplicar e Continuar</span>
                <span className="sm:hidden">Aplicar</span>
              </button>
            </div>
          </div>

          {/* Instruções */}
          <div className="text-xs text-brand-clean/60 space-y-0.5 sm:space-y-1 px-1">
            <p className="hidden sm:block">• <strong>Arraste</strong> a imagem para reposicionar e escolher a área de corte</p>
            <p className="hidden sm:block">• Use os botões <strong>+/-</strong> para fazer zoom na imagem</p>
            <p className="hidden sm:block">• Clique em <strong>Rotacionar</strong> para girar a imagem</p>
            <p className="text-[10px] sm:text-xs">• A área destacada (8:3) será o banner final (1920x720px)</p>
          </div>
        </div>

        {/* Canvas oculto para processamento */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

