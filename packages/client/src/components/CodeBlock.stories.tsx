import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { CodeBlock } from './CodeBlock';

const meta = {
  component: CodeBlock,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const JavaScript: Story = {
  args: {
    code: `function greet(name) {\n  console.log(\`Hello, \${name}!\`);\n}`,
    language: 'js',
  },
};

export const TypeScript: Story = {
  args: {
    code: `interface User {\n  id: number;\n  name: string;\n}\n\nconst user: User = { id: 1, name: "Alice" };`,
    language: 'typescript',
  },
  play: async ({ canvas, userEvent }) => {
    const btn = canvas.getByRole('button', { name: /copy code/i });
    await expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    await expect(canvas.getByRole('button', { name: /copied/i })).toBeInTheDocument();
  },
};

export const InlineCode: Story = {
  args: { code: 'npm install', language: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('npm install')).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: /copy/i })).toBeNull();
  },
};
