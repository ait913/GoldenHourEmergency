import '@testing-library/jest-dom'

// window.location のモック設定
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
})

// navigator.sendBeacon のデフォルトモック
Object.defineProperty(navigator, 'sendBeacon', {
  writable: true,
  value: vi.fn().mockReturnValue(true),
})
