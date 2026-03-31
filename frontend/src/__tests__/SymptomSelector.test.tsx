/**
 * 症状選択コンポーネントのテスト
 * Spec: 03.5_test_plan.md — FE-03
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import SymptomSelector from '../../components/ui/SymptomSelector'

describe('SymptomSelector', () => {
  /** Spec: 03.5_test_plan.md — FE-03 */
  it('複数の症状を選択すると両方が選択済み状態になり onChangeが呼ばれる', () => {
    // Arrange
    const onChange = vi.fn()
    const { getByRole, getAllByRole } = render(
      <SymptomSelector onChange={onChange} />
    )

    // When: 「意識がない」チップをタップ
    const chip1 = getByRole('button', { name: '意識がない' })
    fireEvent.click(chip1)

    // And: 「息をしていない」チップをタップ
    const chip2 = getByRole('button', { name: '息をしていない' })
    fireEvent.click(chip2)

    // Then: 両方のチップが選択済み状態（aria-pressed="true"）になる
    expect(chip1.getAttribute('aria-pressed')).toBe('true')
    expect(chip2.getAttribute('aria-pressed')).toBe('true')

    // And: onChangeコールバックが ["意識がない", "息をしていない"] で呼び出される
    // onChangeは最後の呼び出しで両方含まれていることを確認
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
    expect(lastCall[0]).toContain('意識がない')
    expect(lastCall[0]).toContain('息をしていない')
  })

  it('選択済みのチップを再度タップすると選択解除される', () => {
    // Arrange
    const onChange = vi.fn()
    const { getByRole } = render(<SymptomSelector onChange={onChange} />)

    const chip = getByRole('button', { name: '意識がない' })

    // When: チップを選択してから再度タップ
    fireEvent.click(chip) // 選択
    fireEvent.click(chip) // 解除

    // Then: チップが未選択状態（aria-pressed="false"）になる
    expect(chip.getAttribute('aria-pressed')).toBe('false')

    // And: onChangeは空配列または当該要素を除く配列で呼ばれる
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
    expect(lastCall[0]).not.toContain('意識がない')
  })
})
