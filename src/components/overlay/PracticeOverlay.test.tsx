import { act, render } from '@testing-library/react';

import * as testUtils from '~/utils/testUtils';

import App from '~/app';

describe('PracticeOverlay', () => {
  it("renders done state when there's no practice data", async () => {
    new testUtils.MockDataBuilder().mockQueryResults();
    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      testUtils.actions.launchModal();
    });

    const practiceOverlayDoneState = document.querySelector<HTMLDivElement>(
      '[data-testid="practice-overlay-done-state"]'
    );
    expect(practiceOverlayDoneState).toBeInTheDocument();
  });
});
