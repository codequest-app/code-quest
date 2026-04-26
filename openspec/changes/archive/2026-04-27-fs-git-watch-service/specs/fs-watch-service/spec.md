## ADDED Requirements

### Requirement: WatchService observes directory FS events
The `WatchService` interface SHALL expose `subscribe(cwd: string, callback: (event: WatchEvent) => void): Unsubscribe`. Subscribers receive events for any FS change under `cwd` that matches the ignore policy.

#### Scenario: Subscription delivers raw events
- **WHEN** a caller subscribes to `cwd = /repo` and a file at `/repo/src/foo.ts` changes
- **THEN** the callback receives `{ event: 'change', path: 'src/foo.ts' }` (paths relative to cwd).

#### Scenario: Subscription skips ignored paths
- **WHEN** a change occurs at `/repo/node_modules/x/y.js` or `/repo/.git/objects/ab/cd`
- **THEN** no callback is fired.

#### Scenario: Unsubscribe stops further callbacks
- **WHEN** the caller invokes the returned `Unsubscribe` function
- **THEN** subsequent FS events for `cwd` do not trigger that callback.

### Requirement: Refcounted watcher reuse
Multiple subscribers on the same `cwd` SHALL share a single underlying watcher. The watcher is closed only when the last subscriber unsubscribes.

#### Scenario: Two subscribers share one watcher
- **WHEN** two callers subscribe to `/repo` sequentially
- **THEN** only one underlying `chokidar.FSWatcher` instance is created; both callbacks receive each event.

#### Scenario: Last unsubscribe closes the watcher
- **WHEN** both subscribers call their `Unsubscribe` functions
- **THEN** the underlying watcher is closed and the `cwd` entry is removed from the service's internal map.

#### Scenario: New subscribe after full unsubscribe creates a fresh watcher
- **WHEN** a cwd has been fully unsubscribed AND a new caller subscribes to the same cwd
- **THEN** a new watcher instance is created.

### Requirement: FakeWatchService for tests
A `FakeWatchService` MUST implement the same interface with a `simulate(cwd, event)` test helper that synchronously fans out to all subscribers for that cwd.

#### Scenario: simulate invokes subscribers
- **WHEN** `fake.simulate('/repo', { event: 'change', path: 'src/foo.ts' })` is called with two subscribers on `/repo`
- **THEN** both callbacks are invoked with the provided event.

#### Scenario: simulate on unsubscribed cwd is a no-op
- **WHEN** `fake.simulate('/nowhere', ...)` is called with no subscribers for `/nowhere`
- **THEN** no callback fires and no error is thrown.

### Requirement: Subscriber errors do not break the service
If a subscriber's callback throws, the service SHALL log the error and continue delivering events to other subscribers.

#### Scenario: One throwing subscriber does not starve others
- **WHEN** subscriber A throws on every event and subscriber B does not
- **THEN** each simulated event still reaches subscriber B.

### Requirement: Graceful handling of platform watch limits
When the underlying watcher reports an OS-level limit error (e.g. Linux `ENOSPC` inotify exhaustion), `WatchService` SHALL log a single descriptive error per process lifetime and continue operating; affected subscriptions remain registered but may receive no events.

#### Scenario: Inotify limit does not crash the process
- **WHEN** `chokidar` emits an `ENOSPC` error on subscribe
- **THEN** the error is caught, a single server log entry is written with the sysctl hint, and no exception propagates to the caller.
