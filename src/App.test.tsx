import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the ecosystem relationship OS mock', () => {
    render(<App />);

    expect(screen.getByText('Relationship OS')).toBeVisible();
    expect(screen.getByText('linkedin.com/company/pulsegrid-health')).toBeVisible();
    expect(screen.getByText('Recommended relationship bundle')).toBeVisible();
    expect(screen.getByText('Relationships to create')).toBeVisible();
    expect(screen.getByText('What AI reads after LinkedIn')).toBeVisible();
    expect(screen.getByText('What the product collects quietly')).toBeVisible();
    expect(screen.getByText('Automate discovery and evidence. Keep humans on judgement and governance.')).toBeVisible();
  });
});
