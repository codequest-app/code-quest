import type { ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { FsProvider } from '../contexts/FsContext';
import { GitProvider } from '../contexts/GitContext';
import { OpenspecProvider } from '../contexts/OpenspecContext';
import { SocketProvider } from '../contexts/SocketContext';

/** Standard provider stack used by FilesPane / FileTree / SpecPane / GitPane
 *  tests: Socket → Git → Fs → Openspec. Replaces ~10 lines of duplicated
 *  Wrapper boilerplate in each test file. */
export function FsProvidersWrapper({ socket, children }: { socket: Socket; children: ReactNode }) {
  return (
    <SocketProvider socket={socket}>
      <GitProvider>
        <FsProvider>
          <OpenspecProvider>{children}</OpenspecProvider>
        </FsProvider>
      </GitProvider>
    </SocketProvider>
  );
}
