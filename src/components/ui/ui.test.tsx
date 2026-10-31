import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { TextField } from './Field';
import { LockedState } from './States';

describe('Button', () => {
  it('se deshabilita mientras envía para evitar doble envío (RNF-26)', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Guardar
      </Button>,
    );
    const button = screen.getByRole('button', { name: /guardar/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('asocia la etiqueta y anuncia el error', () => {
    render(<TextField label="Correo" error="Correo inválido" />);
    const input = screen.getByLabelText('Correo');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Correo inválido');
  });

  it('permite mostrar y ocultar la contraseña', async () => {
    render(<TextField label="Contraseña" type="password" />);
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});

describe('LockedState', () => {
  it('muestra el candado con mensaje en español (RF-66)', () => {
    render(<LockedState />);
    expect(screen.getByRole('heading', { name: 'Sección bloqueada' })).toBeInTheDocument();
  });
});
