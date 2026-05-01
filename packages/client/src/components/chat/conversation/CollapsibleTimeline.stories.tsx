import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import type { Message } from '../../../types/ui';
import type { MessageNode } from '../../../utils/message-tree';
import { CollapsibleTimeline } from './CollapsibleTimeline';

const base = { role: 'assistant' as const, timestamp: Date.now() };

function textNode(id: string, content: string): MessageNode {
  return { message: { ...base, id, type: 'text', content } as Message, children: [] };
}

function toolNode(id: string, name: string, isError = false): MessageNode {
  return {
    message: {
      ...base,
      id,
      type: 'tool_use',
      content: name,
      meta: {
        toolId: `tu_${id}`,
        name,
        input: {},
        result: { content: 'done', is_error: isError },
      },
    } as Message,
    children: [],
  };
}

const meta: Meta<typeof CollapsibleTimeline> = {
  component: CollapsibleTimeline,
  tags: ['autodocs'],
  args: { onRewind: fn(), onFork: fn(), onStopTask: fn(), onDiffRespond: fn() },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="max-w-3xl bg-bg text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollapsibleTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleMessage: Story = {
  args: { nodes: [textNode('1', 'Checking the repo structure…')] },
};

export const MixedTools: Story = {
  args: {
    nodes: [
      textNode('1', 'Starting investigation'),
      toolNode('2', 'Read'),
      toolNode('3', 'Grep'),
      textNode('4', 'Found the bug'),
    ],
  },
};

export const WithError: Story = {
  args: {
    nodes: [toolNode('1', 'Bash'), toolNode('2', 'Read', true), textNode('3', 'Failed')],
  },
};

function thinkingNode(id: string, content: string): MessageNode {
  return { message: { ...base, id, type: 'thinking', content, meta: {} } as Message, children: [] };
}

function skillNode(id: string, skillName: string): MessageNode {
  return {
    message: {
      ...base,
      id,
      type: 'tool_use',
      content: 'Skill',
      meta: { toolId: `tu_${id}`, input: { skill: skillName }, result: { content: 'done' } },
    } as Message,
    children: [],
  };
}

export const WithThinkingBreaks: Story = {
  args: {
    nodes: [
      thinkingNode('t1', 'Let me first look at the files…'),
      toolNode('1', 'Read'),
      toolNode('2', 'Read'),
      toolNode('3', 'Grep'),
      thinkingNode('t2', 'Found the issue, now I will fix it…'),
      toolNode('4', 'Edit'),
      toolNode('5', 'Bash'),
      textNode('6', 'Done! The bug is fixed.'),
    ],
  },
};

export const WithSkillInvocation: Story = {
  args: {
    nodes: [
      thinkingNode('t1', 'I will use the zod-validation skill…'),
      toolNode('1', 'Read'),
      skillNode('2', 'superpowers:zod-validation'),
      thinkingNode('t2', 'Schema looks good, making the changes…'),
      toolNode('3', 'Edit'),
      textNode('4', 'Schema updated with validation improvements.'),
    ],
  },
};
