# services/

Client-side API service layer — typed wrappers around fetch calls to
src/app/api/** routes, built on the shared contracts in
@ramesh/api-contracts. UI components should call services, never fetch()
directly.
