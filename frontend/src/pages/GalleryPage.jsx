import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchJobs } from '../api/jobsApi.js'
import { formatDate } from '../components/AccountBits.jsx'

const PAGE_SIZE = 24

export default function GalleryPage() {
  const [jobs, setJobs] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchJobs({ page, limit: PAGE_SIZE, status: 'completed' })
      .then((d) => {
        if (cancelled) return
        setJobs((prev) => (page === 1 ? d.jobs : [...prev, ...d.jobs]))
        setPages(d.pages)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [page])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => e.key === 'Escape' && setLightbox(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  return (
    <main className="max-w-container-max mx-auto px-md md:px-lg py-xl">
      <div className="mb-lg">
        <h1 className="font-display-lg text-[40px] md:text-display-lg text-on-surface mb-xs">Gallery</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          All of your finished, enhanced images.
        </p>
      </div>

      {error && (
        <div className="mb-md p-md rounded-lg bg-error-container border border-error/40 text-error font-body-sm text-body-sm">
          {error}
        </div>
      )}

      {!loading && jobs.length === 0 && !error && (
        <div className="glass-panel rounded-xl p-xl text-center">
          <span className="material-symbols-outlined text-5xl text-primary mb-sm">collections</span>
          <h2 className="font-headline-sm text-headline-sm mb-xs">Your gallery is empty</h2>
          <p className="text-on-surface-variant mb-md">Finished enhancements appear here automatically.</p>
          <Link to="/" className="inline-flex px-lg py-sm rounded-xl btn-gradient font-semibold">
            Enhance an image
          </Link>
        </div>
      )}

      <div className="columns-2 md:columns-3 xl:columns-4 gap-md [column-fill:_balance]">
        {jobs.map((job) => (
          <button
            key={job.jobId}
            type="button"
            onClick={() => setLightbox(job)}
            className="mb-md block w-full break-inside-avoid rounded-xl overflow-hidden glass-panel group text-left"
          >
            <img src={job.resultUrl} alt={job.originalName} loading="lazy" className="w-full h-auto group-hover:opacity-90" />
            <div className="px-sm py-xs flex justify-between items-center gap-xs">
              <span className="truncate font-body-sm text-body-sm font-medium">{job.originalName}</span>
              <span className="shrink-0 text-[11px] font-bold text-primary">{job.scale}X</span>
            </div>
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-on-surface-variant py-lg">Loading…</p>}

      {!loading && page < pages && (
        <div className="flex justify-center mt-lg">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-lg py-sm rounded-xl border border-primary/40 text-primary font-semibold hover:bg-primary-fixed/60"
          >
            Load more
          </button>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-md"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.originalName}
        >
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.resultUrl} alt={lightbox.originalName} className="max-h-[75vh] w-full object-contain rounded-xl bg-white" />
            <div className="mt-sm flex flex-wrap items-center justify-between gap-sm text-white">
              <div>
                <p className="font-semibold">{lightbox.originalName}</p>
                <p className="text-body-sm text-white/70">
                  {lightbox.scale}x · {formatDate(lightbox.finishedAt || lightbox.createdAt, true)}
                </p>
              </div>
              <div className="flex gap-sm">
                <Link to={`/job/${lightbox.jobId}`} className="px-md py-xs rounded-lg bg-white/15 hover:bg-white/25 font-semibold">
                  Compare
                </Link>
                <a href={lightbox.resultUrl} download className="px-md py-xs rounded-lg btn-gradient font-semibold">
                  Download
                </a>
                <button onClick={() => setLightbox(null)} className="px-md py-xs rounded-lg bg-white/15 hover:bg-white/25" aria-label="Close">
                  <span className="material-symbols-outlined align-middle">close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
