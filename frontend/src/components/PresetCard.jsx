export default function PresetCard({ icon, label, hint, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl p-sm border transition-all cursor-pointer group text-left bg-white hover:-translate-y-0.5 ${
        active
          ? 'border-primary ring-2 ring-primary/20 shadow-sm'
          : 'border-outline-variant/60 hover:border-primary/50'
      }`}
    >
      <span
        className={`material-symbols-outlined mb-xs block ${active ? 'text-primary' : 'text-outline group-hover:text-primary'}`}
      >
        {icon}
      </span>
      <p className="font-body-sm text-body-sm font-semibold text-on-surface">{label}</p>
      {hint && <p className="text-[12px] text-on-surface-variant">{hint}</p>}
    </button>
  )
}
