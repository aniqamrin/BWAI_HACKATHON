import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the dashboard shell', () => {
    render(<App />);

    expect(screen.getByText('Cohort Atlas')).toBeVisible();
    expect(screen.getByText('Graph surface lands in Task 5')).toBeVisible();
    expect(screen.getByRole('button', { name: /reset demo/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /load sample/i })).toBeVisible();
  });
});
