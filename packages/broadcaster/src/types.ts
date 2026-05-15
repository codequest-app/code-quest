export type Unsubscribe = () => void;

export interface DataSource<T> {
  read(): Promise<T>;
  onChange(cb: () => void): Unsubscribe;
  dispose?(): void;
}
