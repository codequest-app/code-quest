import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
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
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Step 1 of 4')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    await expect(canvas.getByText('Step 2 of 4')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    await expect(canvas.getByText('Step 3 of 4')).toBeInTheDocument();
  },
};

export const Skip: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /skip/i }));
    await expect(usePreferencesStore.getState().isOnboardingDismissed).toBe(true);
  },
};

export const Finish: Story = {
  play: async ({ canvas, userEvent }) => {
    for (let i = 0; i < 3; i++) {
      await userEvent.click(canvas.getByRole('button', { name: /next/i }));
    }
    await userEvent.click(canvas.getByRole('button', { name: /done/i }));
    await expect(usePreferencesStore.getState().isOnboardingDismissed).toBe(true);
  },
};
