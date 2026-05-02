# Spec Delta: protocol (fix-fork-resume-sessionid)

## MODIFIED Requirements

### Requirement: session:fork spawns a forked CLI with preset sessionId and cloned history

The server SHALL handle `session:fork` by (a) resolving the parent's durable sessionId from its channelId, (b) generating a new sessionId server-side, (c) cloning parent raw events under the new sessionId, and (d) spawning a new CLI with argv `--resume <parentSessionId> --fork-session --session-id <newSessionId>` plus optional `--resume-session-at <messageUuid>`. The spawn SHALL use the parent's recorded `cwd`. The new channel's `ch.sessionId` SHALL be pre-set to the generated sessionId in `onBeforeSpawn`.

#### Scenario: fork generates sessionId, clones events, and spawns with preset id

- GIVEN an alive channel `ch-parent` with `sessionId === 'sess-parent'`, a sessionStore row with `cwd === '/tmp/p'`, and 2 rawEventStore rows under `sess-parent`
- WHEN a client emits `session:fork { forkedFromChannelId: 'ch-parent', newChannelId: 'ch-new' }`
- THEN the spawned CLI argv SHALL contain `--resume sess-parent`, `--fork-session`, and `--session-id <uuid>`
- AND the spawn `cwd` SHALL be `/tmp/p`
- AND `rawEventStore.getBySession(<uuid>)` SHALL return 2 rows (cloned from parent)
- AND `channel('ch-new').sessionId` SHALL equal `<uuid>`

#### Scenario: fork resolves parent from sessionStore when channel is dead

- GIVEN no alive channel with id `ch-parent`
- AND a sessionStore row `{ id: 'sess-parent', channelId: 'ch-parent', cwd: '/tmp/p' }`
- WHEN a client emits `session:fork { forkedFromChannelId: 'ch-parent', newChannelId: 'ch-new' }`
- THEN the spawned CLI argv SHALL contain `--resume sess-parent --fork-session --session-id <uuid>`
- AND events SHALL be cloned under `<uuid>`

#### Scenario: fork passes resumeSessionAt through to argv

- GIVEN the above setup
- WHEN a client emits `session:fork { forkedFromChannelId: 'ch-parent', resumeSessionAt: 'msg-42', newChannelId: 'ch-new' }`
- THEN the spawned CLI argv SHALL contain `--resume-session-at msg-42`

#### Scenario: fork rejects unknown parent

- GIVEN no alive channel and no sessionStore row for `ch-missing`
- WHEN a client emits `session:fork { forkedFromChannelId: 'ch-missing', newChannelId: 'ch-new' }`
- THEN the server SHALL ack `{ success: false, error: <message> }`
- AND the server SHALL NOT call `channelManager.create`
- AND the server SHALL NOT call `rawEventStore.cloneEvents`

#### Scenario: fork ack no longer carries events

- GIVEN fork succeeds
- WHEN the server acks
- THEN the ack SHALL be `{ success: true, channelId, parentChannelId }`
- AND the ack SHALL NOT carry a populated `events` array (reload reads from rawEventStore instead)

### Requirement: RawEventStore supports cloning events between sessions

`RawEventStore` SHALL expose `cloneEvents(fromSessionId: string, toSessionId: string): Promise<void>`. It SHALL copy every row whose `sessionId === fromSessionId` into new rows with `sessionId === toSessionId`, preserving `raw`, `direction`, `timestamp`, and `promptId`. The `seq` column SHALL be re-sequenced monotonically from 1 in the destination. Cloning when the source has zero rows is a no-op. Cloning with `fromSessionId === toSessionId` is rejected.

#### Scenario: clone copies rows with rewritten sessionId

- GIVEN rawEventStore has 3 rows for `sess-parent` (seq 1..3)
- WHEN `cloneEvents('sess-parent', 'sess-new')` is called
- THEN `getBySession('sess-new')` SHALL return 3 rows
- AND each returned row SHALL have `sessionId === 'sess-new'`
- AND the returned rows SHALL preserve their original `raw` content
- AND `seq` in the destination SHALL be `[1, 2, 3]` monotonically

#### Scenario: cloning an empty source is a no-op

- GIVEN rawEventStore has no rows for `sess-empty`
- WHEN `cloneEvents('sess-empty', 'sess-target')` is called
- THEN the call SHALL succeed
- AND `getBySession('sess-target')` SHALL return `[]`

#### Scenario: cloning from/to the same id is rejected

- WHEN `cloneEvents('X', 'X')` is called
- THEN the call SHALL throw (or ack failure — impl's choice, but MUST NOT silently duplicate)
