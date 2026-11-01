import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// El ImageUploader llama a la API de S3: se mockea el servicio para que el
// test no dependa de la red ni de AWS.
const uploadProductImageMock = vi.fn();
vi.mock('../../services/imageUploadService', () => ({
  uploadProductImage: (...args: unknown[]) => uploadProductImageMock(...args),
}));

// jsdom no implementa URL.createObjectURL (lo usa la vista previa de la imagen).
URL.createObjectURL = vi.fn(() => 'blob:preview');

const { ProductForm } = await import('../ProductForm');

describe('ProductForm', () => {
  it('valida en tiempo real mientras se escribe', async () => {
    const user = userEvent.setup();
    render(<ProductForm isSubmitting={false} onSubmit={vi.fn()} />);

    const nameInput = screen.getByLabelText('Nombre');
    await user.type(nameInput, 'ab');
    expect(screen.getByText('El nombre debe tener al menos 3 caracteres.')).toBeInTheDocument();

    await user.type(nameInput, 'c');
    expect(screen.queryByText('El nombre debe tener al menos 3 caracteres.')).not.toBeInTheDocument();

    // Un campo que todavia no se toco no muestra error.
    expect(screen.queryByText(/al menos 10 caracteres/)).not.toBeInTheDocument();
  });

  it('no envia el formulario si falta la imagen y muestra todos los errores', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ProductForm isSubmitting={false} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Sube una imagen del producto.')).toBeInTheDocument();
    expect(screen.getByText('El precio debe ser mayor a 0.')).toBeInTheDocument();
  });

  it('sube la imagen a S3 y envia el imageUrl/imageKey para guardarlos en Firestore', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    uploadProductImageMock.mockResolvedValue({
      ok: true,
      data: { publicUrl: 'https://bucket.s3.amazonaws.com/products/abc-foto.jpg', key: 'products/abc-foto.jpg' },
    });
    const { container } = render(<ProductForm isSubmitting={false} onSubmit={onSubmit} />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, new File(['img'], 'foto.jpg', { type: 'image/jpeg' }));

    await user.type(screen.getByLabelText('Nombre'), 'Mochila Andina');
    await user.type(screen.getByLabelText('Descripcion'), 'Mochila de 30 litros impermeable');
    const price = screen.getByLabelText('Precio (ARS)');
    await user.clear(price);
    await user.type(price, '25000');
    const stock = screen.getByLabelText('Stock');
    await user.clear(stock);
    await user.type(stock, '4');

    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mochila Andina',
        price: 25000,
        stock: 4,
        imageUrl: 'https://bucket.s3.amazonaws.com/products/abc-foto.jpg',
        imageKey: 'products/abc-foto.jpg',
      }),
    );
  });
});
