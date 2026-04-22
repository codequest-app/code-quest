import {
  EVENTS,
  gitUpdateSkippedBranchPayloadSchema,
  sessionForkPayloadSchema,
  sessionTeleportPayloadSchema,
} from '@code-quest/shared';
import type { RawEvent } from '@code-quest/summoner';
import { logger } from '../../../logger.ts';
import type { HandlerContext } from '../../../types.ts';
import type { Channel } from '../../channel.ts';
import { withChannel, withError } from '../../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../../types.ts';
import { errMsg } from '../../utils/helpers.ts';
import { resolveProjectRoot } from '../../utils/project-root.ts';
import { err, ok } from '../../utils/rpc.ts';

export function create({
  channelManager,
  sessionHistory,
  sessionStore,
  rawEventStore,
  emitter,
  gitService,
}: Pick<
  HandlerContext,
  'channelManager' | 'sessionHistory' | 'sessionStore' | 'rawEventStore' | 'emitter' | 'gitService'
>): void {
  async function handleFork(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { forkedFromChannelId, resumeSessionAt, newChannelId } =
        sessionForkPayloadSchema.parse(payload);

      const parentSessionId = await sessionHistory.resolveSessionId(forkedFromChannelId);
      const parentRow = await sessionStore.getById(parentSessionId);
      if (!parentRow) {
        callback?.(err('parent session not found', 'parent_not_found'));
        return;
      }
      if (!parentRow.cwd) {
        callback?.(err('parent session has no cwd; cannot fork', 'parent_no_cwd'));
        return;
      }

      const newSessionId = crypto.randomUUID();
      await rawEventStore.cloneEvents(parentSessionId, newSessionId);

      // Resolve projectRoot upfront so onBeforeSpawn can set it before any
      // broadcastSessionState emits (matches launch/resume symmetry).
      const projectRoot =
        parentRow.projectRoot ?? (await resolveProjectRoot(gitService, parentRow.cwd));
      await channelManager.create(newChannelId, {
        cwd: parentRow.cwd,
        launchOptions: {
          resumeSessionId: parentSessionId,
          forkSession: true,
          sessionId: newSessionId,
          ...(resumeSessionAt ? { resumeSessionAt } : {}),
        },
        onBeforeSpawn: (ch) => {
          ch.parentId = forkedFromChannelId;
          ch.sessionId = newSessionId;
          ch.projectRoot = projectRoot;
          if (socket) channelManager.addSocketToChannel(ch, socket);
        },
      });
      emitter.broadcastAll(EVENTS.session.created, {
        channelId: newChannelId,
        cwd: parentRow.cwd,
        projectRoot,
      });
      callback?.(ok({ channelId: newChannelId, parentChannelId: forkedFromChannelId }));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to fork session')));
    }
  }

  async function handleTeleport(
    ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const parsed = sessionTeleportPayloadSchema.parse(payload);
      // L3-pending shim: teleport payload has no cwd field and `ch` can be
      // null (teleport is invoked from SessionContext, not from a channel
      // context). Falling back to process.cwd() preserves the prior behavior
      // until teleport gets its own cwd field.
      const cwd = ch?.cwd ?? process.cwd();
      const events = await sessionHistory.getSessionHistory(parsed.remoteChannelId);

      let branchCheckoutFailed = false;
      if (parsed.branch) {
        try {
          await gitService.checkout(cwd, parsed.branch);
        } catch (err) {
          logger.debug(err, 'branch checkout failed during fork');
          branchCheckoutFailed = true;
        }
      }

      await channelManager.create(parsed.newChannelId, {
        cwd,
        launchOptions: { resumeSessionId: parsed.remoteChannelId },
        onBeforeSpawn: (newCh) => {
          if (socket) channelManager.addSocketToChannel(newCh, socket);
        },
      });

      const projectRoot = await resolveProjectRoot(gitService, cwd);
      const newCh = channelManager.get(parsed.newChannelId);
      if (newCh) newCh.projectRoot = projectRoot;
      emitter.broadcastAll(EVENTS.session.created, {
        channelId: parsed.newChannelId,
        cwd,
        projectRoot,
      });
      callback?.(
        ok({
          channelId: parsed.newChannelId,
          events,
          ...(branchCheckoutFailed && { branchCheckoutFailed: true, branch: parsed.branch }),
        }),
      );
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to teleport session')));
    }
  }

  async function handleUpdateSkippedBranch(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { branch, failed } = gitUpdateSkippedBranchPayloadSchema.parse(payload);
      const entry: RawEvent = {
        timestamp: Date.now(),
        sessionId: await sessionHistory.resolveSessionId(ch.channelId),
        direction: 'out',
        raw: JSON.stringify({ type: 'teleport-skipped-branch', branch, failed }),
        seq: 0,
      };
      await rawEventStore.append(entry);
      callback?.(ok({}));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to update skipped branch')));
    }
  }

  emitter.on(EVENTS.session.fork, handleFork);
  emitter.on(EVENTS.session.teleport, handleTeleport);
  emitter.on(EVENTS.git.update_skipped_branch, withError(withChannel(handleUpdateSkippedBranch)));
}
