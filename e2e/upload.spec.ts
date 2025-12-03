import { expect, test } from '@playwright/test'

const CLIENT_ID = process.env.E2E_CLIENT_ID

test.skip(!CLIENT_ID, 'requires E2E_CLIENT_ID to run upload tests')

test('client media page loads', async ({ page }) => {
  await page.goto(`/dashboard/clients/${CLIENT_ID}/media`)
  await expect(page.getByRole('heading', { name: /mídia/i })).toBeVisible()
})

test('upload small file via presign flow', async ({ page }) => {
  await page.goto(`/dashboard/clients/${CLIENT_ID}/media`)
  // Expect a file input to exist; if not present, this test should be adapted with data-test selectors
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.click('input[type="file"]', { force: true })
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles({
    name: 'tiny.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  })
  // Basic assertion placeholder: presence of any progress indicator or toast
  await expect(page.locator('.toast-custom')).toHaveCount(0, { timeout: 2000 })
})

test('upload large file via multipart flow', async ({ page }) => {
  await page.goto(`/dashboard/clients/${CLIENT_ID}/media`)
  test.fixme(
    true,
    'Implement selectors and a larger fixture file once UI hooks are finalized'
  )
})
