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
    expect(screen.getAllByText('PulseGrid to Health Sandbox')).toHaveLength(2);
    expect(screen.getAllByText(/Programme criteria match/i)).toHaveLength(2);
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

  it('switches to the service provider lens for deployment opportunities', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /service provider lens/i }));

    expect(screen.getAllByText('MedReg Studio')).toHaveLength(2);
    expect(screen.getByText('Provider deployment queue')).toBeVisible();
    expect(screen.getByText('Which companies or programmes should this provider support next?')).toBeVisible();
    expect(screen.getAllByText('PulseGrid regulatory sprint')).toHaveLength(2);
    expect(screen.getByText('Provider Capacity')).toBeVisible();
    expect(screen.getByText('Readiness Clinic')).toBeVisible();
  });

  it('shows ranked partner opportunities in the partner lens', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /partner rankings lens/i }));

    expect(screen.getByText('Ranked partner opportunities')).toBeVisible();
    expect(screen.getByText('Which partners are most worth pursuing now?')).toBeVisible();
    expect(screen.getByText('#1')).toBeVisible();
    expect(screen.getAllByText('Regional Hospital Network')).toHaveLength(2);
    expect(screen.getAllByText('Pilot pathway')).toHaveLength(2);
    expect(screen.getByText('Warm intro')).toBeVisible();
    expect(screen.getAllByText('Partner ranking detail')).toHaveLength(2);
  });

  it('makes WhatsApp upload a prominent relationship evidence source', async () => {
    render(<App />);

    expect(screen.getByText('Add relationship evidence')).toBeVisible();
    expect(screen.getByText('WhatsApp conversation export')).toBeVisible();
    expect(screen.getByText('Prominent source')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /queue whatsapp export/i }));

    expect(screen.getByText('WhatsApp evidence queued for AI extraction.')).toBeVisible();
    expect(screen.getByText('Conversation signals')).toBeVisible();
    expect(screen.getByText('Actors, blockers, commitments, follow-ups, and relationship warmth.')).toBeVisible();
    expect(screen.getByText('Mentorship signals')).toBeVisible();
    expect(screen.getByText('Mentor responsiveness, advice quality, unresolved asks, and follow-up gaps.')).toBeVisible();
  });
});
