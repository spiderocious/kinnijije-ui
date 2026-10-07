import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { RESOURCES, WORKFLOW_APPROVE, satisfies } from '../permissions';

/**
 * This file is a COURTESY COPY of the backend's scope list, and the copy had
 * already drifted once — `workflows` and `matching` were added on the server
 * while this list still had thirteen resources, so the console could not name
 * a scope the server was enforcing.
 *
 * Nothing here is a security control; authorisation happens server-side on
 * every route. What drift costs is a console that hides something the server
 * would have allowed, or offers something it will refuse. So the lists are
 * compared against the backend source directly rather than by eye.
 */
const BACKEND_PERMISSIONS = '../backend/src/shared/constants/permissions.ts';

describe('scope list mirrors the backend', () => {
  it('has every resource the backend defines', () => {
    const source = readFileSync(BACKEND_PERMISSIONS, 'utf8');

    // The RESOURCES array, read as text: importing across workspaces would
    // mean building the backend to test the frontend.
    const block = /export const RESOURCES = \[([\s\S]*?)\] as const;/.exec(source)?.[1];
    assert.ok(block !== undefined, 'could not find RESOURCES in the backend source');

    const backendResources = [...block.matchAll(/'([a-z]+)'/g)].map((match) => match[1]);

    assert.deepEqual(
      [...RESOURCES].sort(),
      backendResources.slice().sort(),
      'the console scope list has drifted from the backend',
    );
  });

  it('spells the approval scope exactly as the backend does', () => {
    const source = readFileSync(BACKEND_PERMISSIONS, 'utf8');
    const backendValue = /export const WORKFLOW_APPROVE = '([^']+)'/.exec(source)?.[1];

    assert.equal(WORKFLOW_APPROVE, backendValue);
  });
});

describe('satisfies', () => {
  it('implies read from write and delete', () => {
    assert.equal(satisfies(['recipes:write'], 'recipes:read'), true);
    assert.equal(satisfies(['recipes:delete'], 'recipes:read'), true);
    assert.equal(satisfies(['recipes:delete'], 'recipes:write'), true);
  });

  it('does not imply across resources', () => {
    assert.equal(satisfies(['recipes:delete'], 'users:read'), false);
  });

  /**
   * The rule that matters most here. If `workflows:delete` implied the power
   * to approve, the second pair of eyes would belong to whoever already held
   * the first — which is the one thing a separate approval scope exists to
   * prevent. Asserted on both sides so a "tidy up" has to fail a test.
   */
  it('never implies the approval scope', () => {
    assert.equal(satisfies(['workflows:delete'], WORKFLOW_APPROVE), false);
    assert.equal(satisfies(['workflows:write'], WORKFLOW_APPROVE), false);
    assert.equal(satisfies(['workflows:read'], WORKFLOW_APPROVE), false);
  });

  it('grants the approval scope when it is held outright', () => {
    assert.equal(satisfies([WORKFLOW_APPROVE], WORKFLOW_APPROVE), true);
  });
});
