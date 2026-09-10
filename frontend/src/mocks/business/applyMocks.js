import { isBusinessStaticUi } from '../../config/businessStaticUi'
import { businessMockApi } from './mockApi'

/** Ghi đè các API doanh nghiệp bằng mock khi bật VITE_BUSINESS_STATIC_UI. */
export function applyBusinessStaticUiMocks(apiService) {
  if (!isBusinessStaticUi()) return apiService

  Object.entries(businessMockApi).forEach(([methodName, mockFn]) => {
    if (typeof apiService[methodName] === 'function') {
      apiService[methodName] = mockFn
    }
  })

  return apiService
}
