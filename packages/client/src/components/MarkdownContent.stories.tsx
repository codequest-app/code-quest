import type { Meta, StoryObj } from '@storybook/react-vite';
import { MarkdownContent } from './MarkdownContent';

const meta: Meta<typeof MarkdownContent> = {
  component: MarkdownContent,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="max-w-2xl bg-surface text-text p-6 prose prose-invert prose-sm max-w-none">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MarkdownContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paragraph: Story = {
  args: { content: 'This is a simple paragraph with **bold**, *italic*, and `inline code`.' },
};

export const WithCodeBlock: Story = {
  args: {
    content: '```typescript\nconst greeting = (name: string) => "Hello, " + name + "!";\n```',
  },
};

export const WithTable: Story = {
  args: {
    content: `| Name | Role | Status |
|------|------|--------|
| Alice | Dev | Active |
| Bob | QA | Idle |`,
  },
};

export const WithListsAndHeadings: Story = {
  args: {
    content: `# Heading 1\n\n## Heading 2\n\n- Item A\n- Item B\n  - Nested\n\n1. First\n2. Second`,
  },
};

export const LongContent: Story = {
  args: {
    content: Array.from(
      { length: 10 },
      (_, i) =>
        `## Section ${i + 1}\n\nContent for section ${i + 1} with **emphasis** and \`code\`.\n`,
    ).join('\n'),
  },
};
