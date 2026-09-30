import assert from 'node:assert/strict';
import test from 'node:test';
import { CrawlRobotsPolicy } from '../src/core/discovery/CrawlRobotsPolicy';
import { WebsiteFetcher, WebsiteHttpError } from '../src/core/discovery/WebsiteFetcher';

test('only an explicitly absent robots file permits a failed robots request', async () => {
  for (const status of [404,410,403,429,500]) {
    class MissingFetcher extends WebsiteFetcher {
      override async fetchResource(): Promise<never> { throw new WebsiteHttpError(status); }
    }
    const policy = new CrawlRobotsPolicy(new MissingFetcher(), {});
    if ([404,410].includes(status)) await policy.check(new URL('https://example.com/'));
    else await assert.rejects(policy.check(new URL('https://example.com/')), /could not verify/);
  }
});
