import { act, render, screen } from '@testing-library/react';

import * as testUtils from '~/utils/testUtils';
import * as dateUtils from '~/utils/date';

import App from '~/app';
import { IntervalMultiplierType, ReviewModes } from '~/models/session';

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

  it('Renders correctly when 1 new card', async () => {
    const mockBuilder = new testUtils.MockDataBuilder();

    mockBuilder.withCard({ uid: 'id_new_1' });
    mockBuilder.mockQueryResults();

    await act(async () => {
      render(<App />);
    });

    // Renders new tag count in sidepanel
    const newTag = screen.queryByTestId('new-tag');
    expect(newTag).toHaveTextContent('1');

    await act(async () => {
      testUtils.actions.launchModal();
    });

    // Renders "New" status badge
    const statusBadge = screen.queryByTestId('status-badge');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveTextContent('New');

    // Renders display count 1/1
    const displayCountCurrent = screen.queryByTestId('display-count-current');
    expect(displayCountCurrent).toBeInTheDocument();
    expect(displayCountCurrent).toHaveTextContent('1');

    const displayCountTotal = screen.queryByTestId('display-count-total');
    expect(displayCountTotal).toBeInTheDocument();
    expect(displayCountTotal).toHaveTextContent('1');
  });

  it("Renders correctly when 1 new card, even when data page doesn't exist yet", async () => {
    const mockBuilder = new testUtils.MockDataBuilder();

    mockBuilder.withCard({ uid: 'id_new_1' });
    mockBuilder.mockQueryResultsWithoutDataPage();

    await act(async () => {
      render(<App />);
    });

    // Renders new tag count in sidepanel
    const newTag = screen.queryByTestId('new-tag');
    expect(newTag).toHaveTextContent('1');

    await act(async () => {
      testUtils.actions.launchModal();
    });

    // Renders "New" status badge
    const statusBadge = screen.queryByTestId('status-badge');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveTextContent('New');

    // Renders display count 1/1
    const displayCountCurrent = screen.queryByTestId('display-count-current');
    expect(displayCountCurrent).toBeInTheDocument();
    expect(displayCountCurrent).toHaveTextContent('1');

    const displayCountTotal = screen.queryByTestId('display-count-total');
    expect(displayCountTotal).toBeInTheDocument();
    expect(displayCountTotal).toHaveTextContent('1');
  });

  it('Entire Flow', async () => {
    const mockBuilder = new testUtils.MockDataBuilder();

    // Add a due card today
    const dueCard1 = 'id_due_1';
    mockBuilder.withCard({ uid: dueCard1 }).withSession(dueCard1, {
      dateCreated: dateUtils.subtractDays(new Date(), 1),
      grade: 5,
      nextDueDate: new Date(),
    });

    // Add a new
    const newCard1 = 'id_new_1';
    mockBuilder.withCard({ uid: newCard1 });

    mockBuilder.mockQueryResults();
    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      testUtils.actions.launchModal();
    });

    // Verify current card is due
    let statusBadge = screen.queryByTestId('status-badge');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveTextContent('Due Today');

    await act(async () => {
      testUtils.actions.clickControlButton('Show Answer');
    });

    // Grade the due card
    let result = await testUtils.grade('Good', mockBuilder);
    expect(result.practiceInput).toMatchObject({
      grade: 4,
      reviewMode: ReviewModes.DefaultSpacedInterval,
      interval: 0,
      repetitions: 0,
      isCramming: false,
      refUid: 'id_due_1',
    });
    expect(result.updatedRecord).toMatchObject({
      reviewMode: ReviewModes.DefaultSpacedInterval,
      dataPageTitle: testUtils.dataPageTitle,
      dateCreated: new Date(),
      eFactor: 2.5,
      grade: 4,
      refUid: 'id_due_1',
      nextDueDate: dateUtils.addDays(new Date(), 1),
    });

    statusBadge = screen.queryByTestId('status-badge');
    expect(statusBadge).toHaveTextContent('New');

    // Grade new card
    await act(async () => {
      testUtils.actions.clickControlButton('Show Answer');
    });
    result = await testUtils.grade('Good', mockBuilder);
    expect(result.practiceInput).toMatchObject({
      grade: 4,
      reviewMode: ReviewModes.DefaultSpacedInterval,
      interval: 0,
      repetitions: 0,
      isCramming: false,
      refUid: 'id_new_1',
    });
    expect(result.updatedRecord).toMatchObject({
      reviewMode: ReviewModes.DefaultSpacedInterval,
      dataPageTitle: testUtils.dataPageTitle,
      dateCreated: new Date(),
      eFactor: 2.5,
      grade: 4,
      refUid: 'id_new_1',
      nextDueDate: dateUtils.addDays(new Date(), 1),
    });

    // Verify completed view
    // Renders display count 0/0
    let displayCountCurrent = screen.queryByTestId('display-count-current');
    expect(displayCountCurrent).toBeInTheDocument();
    expect(displayCountCurrent).toHaveTextContent('0');

    let displayCountTotal = screen.queryByTestId('display-count-total');
    expect(displayCountTotal).toBeInTheDocument();
    expect(displayCountTotal).toHaveTextContent('0');

    let doneState = screen.queryByTestId('practice-overlay-done-state');
    expect(doneState).toBeInTheDocument();

    // Continue Cramming Mode
    await act(async () => {
      testUtils.actions.clickControlButton('Continue Cramming');
    });

    statusBadge = screen.queryByTestId('status-badge');
    expect(statusBadge).toHaveTextContent('Cramming');

    // Verify count
    displayCountCurrent = screen.queryByTestId('display-count-current');
    expect(displayCountCurrent).toBeInTheDocument();
    expect(displayCountCurrent).toHaveTextContent('1');

    displayCountTotal = screen.queryByTestId('display-count-total');
    expect(displayCountTotal).toBeInTheDocument();
    expect(displayCountTotal).toHaveTextContent('2');

    // Skip till end
    await act(async () => {
      testUtils.actions.clickControlButton('Show Answer');
    });
    await act(async () => {
      testUtils.actions.clickControlButton('Skip');
    });
    await act(async () => {
      testUtils.actions.clickControlButton('Show Answer');
    });
    await act(async () => {
      testUtils.actions.clickControlButton('Skip');
    });

    // Verify completed view
    // Renders display count 0/0
    displayCountCurrent = screen.queryByTestId('display-count-current');
    expect(displayCountCurrent).toBeInTheDocument();
    expect(displayCountCurrent).toHaveTextContent('0');

    displayCountTotal = screen.queryByTestId('display-count-total');
    expect(displayCountTotal).toBeInTheDocument();
    expect(displayCountTotal).toHaveTextContent('0');

    doneState = screen.queryByTestId('practice-overlay-done-state');
    expect(doneState).toBeInTheDocument();
  });

  it('Grading works correctly when switching review modes', async () => {
    const mockBuilder = new testUtils.MockDataBuilder();

    // Add a due card today
    const dueCard1 = 'id_due_1';
    mockBuilder.withCard({ uid: dueCard1 }).withSession(dueCard1, {
      dateCreated: dateUtils.subtractDays(new Date(), 1),
      nextDueDate: new Date(),
    });

    // Add a new
    const newCard1 = 'id_new_1';
    mockBuilder.withCard({ uid: newCard1 });

    mockBuilder.mockQueryResults();
    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      testUtils.actions.launchModal();
    });

    await act(async () => {
      testUtils.actions.clickControlButton('Show Answer');
    });

    // Switch to fixed interval mode (do it 3 times to very switching back and forth works)
    await act(async () => {
      testUtils.actions.clickSwitchReviewModeButton();
    });
    await act(async () => {
      testUtils.actions.clickSwitchReviewModeButton();
    });
    await act(async () => {
      testUtils.actions.clickSwitchReviewModeButton();
    });

    // Grade the card
    const result = await testUtils.grade('Next', mockBuilder);
    expect(result.updatedRecord).toMatchObject({
      reviewMode: ReviewModes.FixedInterval,
      dataPageTitle: testUtils.dataPageTitle,
      dateCreated: new Date(),
      refUid: 'id_due_1',
      intervalMultiplier: 3,
      intervalMultiplierType: IntervalMultiplierType.Days,
      nextDueDate: dateUtils.addDays(new Date(), 3),
    });

    // Next card should be new
    const statusBadge = screen.queryByTestId('status-badge');
    expect(statusBadge).toHaveTextContent('New');
  });

  it('Grading works correctly when switching review modes starting with fixed', async () => {
    const mockBuilder = new testUtils.MockDataBuilder();

    // Add a due card today
    const dueCard1 = 'id_due_1';
    mockBuilder.withCard({ uid: dueCard1 }).withSession(dueCard1, {
      reviewMode: ReviewModes.FixedInterval,
      grade: 1,
      dateCreated: dateUtils.subtractDays(new Date(), 1),
      nextDueDate: new Date(),
    });

    mockBuilder.mockQueryResults();
    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      testUtils.actions.launchModal();
    });

    await act(async () => {
      testUtils.actions.clickControlButton('Show Answer');
    });

    // Switch to spaced interval mode
    await act(async () => {
      testUtils.actions.clickSwitchReviewModeButton();
    });

    // Grade the card
    const result = await testUtils.grade('Perfect', mockBuilder);
    expect(result.updatedRecord).toMatchObject({
      reviewMode: ReviewModes.DefaultSpacedInterval,
      dataPageTitle: testUtils.dataPageTitle,
      dateCreated: new Date(),
      refUid: 'id_due_1',
      nextDueDate: dateUtils.addDays(new Date(), 1),
    });
  });
});
