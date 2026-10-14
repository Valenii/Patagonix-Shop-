import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantitySelector } from '../QuantitySelector';

describe('QuantitySelector', () => {
  it('deshabilita el boton "-" cuando la cantidad es 1', () => {
    render(<QuantitySelector quantity={1} max={5} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /disminuir/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /aumentar/i })).toBeEnabled();
  });

  it('deshabilita el boton "+" cuando se alcanza el stock maximo', () => {
    render(<QuantitySelector quantity={5} max={5} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /aumentar/i })).toBeDisabled();
  });

  it('llama a onChange con quantity + 1 al clickear "+"', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<QuantitySelector quantity={2} max={5} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /aumentar/i }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('llama a onChange con quantity - 1 al clickear "-"', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<QuantitySelector quantity={2} max={5} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /disminuir/i }));

    expect(onChange).toHaveBeenCalledWith(1);
  });
});
