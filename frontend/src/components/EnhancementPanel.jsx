import { Link } from 'react-router-dom'
import Toggle from './Toggle.jsx'
import PresetCard from './PresetCard.jsx'
import { UsageMeter } from './AccountBits.jsx'

const SCALES = [1, 2, 3, 4, 5]

export const PRESETS = {
  portrait: {
    icon: 'portrait',
    label: 'Portrait',
    hint: '4x · sharpen',
    settings: { scale: 4, denoise: false, sharpen: true },
  },
  landscape: {
    icon: 'landscape',
    label: 'Landscape',
    hint: '4x · denoise',
    settings: { scale: 4, denoise: true, sharpen: false },
  },
  oldPhoto: {
    icon: 'photo_album',
    label: 'Old photo',
    hint: '2x · denoise + sharpen',
    settings: { scale: 2, denoise: true, sharpen: true },
  },
  quick: {
    icon: 'bolt',
    label: 'Quick 2x',
    hint: '2x · no filters',
    settings: { scale: 2, denoise: false, sharpen: false },
  },
}

export default function EnhancementPanel({
  scale,
  maxScale = 5,
  onScaleChange,
  denoise,
  onDenoiseChange,
  sharpen,
  onSharpenChange,
  onPreset,
  onEnhance,
  onTrySample,
  uploading = false,
  hasFile = false,
  signedIn = false,
  usage,
  plan,
}) {
  const fillPercent = ((scale - 1) / 4) * 100
  const quotaReached = signedIn && usage && usage.remaining <= 0
  const enhanceDisabled = signedIn ? uploading || !hasFile || quotaReached : false

  const activePreset = Object.entries(PRESETS).find(
    ([, p]) => p.settings.scale === scale && p.settings.denoise === denoise && p.settings.sharpen === sharpen
  )?.[0]

  return (
    <>
      <div className="glass-panel inner-glow-border rounded-xl p-md flex flex-col gap-md">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            tune
          </span>
          <h3 className="font-headline-sm text-headline-sm">Enhancement</h3>
        </div>

        <div className="space-y-sm">
          <div className="flex justify-between items-center">
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">
              Upscale factor
            </label>
            <span className="font-code-md text-code-md text-primary font-semibold">{scale}x</span>
          </div>

          <div className="relative h-6 flex items-center">
            <div className="absolute w-full h-1.5 bg-surface-container-highest rounded-full" />
            {maxScale < 5 && (
              <div
                className="absolute right-0 h-1.5 rounded-full bg-[repeating-linear-gradient(45deg,#e2e6f5_0_4px,#cbd5e1_4px_8px)]"
                style={{ width: `${((5 - maxScale) / 4) * 100}%` }}
              />
            )}
            <div
              className="absolute h-1.5 bg-gradient-to-r from-primary-container to-secondary-container rounded-full"
              style={{ width: `${fillPercent}%` }}
            />
            <div
              className="absolute -translate-x-1/2 w-5 h-5 bg-white border-2 border-primary rounded-full shadow-lg pointer-events-none"
              style={{ left: `${fillPercent}%` }}
            />
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={scale}
              onChange={(e) => onScaleChange(Math.min(maxScale, Number(e.target.value)))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upscale factor"
            />
          </div>

          <div className="flex justify-between text-[11px] text-outline font-code-md">
            {SCALES.map((s) => (
              <span key={s} className={s > maxScale ? 'flex items-center gap-0.5 text-outline/60' : ''}>
                {s > maxScale && <span className="material-symbols-outlined text-[12px]">lock</span>}
                {s}x
              </span>
            ))}
          </div>
          {maxScale < 5 && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              5x is on{' '}
              <Link to="/pricing" className="font-semibold text-primary hover:underline">
                Pro
              </Link>
              . The model works at 4x; 5x adds a final resize.
            </p>
          )}
        </div>

        <div className="h-px bg-outline-variant/40 my-xs" />

        <div className="space-y-md">
          <Toggle
            title="Noise reduction"
            description="Clean up grain and JPEG artifacts"
            checked={denoise}
            onChange={onDenoiseChange}
          />
          <Toggle
            title="Detail sharpening"
            description="Crisper edges if the result looks soft"
            checked={sharpen}
            onChange={onSharpenChange}
          />
        </div>

        {signedIn && usage && (
          <div className="rounded-lg bg-surface-container p-sm">
            <UsageMeter usage={usage} plan={plan} compact />
          </div>
        )}

        <div className="mt-xs flex flex-col gap-sm">
          <button
            onClick={onEnhance}
            disabled={enhanceDisabled}
            className={`w-full py-md rounded-xl btn-gradient font-bold flex items-center justify-center gap-xs transition-all ${
              enhanceDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98]'
            }`}
          >
            <span className={`material-symbols-outlined ${uploading ? 'animate-spin' : ''}`}>
              {uploading ? 'progress_activity' : signedIn ? 'auto_fix_high' : 'login'}
            </span>
            {uploading
              ? 'Uploading…'
              : !signedIn
              ? 'Sign in to enhance'
              : quotaReached
              ? 'Monthly limit reached'
              : hasFile
              ? 'Enhance image'
              : 'Choose an image first'}
          </button>
          <button
            type="button"
            onClick={onTrySample}
            disabled={uploading}
            className="w-full py-sm rounded-xl border border-primary/40 text-primary font-medium hover:bg-primary-fixed/60 transition-colors font-body-md text-body-md disabled:opacity-50"
          >
            Try a sample image
          </button>
        </div>
      </div>

      <div>
        <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider mb-xs">
          Presets
        </p>
        <div className="grid grid-cols-2 gap-sm">
          {Object.entries(PRESETS).map(([key, p]) => (
            <PresetCard
              key={key}
              icon={p.icon}
              label={p.label}
              hint={p.hint}
              active={activePreset === key}
              onClick={() => onPreset(p.settings)}
            />
          ))}
        </div>
      </div>
    </>
  )
}
