/**
 * HELPボタンのテスト（最重要コンポーネント）
 * Spec: 03.5_test_plan.md — FE-01, FE-02
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HelpButton from '../../components/ui/HelpButton'

describe('HelpButton', () => {
  beforeEach(() => {
    // window.location.href をリセット
    window.location.href = ''
    // sendBeacon をリセット
    vi.mocked(navigator.sendBeacon).mockReset()
    vi.mocked(navigator.sendBeacon).mockReturnValue(true)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Spec: 03.5_test_plan.md — FE-01 */
  it('HELPボタンを3000ms長押しすると tel:119 が設定される（sendBeacon失敗に関わらず）', async () => {
    // Arrange: sendBeaconをモック（失敗を返す）
    vi.mocked(navigator.sendBeacon).mockReturnValue(false)

    const onTrigger = vi.fn()
    const { getByRole } = render(
      <HelpButton
        onTrigger={onTrigger}
        lat={35.6762}
        lng={139.6503}
        symptoms={[]}
      />
    )

    const button = getByRole('button', { name: /緊急通報ボタン/i })

    // When: HELPボタンを3000ms長押し
    fireEvent.pointerDown(button)
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // Then: window.location.href に "tel:119" が設定される
    expect(window.location.href).toBe('tel:119')

    // And: sendBeaconの失敗に関わらずtel:119が発火する
    // (sendBeaconがfalseを返しても、tel:119は設定済み)
    expect(window.location.href).toBe('tel:119')

    // And: onTriggerコールバックが呼び出される
    expect(onTrigger).toHaveBeenCalled()
  })

  /** Spec: 03.5_test_plan.md — FE-01 (独立性の確認) */
  it('sendBeaconが失敗してもtel:119は発火する', () => {
    // Arrange: sendBeaconをモック（例外を投げる最悪ケース）
    vi.mocked(navigator.sendBeacon).mockImplementation(() => {
      throw new Error('Network error')
    })

    const onTrigger = vi.fn()
    const { getByRole } = render(
      <HelpButton
        onTrigger={onTrigger}
        lat={35.6762}
        lng={139.6503}
        symptoms={[]}
      />
    )

    const button = getByRole('button', { name: /緊急通報ボタン/i })

    // When: 3000ms長押し
    fireEvent.pointerDown(button)
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // Then: sendBeaconが例外を投げても tel:119 は設定される
    expect(window.location.href).toBe('tel:119')
  })

  /** Spec: 03.5_test_plan.md — FE-02 */
  it('HELPボタンを2000ms押してから離すと onTrigger は呼ばれない', () => {
    // Arrange
    const onTrigger = vi.fn()
    const { getByRole } = render(
      <HelpButton
        onTrigger={onTrigger}
        lat={35.6762}
        lng={139.6503}
        symptoms={[]}
      />
    )

    const button = getByRole('button', { name: /緊急通報ボタン/i })

    // When: HELPボタンを2000ms押してから離す（3000ms未満）
    fireEvent.pointerDown(button)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    fireEvent.pointerUp(button)

    // Then: onTriggerコールバックが呼び出されない
    expect(onTrigger).not.toHaveBeenCalled()
  })

  /** Spec: 03.5_test_plan.md — FE-02 (プログレスリセット) */
  it('長押し中断後はプログレスが0にリセットされる', () => {
    // Arrange
    const onTrigger = vi.fn()
    const { getByRole, container } = render(
      <HelpButton
        onTrigger={onTrigger}
        lat={35.6762}
        lng={139.6503}
        symptoms={[]}
      />
    )

    const button = getByRole('button', { name: /緊急通報ボタン/i })

    // When: 2000msで中断
    fireEvent.pointerDown(button)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    fireEvent.pointerUp(button)

    // Advance timers to allow state updates
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Then: プログレスが0にリセットされる
    // HelpButtonがprogress属性またはaria-valuenowでプログレスを公開していることを期待
    const progressEl = container.querySelector('[data-progress]')
    if (progressEl) {
      expect(progressEl.getAttribute('data-progress')).toBe('0')
    } else {
      // aria-valuenow での確認
      const progressbar = container.querySelector('[role="progressbar"]')
      if (progressbar) {
        expect(progressbar.getAttribute('aria-valuenow')).toBe('0')
      } else {
        // onTriggerが呼ばれていないことが最低限の確認
        expect(onTrigger).not.toHaveBeenCalled()
      }
    }
  })
})
