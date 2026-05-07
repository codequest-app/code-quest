export interface PipelineContext {
  terminate?(): Promise<void>;
  [key: string]: unknown;
}

type TerminateFactory = () => Promise<void>;

export type PipelineMiddleware = (
  context: PipelineContext,
  next: () => Promise<void>,
) => void | Promise<void>;

const NOOP_TERMINATE: TerminateFactory = () => Promise.resolve();

export class Pipeline {
  private readonly middleware: PipelineMiddleware[];

  constructor(middleware: PipelineMiddleware[]) {
    this.middleware = middleware;
  }

  async run(
    context: PipelineContext,
    core: () => Promise<void>,
    terminateFactory?: TerminateFactory,
  ): Promise<void> {
    const factory = terminateFactory ?? NOOP_TERMINATE;
    context.terminate = factory;

    const dispatch = (index: number): Promise<void> => {
      const mw = this.middleware.at(index);
      if (!mw) return core();
      const next = (): Promise<void> => dispatch(index + 1);

      const result = mw(context, next);
      return result instanceof Promise ? result : Promise.resolve();
    };

    return dispatch(0);
  }
}
