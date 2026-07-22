import { describe, it, expect } from 'vitest';
import { computeWorkStatus } from '../src/lib/workStatus.js';

const base = { cadDone: false, cadConfirm: false, cadSent: false, photo: false, video: false };

describe('computeWorkStatus', () => {
  it('is PENDING_CAD when nothing is done', () => {
    expect(computeWorkStatus(base)).toBe('PENDING_CAD');
  });

  it('advances one stage at a time, in strict pipeline order', () => {
    expect(computeWorkStatus({ ...base, cadDone: true })).toBe('PENDING_CAD_CONFIRMATION');
    expect(computeWorkStatus({ ...base, cadDone: true, cadConfirm: true })).toBe('PENDING_CAD_SENT');
    expect(computeWorkStatus({ ...base, cadDone: true, cadConfirm: true, cadSent: true })).toBe(
      'PENDING_PHOTO_RENDER'
    );
    expect(
      computeWorkStatus({ ...base, cadDone: true, cadConfirm: true, cadSent: true, photo: true })
    ).toBe('PENDING_VIDEO_RENDER');
  });

  it('is COMPLETED only when all five flags are true', () => {
    expect(
      computeWorkStatus({ cadDone: true, cadConfirm: true, cadSent: true, photo: true, video: true })
    ).toBe('COMPLETED');
  });

  it('ignores out-of-order flags and reports the earliest unmet stage', () => {
    // photo and video ticked but cadConfirm never was — should still report
    // the earliest gap, not be fooled by later stages being marked done.
    expect(
      computeWorkStatus({ cadDone: true, cadConfirm: false, cadSent: true, photo: true, video: true })
    ).toBe('PENDING_CAD_CONFIRMATION');
  });
});
