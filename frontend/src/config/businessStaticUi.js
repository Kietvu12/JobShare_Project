import { MOCK_BUSINESS_USER } from '../mocks/business/fixtures'

export function isBusinessStaticUi() {
  return import.meta.env.VITE_BUSINESS_STATIC_UI === 'true'
}

/** Seed session demo — không cần login backend. */
export function bootstrapBusinessStaticUi() {
  if (!isBusinessStaticUi()) return

  if (localStorage.getItem('userType') !== 'business') {
    localStorage.setItem('token', 'static-ui-mock-token')
    localStorage.setItem('userType', 'business')
  }

  if (!localStorage.getItem('user')) {
    localStorage.setItem('user', JSON.stringify(MOCK_BUSINESS_USER))
  }
}
