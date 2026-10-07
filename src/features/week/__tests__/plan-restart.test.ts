import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { clearDraft, emptyDraft, readDraft, writeDraft } from '../services/plan-draft';

/**
 * Starting the flow again.
 *
 * TWO BUGS THIS PROTECTS AGAINST, both reported from a real session:
 *
 * 1. "after clicking start again icon on the plan preview page, it should
 *    clear off the state, and just take me to ingredient screen, and it should
 *    reset". It went to CONFIGURE with every previous answer still filled in,
 *    so the one control labelled "start again" started nothing.
 *
 * 2. "clicking 'plan your week' should always take me to the ingredients
 *    selection screen". `/timetable` sent anybody who already had a plan
 *    straight to the finished plan, so the entry point behaved differently
 *    depending on history the person could not see.
 *
 * Both now land on the kitchen screen. The reset is what makes the first one
 * a real restart, and these tests pin what "reset" has to mean: the picks go,
 * the configure answers go back to the defaults, and `kitchenConfirmed` goes
 * false so the kitchen screen seeds again instead of showing an empty list.
 */

function fakeStorage(): Storage {
  const map = new Map<string, string>();

  return {
    get length() {
      return map.size;
    },
    clear: () => {
      map.clear();
    },
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

/** A draft mid-way through a run, as "start again" would find it. */
function usedDraft(): ReturnType<typeof emptyDraft> {
  return {
    ...emptyDraft(),
    kitchen: ['Rice', 'Beans', 'Tomatoes', 'Onions'],
    kitchenConfirmed: true,
    days: 14,
    household: 6,
    city: 'Ibadan',
    repeats: 'never',
    budgetNgn: 30000,
    effortMinutes: 20,
    slots: ['breakfast', 'lunch', 'dinner'],
  };
}

beforeEach(() => {
  globalThis.window = { localStorage: fakeStorage() } as unknown as Window & typeof globalThis;
});

describe('start again resets the whole run', () => {
  it('drops the ingredients that were picked', () => {
    writeDraft(usedDraft());
    clearDraft();

    assert.deepEqual(readDraft().kitchen, []);
  });

  it('puts every configure answer back to its default', () => {
    writeDraft(usedDraft());
    clearDraft();

    // Compared against the defaults wholesale rather than field by field, so
    // a field added later cannot quietly survive a reset.
    assert.deepEqual(readDraft(), emptyDraft());
  });

  /**
   * The one that makes a restart usable rather than punishing.
   *
   * `kitchenConfirmed` back to false is what lets the kitchen screen seed from
   * their stock, or from the kitchen their last plan was built against. Left
   * true, somebody who started again would face an empty screen and have to
   * tick everything from scratch — which is the opposite of the intent.
   */
  it('clears the confirmed flag so the kitchen screen seeds again', () => {
    writeDraft(usedDraft());
    assert.equal(readDraft().kitchenConfirmed, true, 'precondition: the run was under way');

    clearDraft();
    assert.equal(readDraft().kitchenConfirmed, false);
  });

  it('is safe to call when there is nothing to clear', () => {
    assert.doesNotThrow(() => {
      clearDraft();
    });
    assert.deepEqual(readDraft(), emptyDraft());
  });

  /**
   * Edit is NOT start again, and the difference is the whole point of having
   * two controls. Edit keeps the draft so changing the household from four to
   * six does not cost somebody their kitchen.
   */
  it('leaves the draft alone when it is not called', () => {
    const draft = usedDraft();
    writeDraft(draft);

    assert.deepEqual(readDraft(), draft, 'Edit must not reset anything');
  });
});
