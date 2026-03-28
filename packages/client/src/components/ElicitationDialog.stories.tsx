import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ElicitationDialog } from './ElicitationDialog';

const meta = {
  component: ElicitationDialog,
  tags: ['autodocs'],
  args: { onSubmit: fn(), onCancel: fn() },
} satisfies Meta<typeof ElicitationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {
  args: {
    requestId: 'req-1',
    prompt: 'Please enter the database connection string:',
    inputType: 'text',
  },
};

export const UrlInput: Story = {
  args: {
    requestId: 'req-2',
    prompt: 'Please authenticate with the following URL:',
    inputType: 'url',
    url: 'https://auth.example.com/oauth/authorize?client_id=abc',
  },
};

export const SelectInput: Story = {
  args: {
    requestId: 'req-3',
    prompt: 'Which environment do you want to deploy to?',
    inputType: 'select',
    options: ['development', 'staging', 'production'],
  },
};
