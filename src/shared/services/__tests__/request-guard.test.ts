import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  RequestFloodError,
  guardRequest,
  resetRequestGuard,
} from '../request-guard';

/**
 * The last line of defence against a runaway effect.
 *
 * Written after a real incident: a dependency-churn loop on the Ask screen
 * fired thousands of requests in seconds. The specific bug is fixed, but this
 * is what stops the NEXT one, so its behaviour is pinned precisely — both that
 * it trips on a flood and, just as importantly, that it does not trip on
 * anything a real person or a legitimate poller does.
 */
describe('guardRequest', () => {
  beforeEach(() => { resetRequestGuard(); });

  it('allows ordinary traffic', () => {
    // Ten calls is a fast tapper, not a loop.
    for (let i = 0; i < 10; i += 1) guardRequest('/api/v1/decide');
    assert.doesNotThrow(() => { guardRequest('/api/v1/decide'); });
  });

  it('trips once an endpoint is clearly looping', () => {
    assert.throws(
      () => {
        for (let i = 0; i < 60; i += 1) guardRequest('/api/v1/decide');
      },
      RequestFloodError,
    );
  });

  it('keeps refusing while it is cut off', () => {
    try {
      for (let i = 0; i < 60; i += 1) guardRequest('/api/v1/decide');
    } catch {
      // Expected.
    }
    // A loop does not stop just because one call failed — the breaker has to
    // stay open, or it simply throttles the flood rather than ending it.
    assert.throws(() => { guardRequest('/api/v1/decide'); }, RequestFloodError);
  });

  it('cuts off only the endpoint that ran away', () => {
    try {
      for (let i = 0; i < 60; i += 1) guardRequest('/api/v1/decide');
    } catch {
      // Expected.
    }
    // One chatty screen must not break the rest of the app.
    assert.doesNotThrow(() => { guardRequest('/api/v1/meals'); });
  });

  it('treats one endpoint with different ids as the same endpoint', () => {
    // A loop that creates a new session every pass would otherwise look like a
    // thousand distinct paths and slip straight through.
    assert.throws(
      () => {
        for (let i = 0; i < 60; i += 1) {
          guardRequest(`/api/v1/ask/sessions/asks_0${String(i)}abc/turns`);
        }
      },
      RequestFloodError,
    );
  });

  it('names the endpoint it cut off', () => {
    try {
      for (let i = 0; i < 60; i += 1) guardRequest('/api/v1/decide');
      assert.fail('should have tripped');
    } catch (error) {
      assert.ok(error instanceof RequestFloodError);
      assert.match(error.endpoint, /decide/);
    }
  });

  it('ignores the query string when grouping', () => {
    assert.throws(
      () => {
        for (let i = 0; i < 60; i += 1) guardRequest(`/api/v1/meals?page=${String(i)}`);
      },
      RequestFloodError,
    );
  });
});
