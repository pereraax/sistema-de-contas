type ActionButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function ActionButton({ label, onClick, disabled }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl px-5 py-4 text-sm sm:text-base font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  )
}

