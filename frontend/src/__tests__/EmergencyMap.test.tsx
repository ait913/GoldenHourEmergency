/**
 * EmergencyMapコンポーネントのテスト
 * Spec: map-aed/03.5_test_plan.md — FE-04, FE-05, FE-06, FE-07, FE-08
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// react-leafletをモック（jsdomはLeaflet非対応）
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('div', { 'data-testid': 'emergency-map', ...props }, children),
  TileLayer: () => null,
  Marker: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('div', { 'data-testid': 'map-marker', ...props }, children),
  Popup: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'map-popup' }, children),
  useMap: vi.fn(() => ({ setView: vi.fn() })),
}))

// leafletをモック
vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    icon: vi.fn(() => ({})),
  },
}))

describe('EmergencyMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /** Spec: map-aed/03.5_test_plan.md — FE-04 */
  it('EmergencyMapが正常にレンダリングされる', async () => {
    const { default: EmergencyMap } = await import('@/components/map/EmergencyMap')

    // When: EmergencyMap を userLat, userLng, 空のaeds/respondersでレンダリング
    render(
      <EmergencyMap
        userLat={35.6762}
        userLng={139.6503}
        aeds={[]}
        responders={[]}
      />
    )

    // Then: data-testid="emergency-map" が存在する
    expect(screen.getByTestId('emergency-map')).toBeInTheDocument()
  })

  /** Spec: map-aed/03.5_test_plan.md — FE-05 */
  it('AEDマーカーが表示される', async () => {
    const { default: EmergencyMap } = await import('@/components/map/EmergencyMap')

    // When: aeds=[{id:"node/1", lat:35.681, lng:139.767, name:"テストAED", distance:350}] でレンダリング
    render(
      <EmergencyMap
        userLat={35.6762}
        userLng={139.6503}
        aeds={[{ id: 'node/1', lat: 35.681, lng: 139.767, name: 'テストAED', distance: 350 }]}
        responders={[]}
      />
    )

    // Then: "AED" または "テストAED" のテキストが存在する
    const aedText = screen.queryByText('AED') || screen.queryByText('テストAED')
    expect(aedText).not.toBeNull()
  })

  /** Spec: map-aed/03.5_test_plan.md — FE-06 */
  it('ResponderMarkerが応答者を表示する', async () => {
    const { default: EmergencyMap } = await import('@/components/map/EmergencyMap')

    // When: responders=[{responderId:1, responderName:"田中医師", action:"ACCEPTED", distance:450}] でレンダリング
    render(
      <EmergencyMap
        userLat={35.6762}
        userLng={139.6503}
        aeds={[]}
        responders={[
          {
            responderId: 1,
            responderName: '田中医師',
            action: 'ACCEPTED',
            lat: 35.68,
            lng: 139.65,
            distance: 450,
          },
        ]}
      />
    )

    // Then: "田中医師" テキストが存在する
    expect(screen.getByText('田中医師')).toBeInTheDocument()
  })
})

describe('AedMarker', () => {
  /** Spec: map-aed/03.5_test_plan.md — FE-07 */
  it('ポップアップにGoogle Maps経路リンクが存在する', async () => {
    const { default: AedMarker } = await import('@/components/map/AedMarker')

    // When: AedMarker に {lat:35.681, lng:139.767, name:"コンビニ前AED", distance:120} を渡す
    render(
      <AedMarker
        id="node/1"
        lat={35.681}
        lng={139.767}
        name="コンビニ前AED"
        distance={120}
      />
    )

    // Then: maps.google.com を含むリンクが存在する
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toContain('maps.google.com')
    // And: target="_blank"
    expect(link.getAttribute('target')).toBe('_blank')
  })
})

describe('WaitingPage', () => {
  /** Spec: map-aed/03.5_test_plan.md — FE-08 */
  it('"119番に発信しました" テキストが存在する', async () => {
    // getTokenをモック
    vi.mock('@/lib/auth', () => ({
      getToken: vi.fn().mockReturnValue('mock-token'),
    }))
    // connectSSEをモック
    vi.mock('@/lib/sse', () => ({
      connectSSE: vi.fn().mockReturnValue(() => {}),
    }))
    // next/navigationをモック
    vi.mock('next/navigation', () => ({
      useRouter: vi.fn().mockReturnValue({ replace: vi.fn() }),
    }))

    const { default: WaitingPage } = await import('@/app/(reporter)/waiting/page')

    render(<WaitingPage />)

    // Then: "119番に発信しました" テキストが存在する
    expect(screen.getByText(/119番に発信しました/)).toBeInTheDocument()
  })
})
