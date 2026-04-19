---
name: storybook-component
description: >
  Component-driven development with Storybook 10.
  Use when creating or documenting React components, writing stories or interaction tests,
  designing UI variations, or syncing stories after component changes.
---

# Storybook 10 Component Development

## Philosophy

Components are designed in Storybook first, then integrated into the app.
Every component gets a `.stories.tsx` file co-located next to it.

```
components/
  ChatMessage.tsx
  ChatMessage.stories.tsx
  ChatInput.tsx
  ChatInput.stories.tsx
```

## Story File Template (CSF3)

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MyComponent } from './MyComponent';

const meta = {
  component: MyComponent,
  tags: ['autodocs'],
  // Decorators use design token classes, NEVER inline style with hex
  decorators: [
    (Story) => (
      <div className="bg-bg text-text p-4">
        <Story />
      </div>
    ),
  ],
  // Default args shared across all stories
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;
```

## Writing Stories — One Story Per State

Each named export = one visual state. Cover: default, edge cases, loading, error, disabled.

```tsx
export const Default: Story = {
  args: {
    label: 'Click me',
    variant: 'primary',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const LongContent: Story = {
  args: {
    label: 'A very long label that might overflow the button container',
  },
};

export const Empty: Story = {
  args: {
    label: '',
  },
};
```

## Interaction Testing with Play Functions

Use play functions to verify interactive behavior directly in Storybook.
This replaces basic render tests — no need to duplicate in vitest.

```tsx
import { expect, fn, within, userEvent } from 'storybook/test';

export const SubmitForm: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ args, canvas, userEvent, step }) => {
    await step('Fill in form', async () => {
      await userEvent.type(canvas.getByLabelText('Email'), 'test@example.com');
      await userEvent.type(canvas.getByLabelText('Password'), 'secret123');
    });

    await step('Submit', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    });

    await expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};
```

### Key APIs

| API | Usage |
|-----|-------|
| `canvas.getByRole()` | Preferred — query by accessibility role |
| `canvas.getByLabelText()` | Form fields with labels |
| `canvas.getByText()` | Visible text content |
| `canvas.findByRole()` | Async — waits for element to appear |
| `canvas.queryByRole()` | Check element absence (returns null) |
| `userEvent.click()` | Click interaction |
| `userEvent.type()` | Type into input |
| `userEvent.hover()` | Hover over element |
| `expect()` | Jest-compatible assertions |
| `fn()` | Create spy for callback args |
| `step()` | Group interactions with labels |

## Custom Render

When the component needs siblings or wrapper context:

```tsx
export const WithAlert: Story = {
  args: { message: 'Hello' },
  render: (args) => (
    <div className="chat-container">
      <MyComponent {...args} />
      <footer>Status: connected</footer>
    </div>
  ),
};
```

## Decorators for Providers

Wrap stories with context providers at the meta level:

```tsx
const meta = {
  component: ChatPanel,
  decorators: [
    (Story) => (
      <SocketProvider value={mockSocket}>
        <Story />
      </SocketProvider>
    ),
  ],
} satisfies Meta<typeof ChatPanel>;
```

## Parameters for Addon Config

```tsx
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'fullscreen', // or 'centered', 'padded'
  },
};
```

## Testing Strategy Split

| What to test | Where |
|-------------|-------|
| Visual states & variations | Storybook stories (args) |
| User interactions & UI behavior | Storybook play functions |
| Business logic, hooks, stores | Vitest unit tests |
| Complex async flows | Vitest with mocks |

**Rule**: If it's about how the component *looks* or *responds to clicks*, put it in Storybook.
If it's about *logic*, put it in vitest.

## Storybook Config (React + Vite)

Storybook 10 has essentials and interactions built-in. Only add extra addons as needed.

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-a11y'],
};

export default config;
```

```ts
// .storybook/preview.ts
import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: {
    layout: 'centered',
  },
};

export default preview;
```

## Naming Conventions

- File: `ComponentName.stories.tsx` (co-located with component)
- Meta title: auto-derived from file path, or explicit `title: 'Components/ChatMessage'`
- Story names: PascalCase describing the state: `Default`, `Loading`, `WithError`, `LongContent`

## Checklist for New Components

1. Create component file with props interface
2. Create `.stories.tsx` with meta + Default story
3. Add story variants for each meaningful state
4. Add play functions for interactive behavior
5. Verify in Storybook UI (`pnpm storybook`)
6. Add vitest tests only for logic not covered by stories
