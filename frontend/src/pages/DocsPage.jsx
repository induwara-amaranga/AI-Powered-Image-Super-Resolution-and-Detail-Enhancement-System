import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const SECTIONS = [
  { id: 'introduction', icon: 'info', label: 'Introduction' },
  { id: 'how-it-works', icon: 'psychology', label: 'How it works' },
  { id: 'web-app', icon: 'web', label: 'Using the web app' },
  { id: 'rest-api', icon: 'api', label: 'REST API' },
  { id: 'limits', icon: 'speed', label: 'Plans & limits' },
  { id: 'faq', icon: 'quiz', label: 'FAQ' },
]

const PIPELINE = [
  { icon: 'upload', title: 'Upload', text: 'JPG, PNG, WebP or BMP up to 20 MB. The file is validated and queued.' },
  { icon: 'blur_off', title: 'Denoise (optional)', text: 'OpenCV non-local means removes grain and compression artifacts first.' },
  { icon: 'auto_awesome', title: 'SwinIR ×4', text: 'A Swin Transformer trained on real-world degradations rebuilds detail at 4x. Large images are processed in overlapping 256 px tiles.' },
  { icon: 'deblur', title: 'Sharpen (optional)', text: 'A light unsharp mask for results that look soft.' },
  { icon: 'aspect_ratio', title: 'Resize to your scale', text: '1–3x are downsampled from the 4x result; 5x is a final LANCZOS upscale.' },
]

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/enhance',
    auth: 'API key',
    desc: 'Submit an image. Multipart body with a file field; options in the query string.',
    params: [
      ['file', 'multipart file', 'JPG, PNG, WebP or BMP, max 20 MB'],
      ['scale', 'query, 1–5', 'Output scale. Default 4. 5x needs Pro or Business.'],
      ['denoise', 'query, true|false', 'Run noise reduction first. Default false.'],
      ['sharpen', 'query, true|false', 'Sharpen the result. Default false.'],
    ],
    response: `HTTP/1.1 202 Accepted
{
  "job_id": "3b6e2c1a-…",
  "status_url": "/status/3b6e2c1a-…",
  "result_url": "/result/3b6e2c1a-…",
  "usage": { "used": 12, "limit": 300, "remaining": 288 }
}`,
  },
  {
    method: 'GET',
    path: '/status/{job_id}',
    auth: 'none',
    desc: 'Poll until status is SUCCESS or FAILURE. Start at 1 s and back off to about 5 s.',
    response: `{ "job_id": "3b6e2c1a-…", "status": "PENDING" }   // queued
{ "job_id": "3b6e2c1a-…", "status": "STARTED" }   // running on the GPU
{ "job_id": "3b6e2c1a-…", "status": "SUCCESS", "job_result_url": "/result/3b6e2c1a-…" }
{ "job_id": "3b6e2c1a-…", "status": "FAILURE", "error": "…" }`,
  },
  {
    method: 'GET',
    path: '/result/{job_id}',
    auth: 'none',
    desc: 'Download the enhanced image as PNG once the job has succeeded.',
    response: `HTTP/1.1 200 OK
Content-Type: image/png
Content-Disposition: attachment; filename="…_enhanced_4x.png"`,
  },
]

const ERRORS = [
  ['400', 'Bad file type, missing file or invalid scale'],
  ['401', 'Missing or invalid API key'],
  ['402', 'quota_exceeded: monthly image limit reached'],
  ['403', 'plan_scale (scale above your plan) or plan_api_access (API needs Pro)'],
  ['413', 'File larger than 20 MB'],
  ['429', 'More than 60 requests per minute'],
]

const FAQ_ITEMS = [
  {
    q: 'What image formats are supported?',
    a: 'JPG/JPEG, PNG, WebP and BMP, up to 20 MB. Transparency is flattened. Results are PNG; you can export JPG (and WebP on Pro) from the job page.',
  },
  {
    q: 'How long does a job take?',
    a: 'Usually a few seconds for small photos. Large images take longer because they are processed tile by tile on the GPU, and jobs run one at a time, so you may wait in the queue at busy moments.',
  },
  {
    q: 'Is there a rate limit?',
    a: 'Yes: 60 enhancement requests per minute per account, on top of your plan’s monthly image limit.',
  },
  {
    q: 'Will it invent details?',
    a: 'Super-resolution reconstructs plausible texture from patterns learned in training. It is excellent for photos, but it is not forensic: fine text or faces can differ slightly from the real scene.',
  },
]

function Code({ children }) {
  return (
    <pre className="rounded-xl bg-slate-900 text-slate-100 p-md overflow-x-auto font-code-md text-[13px] leading-relaxed">
      {children}
    </pre>
  )
}

export default function DocsPage() {
  const location = useLocation()
  const [active, setActive] = useState('introduction')

  // Scroll to #hash on navigation (react-router doesn't do this by itself).
  useEffect(() => {
    const id = location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  // Highlight the section in view.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  return (
    <main className="max-w-container-max mx-auto px-md md:px-lg py-xl flex flex-col md:flex-row gap-lg">
      <aside className="w-full md:w-60 flex-shrink-0">
        <nav className="md:sticky md:top-[100px] flex flex-col gap-1">
          <p className="font-label-xs text-label-xs text-outline tracking-widest uppercase pb-xs mb-xs border-b border-outline-variant/50">
            Documentation
          </p>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`flex items-center gap-xs px-sm py-xs rounded-lg transition-all ${
                active === s.id ? 'bg-primary-fixed text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1 max-w-4xl space-y-xl">
        <section id="introduction" className="scroll-mt-24">
          <h1 className="font-display-lg text-[40px] md:text-display-lg mb-md text-on-surface">ImageSR documentation</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            ImageSR upscales and restores photos with <b>SwinIR</b>, a Swin Transformer
            super-resolution model trained on real-world degradations (blur, noise and JPEG
            compression). It rebuilds texture and edges that ordinary resizing smears, at up to 4x the
            original resolution, with an optional resize to 5x.
          </p>
        </section>

        <section id="how-it-works" className="scroll-mt-24">
          <h2 className="font-display-md text-display-md mb-md">How it works</h2>
          <ol className="space-y-sm">
            {PIPELINE.map((step, i) => (
              <li key={step.title} className="glass-panel rounded-xl p-md flex gap-md items-start">
                <span className="w-10 h-10 rounded-lg btn-gradient flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white">{step.icon}</span>
                </span>
                <div>
                  <h3 className="font-semibold">
                    {i + 1}. {step.title}
                  </h3>
                  <p className="text-on-surface-variant font-body-sm text-body-sm">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-md font-body-sm text-body-sm text-on-surface-variant">
            Jobs are queued and processed asynchronously on a GPU worker, so the page stays responsive
            while you wait. You can leave and find the result later in History.
          </p>
        </section>

        <section id="web-app" className="scroll-mt-24">
          <h2 className="font-display-md text-display-md mb-md">Using the web app</h2>
          <ul className="space-y-sm text-on-surface-variant list-disc pl-lg">
            <li>
              <Link to="/signup" className="text-primary font-semibold hover:underline">Create a free account</Link>, then drop an image on the{' '}
              <Link to="/" className="text-primary font-semibold hover:underline">Enhance</Link> page or press <i>Try a sample image</i>.
            </li>
            <li>Pick a preset or set scale, noise reduction and sharpening yourself, then press <i>Enhance image</i>.</li>
            <li>On the job page, drag the slider to compare before and after, then download PNG or JPG (WebP on Pro).</li>
            <li>
              Every job is saved in <Link to="/history" className="text-primary font-semibold hover:underline">History</Link>; finished images also appear in the{' '}
              <Link to="/gallery" className="text-primary font-semibold hover:underline">Gallery</Link>. Deleting a job removes its images from the server.
            </li>
          </ul>
        </section>

        <section id="rest-api" className="scroll-mt-24">
          <h2 className="font-display-md text-display-md mb-sm">REST API</h2>
          <p className="text-on-surface-variant mb-md">
            Available on Pro and Business. Create a key under{' '}
            <Link to="/account?tab=api" className="text-primary font-semibold hover:underline">Account → API key</Link> and send it in
            the <code className="font-code-md">X-API-Key</code> header. API jobs share your monthly limit and appear in your history.
          </p>

          <div className="space-y-lg">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className="glass-panel rounded-xl overflow-hidden">
                <div className="flex flex-wrap items-center gap-sm px-md py-sm border-b border-outline-variant/50">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[12px] font-bold ${
                      ep.method === 'POST' ? 'bg-primary text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="font-code-md font-semibold">{ep.path}</code>
                  <span className="ml-auto text-[12px] text-on-surface-variant">Auth: {ep.auth}</span>
                </div>
                <div className="p-md space-y-sm">
                  <p className="text-on-surface-variant font-body-sm text-body-sm">{ep.desc}</p>
                  {ep.params && (
                    <table className="w-full text-left font-body-sm text-body-sm">
                      <tbody>
                        {ep.params.map(([name, type, d]) => (
                          <tr key={name} className="border-b border-outline-variant/30 last:border-0">
                            <td className="py-xs pr-md font-code-md text-[13px] font-semibold whitespace-nowrap">{name}</td>
                            <td className="py-xs pr-md text-on-surface-variant whitespace-nowrap">{type}</td>
                            <td className="py-xs">{d}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <Code>{ep.response}</Code>
                </div>
              </div>
            ))}
          </div>

          <h3 className="font-headline-sm text-headline-sm mt-lg mb-sm">Example</h3>
          <Code>{`curl -X POST "https://YOUR_HOST/enhance?scale=4&denoise=true" \\
  -H "X-API-Key: isr_…" \\
  -F "file=@photo.jpg"

curl "https://YOUR_HOST/status/JOB_ID"
curl -o enhanced.png "https://YOUR_HOST/result/JOB_ID"`}</Code>

          <h3 className="font-headline-sm text-headline-sm mt-lg mb-sm">Errors</h3>
          <div className="glass-panel rounded-xl p-md">
            <table className="w-full text-left font-body-sm text-body-sm">
              <tbody>
                {ERRORS.map(([code, text]) => (
                  <tr key={code} className="border-b border-outline-variant/30 last:border-0">
                    <td className="py-xs pr-md font-code-md font-semibold">{code}</td>
                    <td className="py-xs">{text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">
              Error bodies are JSON: <code className="font-code-md">{'{ "message": "…", "code": "…" }'}</code>
            </p>
          </div>
        </section>

        <section id="limits" className="scroll-mt-24">
          <h2 className="font-display-md text-display-md mb-md">Plans &amp; limits</h2>
          <div className="glass-panel rounded-xl p-md overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="text-on-surface-variant">
                <tr>
                  <th className="py-xs pr-md">Plan</th>
                  <th className="py-xs pr-md">Images / month</th>
                  <th className="py-xs pr-md">Max scale</th>
                  <th className="py-xs pr-md">API</th>
                  <th className="py-xs">WebP export</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Free', '15', '4x', '—', '—'],
                  ['Pro', '300', '5x', '✓', '✓'],
                  ['Business', '2,000', '5x', '✓', '✓'],
                ].map((r) => (
                  <tr key={r[0]} className="border-t border-outline-variant/30">
                    {r.map((c, i) => (
                      <td key={i} className={`py-xs pr-md ${i === 0 ? 'font-semibold' : ''}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">
            All plans: 20 MB per file, 60 requests per minute. See{' '}
            <Link to="/pricing" className="text-primary font-semibold hover:underline">Pricing</Link>.
          </p>
        </section>

        <section id="faq" className="scroll-mt-24">
          <h2 className="font-display-md text-display-md mb-md">FAQ</h2>
          <div className="space-y-sm">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="glass-panel rounded-xl p-md group">
                <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                  {item.q}
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <p className="mt-sm text-on-surface-variant font-body-sm text-body-sm">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
