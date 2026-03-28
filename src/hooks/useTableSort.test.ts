import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTableSort from './useTableSort';

describe('useTableSort', () => {
  it('initializes with default field and direction', () => {
    const { result } = renderHook(() => useTableSort<'amount' | 'name'>('amount'));
    expect(result.current.sortField).toBe('amount');
    expect(result.current.sortDirection).toBe('desc');
  });

  it('initializes with custom default direction', () => {
    const { result } = renderHook(() => useTableSort<'amount'>('amount', 'asc'));
    expect(result.current.sortDirection).toBe('asc');
  });

  it('handleSort toggles direction when same field', () => {
    const { result } = renderHook(() => useTableSort<'amount' | 'name'>('amount'));
    expect(result.current.sortDirection).toBe('desc');

    act(() => result.current.handleSort('amount'));
    expect(result.current.sortField).toBe('amount');
    expect(result.current.sortDirection).toBe('asc');

    act(() => result.current.handleSort('amount'));
    expect(result.current.sortDirection).toBe('desc');
  });

  it('handleSort changes field and resets direction', () => {
    const { result } = renderHook(() => useTableSort<'amount' | 'name'>('amount'));

    act(() => result.current.handleSort('amount')); // toggle to asc
    expect(result.current.sortDirection).toBe('asc');

    act(() => result.current.handleSort('name'));
    expect(result.current.sortField).toBe('name');
    expect(result.current.sortDirection).toBe('desc'); // reset to default
  });

  it('setSortField changes field and resets direction', () => {
    const { result } = renderHook(() => useTableSort<'amount' | 'name'>('amount'));

    act(() => result.current.setSortField('name'));
    expect(result.current.sortField).toBe('name');
    expect(result.current.sortDirection).toBe('desc');
  });

  it('toggleDirection flips asc/desc', () => {
    const { result } = renderHook(() => useTableSort<'amount'>('amount'));
    expect(result.current.sortDirection).toBe('desc');

    act(() => result.current.toggleDirection());
    expect(result.current.sortDirection).toBe('asc');

    act(() => result.current.toggleDirection());
    expect(result.current.sortDirection).toBe('desc');
  });

  it('resetSort returns to initial defaults', () => {
    const { result } = renderHook(() => useTableSort<'amount' | 'name'>('amount'));

    act(() => {
      result.current.handleSort('name');
      result.current.toggleDirection();
    });
    expect(result.current.sortField).toBe('name');

    act(() => result.current.resetSort());
    expect(result.current.sortField).toBe('amount');
    expect(result.current.sortDirection).toBe('desc');
  });
});
