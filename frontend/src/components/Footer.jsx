import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  { label: 'Pricing', to: '/pricing' },
  { label: 'Docs', to: '/docs' },
  { label: 'API', to: '/docs#rest-api' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
]

export default function Footer() {
  return (
    <footer className="bg-white/70 backdrop-blur w-full py-xl px-lg border-t border-outline-variant/50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg items-center max-w-container-max mx-auto">
        <div>
          <div className="font-display-md text-body-lg font-black text-on-surface mb-xs">ImageSR AI</div>
          <p className="text-on-surface-variant font-body-sm text-body-sm">
            © {new Date().getFullYear()} ImageSR AI. AI image super-resolution.
          </p>
        </div>
        <div className="flex flex-wrap md:justify-end gap-md">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-on-surface-variant font-body-sm text-body-sm hover:text-primary transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
