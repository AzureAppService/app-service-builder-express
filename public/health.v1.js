const button = document.querySelector('[data-health-app]')
const result = document.querySelector('[role="status"]')

button?.addEventListener('click', async () => {
  button.disabled = true
  result.textContent = 'Checking /health…'
  try {
    const response = await fetch('/health', { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error('HTTP health failure')
    const body = await response.json()
    if (body.status !== 'ok' || body.app !== button.dataset.healthApp) throw new Error('Unexpected health response')
    result.textContent = 'The app responded successfully to /health. This checks this app only, not Azure deployment status.'
  } catch {
    result.textContent = 'App health check failed. Retry, or inspect /health and your app logs.'
  } finally {
    button.disabled = false
  }
})
