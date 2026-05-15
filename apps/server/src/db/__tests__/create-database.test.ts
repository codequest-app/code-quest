import { mysqlSchema, sqliteSchema } from '@code-quest/db-schema';
import { describe, expect, it } from 'vitest';
import { createDatabaseFromUrl, parseDatabaseType } from '../create-database.ts';

describe('parseDatabaseType', () => {
  it('detects mysql from mysql:// URL', () => {
    expect(parseDatabaseType('mysql://root@127.0.0.1:3306/db')).toBe('mysql');
  });

  it('detects mysql from mysql2:// URL', () => {
    expect(parseDatabaseType('mysql2://root@127.0.0.1:3306/db')).toBe('mysql');
  });

  it('detects sqlite from file: URL', () => {
    expect(parseDatabaseType('file:./data/code-quest.db')).toBe('sqlite');
  });

  it('detects sqlite from file::memory:', () => {
    expect(parseDatabaseType('file::memory:')).toBe('sqlite');
  });

  it('detects sqlite from bare path', () => {
    expect(parseDatabaseType('./data/code-quest.db')).toBe('sqlite');
  });

  it('unknown protocol throws', () => {
    expect(() => parseDatabaseType('postgres://user@localhost/db')).toThrow('Unsupported');
  });
});

describe('createDatabaseFromUrl', () => {
  it('returns sqlite entry with url, type, db, schema', () => {
    const result = createDatabaseFromUrl('file::memory:');
    expect(result.type).toBe('sqlite');
    expect(result.url).toBe('file::memory:');
    expect(result.schema).toBe(sqliteSchema);
    expect(result.db).toBeDefined();
  });

  it('returns mysql entry with url, type, db, schema', () => {
    const result = createDatabaseFromUrl('mysql://root@127.0.0.1:3306/code_quest');
    expect(result.type).toBe('mysql');
    expect(result.url).toBe('mysql://root@127.0.0.1:3306/code_quest');
    expect(result.schema).toBe(mysqlSchema);
    expect(result.db).toBeDefined();
  });

  it('throws for unsupported protocol', () => {
    expect(() => createDatabaseFromUrl('redis://localhost')).toThrow('Unsupported');
  });
});
