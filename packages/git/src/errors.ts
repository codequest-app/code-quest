export class NotARepoError extends Error {
  constructor(path: string) {
    super(`Not a git repository: ${path}`);
    this.name = 'NotARepoError';
  }
}

export class AlreadyRepoError extends Error {
  constructor(path: string) {
    super(`Already a git repository: ${path}`);
    this.name = 'AlreadyRepoError';
  }
}
