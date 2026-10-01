import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sessionPackages } from '../shared/session-pricing.mjs'

// Fake credentials only. Every outgoing request is intercepted.
process.env.PAYSTACK_SECRET_KEY = 'sk_test_unit_tests_only'
process.env.SITE_URL = 'https://olaoluwa.work'
process.env.RESEND_API_KEY = 'fake_resend_key'
process.env.RESEND_FROM = 'Sessions <sessions@example.test>'
process.env.TURNSTILE_SECRET_KEY = 'fake_turnstile_key'
const { POST: initialize } = await import('../api/paystack-init.ts')
const { POST: requestSession } = await import('../api/session-request.ts')
const { GET: verify } = await import('../api/paystack-verify.ts')
const response = (body) => Response.json(body)
const request = (input) => new Request('https://olaoluwa.work/api/test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })
const applicant = { name: 'Test Applicant', email: 'applicant@example.test', details: 'Please review my project and help me improve it.', focus: 'Portfolio or project review', challengeToken: 'fake_token' }
const originalFetch = globalThis.fetch

async function ownerMessage(input) {
  let message
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('siteverify')) return response({ success: true, hostname: 'olaoluwa.work', action: 'session_request' })
    assert.equal(url, 'https://api.resend.com/emails')
    message = JSON.parse(options.body).text
    return response({ id: 'fake_email_id' })
  }
  assert.equal((await requestSession(request({ ...applicant, ...input }))).status, 200)
  return message
}
async function checkout(input) {
  let payload
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.paystack.co/transaction/initialize')
    payload = JSON.parse(options.body)
    return response({ status: true, data: { authorization_url: 'https://checkout.paystack.com/fake' } })
  }
  const result = await initialize(request({ kind: 'session', email: applicant.email, ...input }))
  return { result, payload }
}
async function verifyPayment(payload, amount = payload.amount) {
  globalThis.fetch = async () => response({ status: true, data: { status: 'success', currency: 'NGN', amount, metadata: payload.metadata } })
  return (await verify(new Request('https://olaoluwa.work/api/paystack-verify?reference=test-reference'))).json()
}

test('session requests, checkout amounts, and discount permissions', async (t) => {
  try {
    for (const option of sessionPackages) {
      await t.test(`${option.duration}: regular and first-five prices agree across email, checkout, and verification`, async () => {
        const message = await ownerMessage({ packageId: option.id })
        assert.ok(message.includes(option.duration))
        const links = [...message.matchAll(/https:\/\/olaoluwa\.work\/sessions\/pay\?\S+/g)].map(([url]) => new URL(url))
        assert.equal(links.length, 2)
        assert.equal(links[0].searchParams.get('package'), option.id)
        const { payload } = await checkout({ packageId: option.id })
        assert.equal(payload.amount, option.price * 100)
        assert.equal((await verifyPayment(payload)).paid, true)
        assert.equal((await verifyPayment(payload, payload.amount - 100)).paid, false)
        const offer = links[1].searchParams.get('offer')
        const half = await checkout({ packageId: option.id, offer })
        assert.equal(half.payload.amount, option.price * 50)
        const verified = await verifyPayment(half.payload)
        assert.equal(verified.paid, true)
        assert.equal(verified.duration, option.duration)
        assert.equal((await checkout({ packageId: option.id, offer, email: 'other@example.test' })).result.status, 400)
        const other = sessionPackages.find((item) => item.id !== option.id)
        assert.equal((await checkout({ packageId: other.id, offer })).result.status, 400)
        assert.equal((await checkout({ packageId: option.id, offer: `1000000000.${'0'.repeat(64)}` })).result.status, 400)
      })
    }
    await t.test('old links retain the original hourly price and discount', async () => {
      const message = await ownerMessage({ hours: 2 })
      const discounted = new URL(message.match(/https:\/\/olaoluwa\.work\/sessions\/pay\?[^\s]+offer=[^\s]+/)[0])
      const { payload } = await checkout({ hours: 2 })
      assert.equal(payload.amount, 2_000_000)
      assert.equal((await verifyPayment(payload)).paid, true)
      const half = await checkout({ hours: 2, offer: discounted.searchParams.get('offer') })
      assert.equal(half.payload.amount, 1_000_000)
      assert.equal((await verifyPayment(half.payload)).paid, true)
    })
    await t.test('custom requests ask for an agreed quote and cannot use fixed checkout', async () => {
      const message = await ownerMessage({ packageId: 'custom', customHours: 4 })
      assert.ok(message.includes('4 hours, custom quote'))
      assert.ok(message.includes('50% off your agreed quote'))
      assert.ok(!message.includes('/sessions/pay?'))
      assert.equal((await checkout({ packageId: 'custom', hours: 1 })).result.status, 400)
      assert.equal((await requestSession(request({ ...applicant, packageId: 'custom', customHours: 2 }))).status, 400)
    })
    await t.test('invalid packages and malformed inputs are rejected', async () => {
      assert.equal((await checkout({ packageId: 'fake', hours: 1 })).result.status, 400)
      assert.equal((await initialize(request(null))).status, 400)
      assert.equal((await requestSession(request(null))).status, 400)
      assert.equal((await verifyPayment({ metadata: JSON.stringify({ kind: 'session', package: 'fake', pricing_version: 2 }) }, null)).paid, false)
    })
    await t.test('arbitrary support amounts still initialize and verify', async () => {
      const { payload } = await checkout({ kind: 'support', amount: 2350 })
      assert.equal(payload.amount, 235_000)
      assert.equal((await verifyPayment(payload)).kind, 'support')
    })
  } finally { globalThis.fetch = originalFetch }
})
