import { describe, expect, it } from 'vitest';
import { Container, Token } from '../container.ts';

interface FakeService {
  name: string;
}

const FakeToken = new Token<FakeService>('FakeService');
const OtherToken = new Token<number>('Other');

describe('Token', () => {
  it('has unique symbols per instance', () => {
    const a = new Token('X');
    const b = new Token('X');
    expect(a.symbol).not.toBe(b.symbol);
  });

  it('exposes name', () => {
    expect(FakeToken.name).toBe('FakeService');
  });
});

describe('Container', () => {
  it('returns bound value', () => {
    const container = new Container();
    const service: FakeService = { name: 'hello' };
    container.bind(FakeToken, service);
    expect(container.get(FakeToken)).toBe(service);
  });

  it('bind is chainable', () => {
    const container = new Container().bind(FakeToken, { name: 'a' }).bind(OtherToken, 42);
    expect(container.get(OtherToken)).toBe(42);
  });

  it('throws when token not bound', () => {
    const container = new Container();
    expect(() => container.get(FakeToken)).toThrow('FakeService');
  });

  it('later bind overwrites earlier bind', () => {
    const container = new Container()
      .bind(FakeToken, { name: 'first' })
      .bind(FakeToken, { name: 'second' });
    expect(container.get(FakeToken).name).toBe('second');
  });
});
