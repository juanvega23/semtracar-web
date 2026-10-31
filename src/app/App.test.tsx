import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('muestra la marca SEMTRACAR', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'SEMTRACAR' })).toBeInTheDocument();
  });
});
