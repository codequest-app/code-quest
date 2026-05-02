import { createFakeServer } from '@code-quest/server/test';
import {
  type FakeSocket,
  type ServerConnector,
  FakeSummoner as SummonerFakeSummoner,
} from '@code-quest/summoner/test';
import type { TypedSocket } from '../socket/client.ts';

export class FakeSummoner extends SummonerFakeSummoner {
  override get socket(): FakeSocket & TypedSocket {
    return super.socket as FakeSocket & TypedSocket;
  }
}

export function createFakeSummoner(server?: ServerConnector): FakeSummoner {
  const s = server ?? createFakeServer();
  return new FakeSummoner(s);
}
