import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContentRenderer } from './ContentRenderer';

const meta = {
  component: ContentRenderer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-bg text-text p-6 w-180">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContentRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainText: Story = {
  args: {
    content: 'A plain text block with no ANSI codes and no diff markers.',
  },
};

export const WithFilePath: Story = {
  args: {
    content: 'See packages/client/src/App.tsx for the entrypoint.',
  },
};

// ANSI content is covered by OutputContent's downstream stories; skipping here
// because ansi-to-react's default export is not a stable React component in
// our Storybook build.

export const Diff: Story = {
  args: {
    content: `--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,3 @@
 const a = 1;
-const b = 2;
+const b = 3;
 const c = 4;`,
  },
};

export const EditableDiff: Story = {
  args: {
    content: `--- a/file.ts
+++ b/file.ts
@@ -1,2 +1,2 @@
-old
+new`,
    editable: true,
  },
};
