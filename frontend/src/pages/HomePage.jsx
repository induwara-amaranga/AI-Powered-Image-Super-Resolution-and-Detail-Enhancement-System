import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Hero from '../components/Hero.jsx'
import EnhancementPanel from '../components/EnhancementPanel.jsx'
import DropZone from '../components/DropZone.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { enhanceImage } from '../api/client.js'

const SAMPLE_URL = '/samples/landscape.jpg'

export default function HomePage() {
  const navigate = useNavigate()
  const { status, plan, usage, applySession } = useAuth()
  const signedIn = status === 'authenticated'
  const maxScale = plan?.maxScale ?? 4

  const [scale, setScale] = useState(4)
  const [denoise, setDenoise] = useState(false)
  const [sharpen, setSharpen] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  // Keep the selected scale within the plan limit (e.g. after a downgrade).
  useEffect(() => {
    if (scale > maxScale) setScale(maxScale)
  }, [maxScale, scale])

  const applyPreset = (s) => {
    setScale(Math.min(maxScale, s.scale))
    setDenoise(s.denoise)
    setSharpen(s.sharpen)
  }

  const loadSample = async () => {
    setError(null)
    try {
      const res = await fetch(SAMPLE_URL)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      setFile(new File([blob], 'sample-landscape.jpg', { type: 'image/jpeg' }))
    } catch {
      setError('Could not load the sample image.')
    }
  }

  const handleEnhance = async () => {
    if (!signedIn) {
      navigate('/signin?next=/')
      return
    }
    if (!file || uploading) return

    setUploading(true)
    setError(null)

    try {
      const data = await enhanceImage(file, { scale, denoise, sharpen })
      const jobId = data.job?.jobId || data.job_id
      if (!jobId) throw new Error('Job ID was not returned from the server.')
      if (data.usage) applySession({ usage: data.usage })

      sessionStorage.setItem(
        `job:${jobId}`,
        JSON.stringify({ filename: file.name, scale, denoise, sharpen })
      )

      navigate(`/job/${jobId}`, {
        state: { inputUrl: URL.createObjectURL(file), filename: file.name, scale, denoise, sharpen },
      })
    } catch (e) {
      setError(
        e.code === 'quota_exceeded' || e.code === 'plan_scale' ? (
          <>
            {e.message}{' '}
            <Link to="/pricing" className="underline font-semibold">
              See plans
            </Link>
          </>
        ) : (
          e.message || 'Image enhancement failed.'
        )
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-fuchsia-400/15 blur-[100px] rounded-full pointer-events-none" />

      <Hero />

      <section className="max-w-container-max mx-auto px-md md:px-lg pb-xl relative">
        {!signedIn && status !== 'loading' && (
          <div className="mb-md flex flex-col sm:flex-row sm:items-center justify-between gap-sm rounded-xl border border-primary-fixed bg-white/80 px-md py-sm">
            <p className="font-body-sm text-body-sm text-on-surface">
              <b>Create a free account</b> to enhance images. You get 15 a month, plus your history
              and downloads in one place.
            </p>
            <div className="flex gap-sm shrink-0">
              <Link to="/signin?next=/" className="px-md py-xs rounded-lg font-semibold text-primary hover:bg-primary-fixed/60">
                Sign in
              </Link>
              <Link to="/signup?next=/" className="px-md py-xs rounded-lg btn-gradient font-semibold">
                Sign up free
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
          <div className="lg:col-span-4 flex flex-col gap-md">
            <EnhancementPanel
              scale={scale}
              maxScale={signedIn ? maxScale : 5}
              onScaleChange={setScale}
              denoise={denoise}
              onDenoiseChange={setDenoise}
              sharpen={sharpen}
              onSharpenChange={setSharpen}
              onPreset={applyPreset}
              onEnhance={handleEnhance}
              onTrySample={loadSample}
              uploading={uploading}
              hasFile={!!file}
              signedIn={signedIn}
              usage={usage}
              plan={plan}
            />
          </div>

          <div className="lg:col-span-8 h-full min-h-[500px]">
            <DropZone file={file} onFileSelect={setFile} onClear={() => setFile(null)} error={error} />
          </div>
        </div>
      </section>
    </main>
  )
}
