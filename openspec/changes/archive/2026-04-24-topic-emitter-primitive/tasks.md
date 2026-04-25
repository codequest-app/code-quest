# tasks

- [ ] Red: write `topic-emitter.test.ts` covering subscribe / publish /
  same-id dedup / unsubscribe idempotency / hasSubscribers / throw
  isolation.
- [ ] Implement `TopicEmitter<T, P>` in `packages/shared/src/topic-emitter.ts`.
- [ ] Export from `packages/shared/src/index.ts`.
- [ ] Verify shared vitest green, no other package touched.
- [ ] Single commit: `feat(shared): TopicEmitter pub/sub primitive`.
