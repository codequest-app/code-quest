## MODIFIED Requirements

### Requirement: ClaudeAdapter implements ProviderAdapter
`ClaudeAdapter` SHALL implement the `ProviderAdapter<ProtocolMessage, LaunchOptions>` interface. All public method signatures and return types SHALL remain unchanged. The class SHALL delegate protocol serialization to `ClaudeProtocol`, message transformation to the `transforms/` modules (including the new `notification.ts` and `auth.ts`), and request mapping to `request-mappings.ts`.

#### Scenario: ClaudeAdapter public API is unchanged after refactoring
- **WHEN** a caller invokes any public method on `ClaudeAdapter` (parseLine, transform, buildArgs, formatMessage, formatRequest, formatControlRequest, formatControlResponse, mapResponse, extractRespondedRequestIds)
- **THEN** the return value is identical to before the refactoring
