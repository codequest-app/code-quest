import { create } from 'zustand';

export interface McpTool {
  id: string;
  name: string;
  description: string;
  installed: boolean;
}

interface McpStore {
  tools: McpTool[];
  toggleInstall: (toolId: string) => void;
}

const DEFAULT_TOOLS: McpTool[] = [
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web for information',
    installed: false,
  },
  {
    id: 'file-system',
    name: 'File System',
    description: 'Access and manage local files',
    installed: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Interact with GitHub repositories',
    installed: false,
  },
  { id: 'database', name: 'Database', description: 'Query and manage databases', installed: false },
  { id: 'docker', name: 'Docker', description: 'Manage Docker containers', installed: false },
];

export const useMcpStore = create<McpStore>((set) => ({
  tools: DEFAULT_TOOLS,

  toggleInstall: (toolId: string) => {
    set((state) => ({
      tools: state.tools.map((t) => (t.id === toolId ? { ...t, installed: !t.installed } : t)),
    }));
  },
}));
