export async function startPayment(input: { email: string; kind: 'session'; hours: number } | { email: string; kind: 'support'; amount: number }): Promise<void> {
  const response = await fetch('/api/paystack-init', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const result = await response.json() as { url?: string; error?: string }
  if (!response.ok || !result.url) throw new Error(result.error ?? 'Checkout could not start.')
  window.location.assign(result.url)
}
