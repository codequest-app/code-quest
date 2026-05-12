## ADDED Requirements

### Requirement: Symlink escape detection in LocalRootGuard

`LocalRootGuard` SHALL detect when a path resolves through a symlink to a location outside fsRoots.

#### Scenario: path with no symlinks inside roots
- **WHEN** `isWithinRoots` is called with a real path inside a root
- **THEN** it returns true

#### Scenario: symlink inside root pointing outside
- **WHEN** a symlink exists inside fsRoots but its target is outside fsRoots
- **AND** `isWithinRoots` is called with that symlink path
- **THEN** it returns false (denied)

#### Scenario: path outside roots without symlinks
- **WHEN** `isWithinRoots` is called with a path outside all roots
- **THEN** it returns false

#### Scenario: realpath fails (path does not exist)
- **WHEN** `realpath()` throws because the path does not exist
- **THEN** the path is treated as outside roots (deny by default)
