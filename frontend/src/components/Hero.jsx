const HIGHLIGHTS = [
  { icon: 'zoom_in', label: 'Up to 5x upscaling' },
  { icon: 'blur_off', label: 'Noise & artifact removal' },
  { icon: 'deblur', label: 'Detail sharpening' },
]

export default function Hero() {
  return (
    <section className="max-w-container-max mx-auto px-lg pt-xl pb-lg text-center">
      <div className="inline-flex items-center gap-xs px-sm py-1.5 mb-md rounded-full bg-white border border-primary-fixed shadow-sm">
        <span className="flex h-2 w-2 rounded-full bg-gradient-to-r from-primary to-secondary-container" />
        <span className="font-body-sm text-body-sm font-semibold text-primary">
          Powered by SwinIR super-resolution
        </span>
      </div>

      <h1 className="font-display-lg text-[40px] md:text-display-lg mb-md max-w-4xl mx-auto text-on-surface">
        Turn blurry photos into{' '}
        <span className="text-gradient">crisp, high-res images</span>
      </h1>

      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-lg">
        Upload a low-resolution image and get a sharper, cleaner, larger version
        in seconds. Drag the slider to see every recovered detail.
      </p>

      <div className="flex flex-wrap justify-center gap-sm">
        {HIGHLIGHTS.map((h) => (
          <div
            key={h.label}
            className="flex items-center gap-xs px-md py-xs rounded-full bg-white/80 border border-outline-variant/60 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              {h.icon}
            </span>
            <span className="font-body-sm text-body-sm font-medium text-on-surface">
              {h.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
