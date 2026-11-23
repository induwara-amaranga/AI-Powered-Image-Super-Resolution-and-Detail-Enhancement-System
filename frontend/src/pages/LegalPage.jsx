const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        h: 'What we store',
        p: 'Your name, email address and a salted hash of your password (never the password itself). For each image you enhance we keep the file name, size, settings, status and timestamps so your history works.',
      },
      {
        h: 'Your images',
        p: 'Uploaded images and enhanced results are stored on the server so you can view and download them. Deleting a job, or clearing your history, removes its images. They are not used to train models and are never shared.',
      },
      {
        h: 'Payments',
        p: 'Billing in this app is a demo. Card numbers are checked in your browser and never sent to our servers. Only the card brand and last four digits are saved, for the invoice line.',
      },
      {
        h: 'Sessions and API keys',
        p: 'Signing in stores a session token in your browser. API keys are stored only as a one-way hash and can be revoked at any time from your account.',
      },
      {
        h: 'Your choices',
        p: 'You can update your name and password, delete individual jobs or your whole history, and revoke API keys from the Account and History pages.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        h: 'Using ImageSR',
        p: 'Only upload images you own or have permission to process. Don’t upload illegal content or use the service to infringe on anyone’s rights.',
      },
      {
        h: 'Plans and limits',
        p: 'Each plan includes a monthly number of images and a maximum upscale factor. Limits reset on the 1st of each month (UTC). Failed jobs don’t count.',
      },
      {
        h: 'Demo billing',
        p: 'Checkout is simulated. No money is collected, and invoices shown in your account are for demonstration only.',
      },
      {
        h: 'Results',
        p: 'AI super-resolution reconstructs plausible detail; it may not match the original scene exactly. Review results before using them where accuracy matters.',
      },
      {
        h: 'Availability',
        p: 'The service is provided as is, without guarantees of uptime or fitness for a particular purpose.',
      },
    ],
  },
}

export default function LegalPage({ kind }) {
  const page = CONTENT[kind]
  return (
    <main className="max-w-3xl mx-auto px-md md:px-lg py-xl">
      <h1 className="font-display-md text-display-md mb-xs">{page.title}</h1>
      <p className="text-on-surface-variant mb-lg">Plain-language summary for this demo application.</p>
      <div className="glass-panel rounded-2xl p-lg space-y-md">
        {page.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-semibold text-body-lg mb-1">{s.h}</h2>
            <p className="text-on-surface-variant">{s.p}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
