import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SpeechInputButton } from './SpeechInputButton.tsx';

const meta: Meta<typeof SpeechInputButton> = {
  component: SpeechInputButton,
  tags: ['autodocs'],
  args: { onToggle: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-8 flex justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpeechInputButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { isListening: false, isSupported: true },
};

export const Listening: Story = {
  args: { isListening: true, isSupported: true },
};

export const WithInterimText: Story = {
  args: { isListening: true, isSupported: true, interimText: 'Hello world...' },
};

export const NotSupported: Story = {
  args: { isListening: false, isSupported: false },
};
