import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="max-w-xl mx-auto px-md py-xl text-center">
      <p className="text-[72px] font-black text-gradient leading-none mb-sm">404</p>
      <h1 className="font-headline-sm text-headline-sm mb-xs">Page not found</h1>
      <p className="text-on-surface-variant mb-md">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link to="/" className="inline-flex px-lg py-sm rounded-xl btn-gradient font-semibold">
        Go home
      </Link>
    </main>
  )
}
