import { beforeEach, describe, expect, it } from 'vitest';
import { useMcpStore } from '../mcpStore';

describe('mcpStore', () => {
  beforeEach(() => {
    useMcpStore.setState({
      tools: [
        { id: 'web-search', name: 'Web Search', description: 'Search the web', installed: false },
        {
          id: 'file-system',
          name: 'File System',
          description: 'Access local files',
          installed: true,
        },
      ],
    });
  });

  it('lists all tools', () => {
    expect(useMcpStore.getState().tools.length).toBe(2);
  });

  it('toggleInstall installs an uninstalled tool', () => {
    useMcpStore.getState().toggleInstall('web-search');
    const tool = useMcpStore.getState().tools.find((t) => t.id === 'web-search');
    expect(tool?.installed).toBe(true);
  });

  it('toggleInstall uninstalls an installed tool', () => {
    useMcpStore.getState().toggleInstall('file-system');
    const tool = useMcpStore.getState().tools.find((t) => t.id === 'file-system');
    expect(tool?.installed).toBe(false);
  });
});
