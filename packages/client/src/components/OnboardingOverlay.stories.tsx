import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { OnboardingOverlay } from './OnboardingOverlay';

const meta = {
  component: OnboardingOverlay,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      usePreferencesStore.setState({ isOnboardingDismissed: false });
      return <Story />;
    },
  ],
} satisfies Meta<typeof OnboardingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StepThrough: Story = {
  play: async ({ userEvent }) => {
    const body = within(document.body);
    await expect(await body.findByText('Step 1 of 4')).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: /next/i }));
    await expect(body.getByText('Step 2 of 4')).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: /next/i }));
    await expect(body.getByText('Step 3 of 4')).toBeInTheDocument();
  },
};

export const Skip: Story = {
  play: async ({ userEvent }) => {
    const body = within(document.body);
    await userEvent.click(await body.findByRole('button', { name: /skip/i }));
    await expect(usePreferencesStore.getState().isOnboardingDismissed).toBe(true);
  },
};

export const Finish: Story = {
  play: async ({ userEvent }) => {
    const body = within(document.body);
    for (let i = 0; i < 3; i++) {
      await userEvent.click(await body.findByRole('button', { name: /next/i }));
    }
    await userEvent.click(await body.findByRole('button', { name: /done/i }));
    await expect(usePreferencesStore.getState().isOnboardingDismissed).toBe(true);
  },
};
