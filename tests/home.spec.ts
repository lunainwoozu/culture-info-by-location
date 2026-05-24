import { test, expect, type Page } from '@playwright/test'
import {
  AREA_XML_ONE_EVENT,
  AREA_XML_TWO_EVENTS,
  DETAIL_XML,
  DETAIL_XML_FREE,
  DETAIL_XML_EMPTY,
  TICKETS_XML_EMPTY,
  TICKETS_XML_WITH_DISCOUNT,
} from './fixtures'

async function grantGeo(page: Page) {
  await page.context().grantPermissions(['geolocation'])
  await page.context().setGeolocation({ latitude: 37.5665, longitude: 126.9780, accuracy: 10 })
}

function mockAreaOne(page: Page) {
  return page.route('**/cultureinfo/area2**', (r) =>
    r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_ONE_EVENT }),
  )
}

function mockAreaTwo(page: Page) {
  return page.route('**/cultureinfo/area2**', (r) =>
    r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: AREA_XML_TWO_EVENTS }),
  )
}

function mockTicketsEmpty(page: Page) {
  return page.route('**/ticketdiscounts/list**', (r) =>
    r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_EMPTY }),
  )
}

function mockTicketsDiscount(page: Page) {
  return page.route('**/ticketdiscounts/list**', (r) =>
    r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: TICKETS_XML_WITH_DISCOUNT }),
  )
}

test.describe('Home 페이지', () => {
  test('위치 권한 거부 시 LocationErrorPrompt 표시', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('위치를 확인할 수 없습니다')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('브라우저에서 위치 접근을 허용하거나')).toBeVisible()
  })

  test('위치 허용 시 이벤트 카드 렌더링', async ({ page }) => {
    await grantGeo(page)
    await mockAreaOne(page)
    await mockTicketsEmpty(page)
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML_EMPTY }),
    )

    await page.goto('/')
    await expect(page.getByRole('heading', { name: '테스트 공연' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('1건')).toBeVisible()
  })

  test('할인 필터 토글 — 할인 카드만 표시', async ({ page }) => {
    await grantGeo(page)
    await mockAreaTwo(page)
    await mockTicketsDiscount(page)
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML_EMPTY }),
    )

    await page.goto('/')
    await expect(page.getByRole('heading', { name: '일반 공연' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: '할인 공연' })).toBeVisible()
    await expect(page.getByText('2건')).toBeVisible()

    await page.locator('[role="switch"]').first().click()

    await expect(page.getByRole('heading', { name: '할인 공연' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '일반 공연' })).not.toBeVisible()
    await expect(page.getByText('1건')).toBeVisible()
  })

  test('이벤트 카드 클릭 시 상세 페이지로 이동', async ({ page }) => {
    await grantGeo(page)
    await mockAreaOne(page)
    await mockTicketsEmpty(page)
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML }),
    )

    await page.goto('/')
    await expect(page.getByRole('heading', { name: '테스트 공연' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('heading', { name: '테스트 공연' }).click()
    await expect(page).toHaveURL(/\/detail\/TEST001/)
  })

  test('무료 공연에 FreeBadge 표시', async ({ page }) => {
    await grantGeo(page)
    await mockAreaOne(page)
    await mockTicketsEmpty(page)
    // detail2가 "무료" price 반환
    await page.route('**/cultureinfo/detail2**', (r) =>
      r.fulfill({ contentType: 'text/xml; charset=UTF-8', body: DETAIL_XML_FREE }),
    )

    await page.goto('/')
    await expect(page.getByRole('heading', { name: '테스트 공연' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('무료')).toBeVisible({ timeout: 5000 })
  })
})
