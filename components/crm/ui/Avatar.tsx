'use client'

export function Avatar({
  src,
  name,
  className = '',
  size = 'md',
}: {
  src?: string | null
  name?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm'
  const initial = name ? name.trim().slice(0, 1).toUpperCase() : '?'
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold bg-[#25D366]/20 text-[#25D366] flex-shrink-0 overflow-hidden ${className}`}
    >
      {src ? (
        <img src={src} alt={name || ''} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}
