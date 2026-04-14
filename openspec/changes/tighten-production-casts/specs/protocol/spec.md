# Spec Delta: protocol (tighten-production-casts)

## ADDED Requirements

### Requirement: ClientMessage SHALL be a discriminated union over name

The `ClientMessage` type emitted by summoner adapters SHALL be a discriminated union keyed by `name`, where each variant binds a specific payload shape. This eliminates the need for `(msg as any).payload.X` access in consumers.

```ts
type ClientMessage = {
  [K in keyof MessagePayloadMap]: { name: K; payload: MessagePayloadMap[K] };
}[keyof MessagePayloadMap];
```

#### Scenario: narrowing on name yields typed payload

- GIVEN a `ClientMessage` value
- WHEN the consumer narrows via `if (msg.name === 'message:assistant')`
- THEN `msg.payload` SHALL have the type `MessagePayloadMap['message:assistant']`
- AND no cast SHALL be required to read fields from it

#### Scenario: producer mismatch is caught at compile time

- GIVEN an adapter transform that emits `{ name: 'X', payload: {...} }`
- WHEN the payload shape does not match `MessagePayloadMap['X']`
- THEN tsc SHALL report an error at the producer site

### Requirement: FakeClaude.events() SHALL bind event name to payload type

`FakeClaude.events(name)` and related accessors SHALL be generic over `name extends keyof ServerToClientEvents`, returning an array typed by the corresponding payload. This eliminates the need for `(e: any) => e.foo` in test callbacks.

#### Scenario: events('xxx') returns typed payload array

- GIVEN a FakeClaude instance
- WHEN test code calls `claude.events('session:created')`
- THEN the return type SHALL be `Array<PayloadOf<'session:created'>>`
- AND `.filter((e) => e.channelId === 'X')` SHALL type-check without casting `e`
