import { useState } from 'react'
import { Link } from 'react-router-dom'

/** Re-encode the PNG result in the browser (no server round-trip). */
async function convertImage(srcUrl, mime, quality) {
  const img = new Image()
  img.src = srcUrl
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality))
  if (!blob) throw new Error('This browser cannot export that format.')
  return blob
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ExportPanel({ ready, outputUrl, baseName, canWebp, canDelete, onDelete }) {
  const [busy, setBusy] = useState(null)
  const [message, setMessage] = useState(null)

  const exportAs = async (format) => {
    setBusy(format)
    setMessage(null)
    try {
      if (format === 'png') {
        const blob = await fetch(outputUrl).then((r) => r.blob())
        saveBlob(blob, `${baseName}.png`)
      } else if (format === 'jpg') {
        saveBlob(await convertImage(outputUrl, 'image/jpeg', 0.92), `${baseName}.jpg`)
      } else {
        saveBlob(await convertImage(outputUrl, 'image/webp', 0.9), `${baseName}.webp`)
      }
    } catch (e) {
      setMessage({ tone: 'error', text: e.message || 'Export failed.' })
    } finally {
      setBusy(null)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setMessage({ tone: 'ok', text: 'Link copied to clipboard.' })
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this job and its images? This cannot be undone.')) return
    setBusy('delete')
    try {
      await onDelete()
    } catch (e) {
      setMessage({ tone: 'error', text: e.message || 'Could not delete the job.' })
      setBusy(null)
    }
  }

  const secondaryBtn =
    'py-sm px-md border border-primary/40 text-primary rounded-lg font-body-sm text-body-sm font-semibold hover:bg-primary-fixed/60 transition-colors flex items-center justify-center gap-xs disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <section className="glass-panel rounded-xl p-lg">
      <h3 className="font-headline-sm text-headline-sm mb-lg">Export</h3>
      <div className="space-y-md">
        <button
          type="button"
          onClick={() => exportAs('png')}
          disabled={!ready || !!busy}
          className={`w-full py-md px-lg btn-gradient rounded-xl font-body-md text-body-md font-bold flex items-center justify-center gap-md transition-transform ${
            ready && !busy ? 'hover:scale-[1.02] active:scale-95' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <span className={`material-symbols-outlined ${busy === 'png' ? 'animate-spin' : ''}`}>
            {busy === 'png' ? 'progress_activity' : 'download'}
          </span>
          Download PNG
        </button>

        <div className="grid grid-cols-2 gap-sm">
          <button type="button" disabled={!ready || !!busy} onClick={() => exportAs('jpg')} className={secondaryBtn}>
            {busy === 'jpg' ? 'Converting…' : 'JPG'}
          </button>
          {canWebp ? (
            <button type="button" disabled={!ready || !!busy} onClick={() => exportAs('webp')} className={secondaryBtn}>
              {busy === 'webp' ? 'Converting…' : 'WebP'}
            </button>
          ) : (
            <Link to="/pricing" className={secondaryBtn} title="WebP export is on the Pro plan">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              WebP (Pro)
            </Link>
          )}
        </div>

        {message && (
          <p className={`font-body-sm text-body-sm ${message.tone === 'error' ? 'text-error' : 'text-emerald-700'}`}>
            {message.text}
          </p>
        )}

        <div className="pt-md mt-md border-t border-outline-variant/50 space-y-xs">
          <button
            type="button"
            onClick={handleShare}
            className="w-full flex items-center justify-between p-sm hover:bg-surface-container transition-all rounded-lg group"
          >
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                share
              </span>
              <span className="font-body-md text-body-md">Copy link</span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy === 'delete'}
              className="w-full flex items-center justify-between p-sm hover:bg-error-container transition-all rounded-lg text-error disabled:opacity-50"
            >
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined">delete</span>
                <span className="font-body-md text-body-md">{busy === 'delete' ? 'Deleting…' : 'Delete job'}</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
