import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import JobHeader from '../components/JobHeader.jsx'
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx'
import ParametersGrid from '../components/ParametersGrid.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'
import ExportPanel from '../components/ExportPanel.jsx'
import { useJobPolling } from '../hooks/useJobPolling.js'
import { fetchResultBlob } from '../api/client.js'
import { deleteJob, fetchJob, originalUrl } from '../api/jobsApi.js'
import { useAuth } from '../auth/AuthContext.jsx'

const STAGE_BY_STATUS = {
  PENDING: { upload: 'done', queue: 'active', inference: 'waiting', progress: 0 },
  STARTED: { upload: 'done', queue: 'done', inference: 'active', progress: 0.6 },
  RETRY: { upload: 'done', queue: 'done', inference: 'active', progress: 0.3 },
  SUCCESS: { upload: 'done', queue: 'done', inference: 'done', progress: 1 },
  FAILURE: { upload: 'done', queue: 'done', inference: 'error', progress: 1 },
}

function readMeta(jobId) {
  try {
    return JSON.parse(sessionStorage.getItem(`job:${jobId}`) || '{}')
  } catch {
    return {}
  }
}

export default function JobPage() {
  const { jobId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { status: authStatus, plan, refresh } = useAuth()
  const { status, error } = useJobPolling(jobId)

  const sessionMeta = useMemo(() => readMeta(jobId), [jobId])
  const [record, setRecord] = useState(null)
  const [outputUrl, setOutputUrl] = useState(null)
  const [resultError, setResultError] = useState(null)
  const [jobError, setJobError] = useState(null)

  // Load the stored job (owner only) for details when opened from history.
  useEffect(() => {
    if (authStatus !== 'authenticated') return
    let cancelled = false
    fetchJob(jobId)
      .then((d) => !cancelled && setRecord(d.job))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [jobId, authStatus])

  useEffect(() => {
    if (status !== 'SUCCESS') return
    let url = null
    let cancelled = false
    fetchResultBlob(jobId)
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setOutputUrl(url)
      })
      .catch((e) => !cancelled && setResultError(e.message))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [status, jobId])

  // Failed jobs don't count against the quota; refresh the usage meter.
  useEffect(() => {
    if (status === 'FAILURE' && authStatus === 'authenticated') refresh()
    if (status === 'FAILURE') {
      fetch(`/status/${encodeURIComponent(jobId)}`)
        .then((r) => r.json())
        .then((d) => setJobError(d.error || null))
        .catch(() => {})
    }
  }, [status, authStatus, refresh, jobId])

  const meta = {
    filename: sessionMeta.filename ?? record?.originalName,
    scale: sessionMeta.scale ?? record?.scale,
    denoise: sessionMeta.denoise ?? record?.denoise,
    sharpen: sessionMeta.sharpen ?? record?.sharpen,
  }
  const inputUrl = location.state?.inputUrl ?? (record?.originalUrl || originalUrl(jobId))

  const stages = STAGE_BY_STATUS[status] ?? STAGE_BY_STATUS.PENDING
  const isProcessing = status === 'PENDING' || status === 'STARTED' || status === 'RETRY'

  const params = {
    model: 'SwinIR-M ×4',
    scale: meta.scale ? `${meta.scale}x` : '—',
    denoise: meta.denoise === undefined ? '—' : meta.denoise ? 'Enabled' : 'Disabled',
    sharpen: meta.sharpen === undefined ? '—' : meta.sharpen ? 'Enabled' : 'Disabled',
  }

  const baseName = meta.filename
    ? `${meta.filename.replace(/\.[^.]+$/, '')}_${meta.scale ?? 4}x`
    : `${jobId}_enhanced`

  const handleDelete = async () => {
    await deleteJob(jobId)
    sessionStorage.removeItem(`job:${jobId}`)
    refresh()
    navigate('/history', { replace: true })
  }

  return (
    <main className="max-w-container-max mx-auto px-md md:px-lg py-lg grid grid-cols-12 gap-lg">
      <div className="col-span-12">
        <Link
          to={record ? '/history' : '/'}
          className="inline-flex items-center gap-1 mb-sm font-body-sm text-body-sm text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {record ? 'Back to history' : 'Enhance another image'}
        </Link>
        <JobHeader jobId={jobId} filename={meta.filename || 'Enhancement job'} status={status} />
      </div>

      <div className="col-span-12 lg:col-span-8 space-y-md">
        {(error || resultError) && (
          <div className="p-md rounded-lg bg-error-container border border-error/40 text-error font-body-sm text-body-sm">
            {error || resultError}
          </div>
        )}
        {status === 'FAILURE' && (
          <div className="p-md rounded-lg bg-error-container border border-error/40 text-error font-body-sm text-body-sm">
            <b>Enhancement failed.</b> {jobError || 'The worker could not process this image.'} This
            job does not count toward your monthly limit.
          </div>
        )}

        <BeforeAfterSlider beforeSrc={inputUrl} afterSrc={outputUrl} isProcessing={isProcessing} status={status} />
        <ParametersGrid params={params} />
        {record?.processingTime != null && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Finished in {record.processingTime}s
            {record.source === 'api' ? ' · submitted via API' : ''}
          </p>
        )}
      </div>

      <aside className="col-span-12 lg:col-span-4 space-y-lg">
        <StatusTimeline stages={stages} />
        <ExportPanel
          ready={status === 'SUCCESS' && !!outputUrl}
          outputUrl={outputUrl}
          baseName={baseName}
          canWebp={!!plan?.webpExport}
          canDelete={!!record && !isProcessing}
          onDelete={handleDelete}
        />
      </aside>
    </main>
  )
}
