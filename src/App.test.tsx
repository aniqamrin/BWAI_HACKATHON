import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the scaffold smoke screen', () => {
    render(<App />);

    expect(screen.getByText('Cohort Atlas')).toBeVisible();
    expect(screen.getByText('Local prototype scaffold ready')).toBeVisible();
  });
});
