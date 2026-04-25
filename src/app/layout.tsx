import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACELERAME — Motor de prospección B2B con IA',
  description: 'Sistema multi-canal de prospección B2B automatizada. Instagram, Email y WhatsApp corriendo 24/7 con IA que personaliza cada mensaje.',
  authors: [{ name: 'Leonel Delnevo' }],
  keywords: ['prospección B2B', 'automatización ventas', 'IA', 'Instagram DM', 'cold email'],
  robots: 'index, follow',
  openGraph: {
    title: 'ACELERAME',
    description: 'Motor de prospección B2B con IA',
    url: 'https://app.acelerame.online',
    siteName: 'ACELERAME',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'ACELERAME',
    description: 'Motor de prospección B2B con IA',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-bg-base text-fg antialiased">{children}</body>
    </html>
  )
}
