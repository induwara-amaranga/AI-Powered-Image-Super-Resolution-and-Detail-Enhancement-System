import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearHistory, fetchJobs } from '../api/jobsApi.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { UsageMeter, formatBytes, formatDate } from '../components/AccountBits.jsx'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'queued', label: 'Queued' },
  { value: 'failed', label: 'Failed' },
]
const DATE_OPTIONS = [
  { value: '', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]
const PAGE_SIZE = 12

const STATUS_CHIP = {
  completed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'check_circle', label: 'Completed' },
  processing: { cls: 'bg-primary-fixed text-primary border-primary-fixed-dim', icon: 'sync', label: 'Processing' },
  queued: { cls: 'bg-surface-container text-on-surface-variant border-outline-variant', icon: 'schedule', label: 'Queued' },
  failed: { cls: 'bg-error-container text-error border-red-200', icon: 'error', label: 'Failed' },
}

function Thumb({ job }) {
  const [broken, setBroken] = useState(false)
  const src = job.status === 'completed' ? job.resultUrl : job.originalUrl
  if (!src || broken) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-outline">
        <span className="material-symbols-outlined text-4xl">image</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={job.originalName}
      loading="lazy"
      onError={() => setBroken(true)}
      className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
        job.status === 'completed' ? '' : 'opacity-60 grayscale'
      }`}
    />
  )
}

function JobCard({ job }) {
  const chip = STATUS_CHIP[job.status] ?? STATUS_CHIP.queued
  return (
    <Link
      to={`/job/${job.jobId}`}
      className="glass-panel rounded-xl overflow-hidden group block hover:-translate-y-0.5 transition-transform"
    >
      <div className="aspect-video relative bg-surface-container overflow-hidden">
        <Thumb job={job} />
        <span
          className={`absolute top-sm left-sm inline-flex items-center gap-1 rounded-full border px-sm py-0.5 text-[12px] font-semibold bg-white/95 ${chip.cls}`}
        >
          <span className={`material-symbols-outlined text-[14px] ${job.status === 'processing' ? 'animate-spin' : ''}`}>
            {chip.icon}
          </span>
          {chip.label}
        </span>
        {(job.status === 'queued' || job.status === 'processing') && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-fixed overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-primary to-secondary-container animate-pulse" />
          </div>
        )}
      </div>
      <div className="p-md">
        <div className="flex justify-between items-start gap-sm mb-sm">
          <h3 className="font-body-lg text-body-lg font-semibold text-on-surface truncate">{job.originalName}</h3>
          <span className="font-label-xs text-label-xs px-xs py-[3px] rounded bg-primary-fixed text-primary border border-primary-fixed-dim shrink-0">
            {job.scale}X
          </span>
        </div>
        {job.status === 'failed' ? (
          <p className="font-body-sm text-body-sm text-error line-clamp-2">{job.error || 'Processing failed.'}</p>
        ) : (
          <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {formatDate(job.createdAt, true)}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                {job.processingTime != null ? 'timer' : 'description'}
              </span>
              {job.processingTime != null ? `${job.processingTime}s` : formatBytes(job.fileSize)}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function HistoryPage() {
  const { usage, plan, refresh } = useAuth()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [days, setDays] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [clearing, setClearing] = useState(false)

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    try {
      setError(null)
      setData(await fetchJobs({ page, limit: PAGE_SIZE, status, q: query, days }))
    } catch (e) {
      setError(e.message)
    }
  }, [page, status, query, days])

  useEffect(() => {
    load()
  }, [load])

  // While jobs are running, refresh the list so statuses update.
  const hasActive = data?.jobs.some((j) => j.status === 'queued' || j.status === 'processing')
  useEffect(() => {
    if (!hasActive) return
    const ids = data.jobs.filter((j) => j.status === 'queued' || j.status === 'processing').map((j) => j.jobId)
    const t = setInterval(async () => {
      await Promise.all(ids.map((id) => fetch(`/status/${id}`).catch(() => null)))
      load()
    }, 4000)
    return () => clearInterval(t)
  }, [hasActive, data, load])

  const handleClear = async () => {
    if (!window.confirm('Delete all finished jobs and their images? Jobs still running are kept.')) return
    setClearing(true)
    try {
      await clearHistory()
      setPage(1)
      await load()
      refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setClearing(false)
    }
  }

  const selectClass =
    'bg-white border border-outline-variant text-on-surface rounded-lg px-md py-sm font-body-sm text-body-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none'

  const filtersActive = query || status || days

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-md md:px-lg py-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md">
        <div>
          <h1 className="font-display-lg text-[40px] md:text-display-lg text-on-surface mb-xs">Job history</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Every image you&apos;ve enhanced. Open a job to compare, download or delete it.
          </p>
        </div>
        <div className="flex flex-col gap-sm md:items-end">
          <div className="w-full md:w-72">
            <UsageMeter usage={usage} plan={plan} />
          </div>
          <button
            onClick={handleClear}
            disabled={clearing || !data?.total}
            className="flex items-center gap-xs px-md py-sm border border-outline-variant text-on-surface-variant rounded-xl font-semibold hover:border-error hover:text-error transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
            <span className="font-body-sm text-body-sm">{clearing ? 'Clearing…' : 'Clear history'}</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-md rounded-xl mb-lg flex flex-col md:flex-row gap-md items-center">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file name or job ID…"
            className="w-full pl-10 pr-md py-sm bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none font-body-sm text-body-sm text-on-surface"
          />
        </div>
        <div className="flex gap-sm w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className={selectClass}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={days}
            onChange={(e) => {
              setDays(e.target.value)
              setPage(1)
            }}
            className={selectClass}
            aria-label="Filter by date"
          >
            {DATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {data && (
          <span className="md:ml-auto font-body-sm text-body-sm text-on-surface-variant">
            {data.total} job{data.total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-md p-md rounded-lg bg-error-container border border-error/40 text-error font-body-sm text-body-sm">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      )}

      {data && data.jobs.length === 0 && (
        <div className="glass-panel rounded-xl p-xl text-center">
          <span className="material-symbols-outlined text-5xl text-primary mb-sm">
            {filtersActive ? 'filter_alt_off' : 'photo_library'}
          </span>
          <h2 className="font-headline-sm text-headline-sm mb-xs">
            {filtersActive ? 'No jobs match these filters' : 'No jobs yet'}
          </h2>
          <p className="text-on-surface-variant mb-md">
            {filtersActive ? 'Try a different search or date range.' : 'Enhance your first image and it will show up here.'}
          </p>
          {!filtersActive && (
            <Link to="/" className="inline-flex px-lg py-sm rounded-xl btn-gradient font-semibold">
              Enhance an image
            </Link>
          )}
        </div>
      )}

      {data && data.jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {data.jobs.map((job) => (
            <JobCard key={job.jobId} job={job} />
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="mt-xl flex justify-center items-center gap-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-xs rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary disabled:opacity-40"
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="font-body-sm text-body-sm text-on-surface-variant px-sm">
            Page {data.page} of {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page >= data.pages}
            className="p-xs rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary disabled:opacity-40"
            aria-label="Next page"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}
    </main>
  )
}
