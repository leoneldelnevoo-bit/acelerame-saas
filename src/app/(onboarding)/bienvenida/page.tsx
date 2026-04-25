import { redirect } from 'next/navigation'
import { getClienteContext } from '@/lib/cliente-db'
import { OnboardingWizard } from '@/components/onboarding/wizard'

export const revalidate = 0
export const metadata = { title: 'Bienvenida · ACELERAME' }

export default async function BienvenidaPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')
  if (cliente.onboarding_completado) redirect('/dashboard')

  return <OnboardingWizard cliente={cliente} />
}
