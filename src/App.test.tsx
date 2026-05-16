import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('processes relationship evidence and opens a recommendation review', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /process relationship evidence/i }));

    expect(screen.getByText('Evidence processed from 8 sources.')).toBeVisible();
    expect(screen.getByText('Relationship evidence ready')).toBeVisible();
    expect(screen.getAllByText('18')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: /review create programme link/i }));

    expect(screen.getByText('Selected recommendation')).toBeVisible();
    expect(screen.getByText('PulseGrid to Health Sandbox')).toBeVisible();
    expect(screen.getByText(/Programme criteria match/i)).toBeVisible();
  });

  it('lets admins approve links or request missing evidence', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /process relationship evidence/i }));
    await userEvent.click(screen.getByRole('button', { name: /approve attach service provider/i }));
    await userEvent.click(screen.getByRole('button', { name: /request evidence for escalate partner pathway/i }));

    expect(screen.getByText('1 approved')).toBeVisible();
    expect(screen.getByText('1 evidence request')).toBeVisible();
    expect(screen.getByText('Approved')).toBeVisible();
    expect(screen.getByText('Evidence requested')).toBeVisible();
  });
});
