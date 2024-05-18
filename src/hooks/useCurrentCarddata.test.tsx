import { act, renderHook } from '@testing-library/react-hooks';
import useCurrentCardData from './useCurrentCardData';
import { generateNewSession } from '~/queries';
import { NewSession, ReviewModes, Session } from '~/models/session';
import * as testUtils from '~/utils/testUtils';
import { TestSessionsResponse } from '~/utils/testUtils';
import React from 'react';

describe('useCurrentCardData', () => {
  const dataPageTitle = 'roam/memo';
  const originalLocation = window;

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: originalLocation,
    });
  });

  it('should return current card when review mode unchanged', async () => {
    const currentCardRefUid = 'id_0';
    const currentCardData = generateNewSession({ isNew: false });
    const practiceData = {
      [currentCardRefUid]: currentCardData,
    };

    const { result } = renderHook(() =>
      useCurrentCardData({ practiceData, dataPageTitle, currentCardRefUid })
    );

    expect(result.current.currentCardData).toEqual(currentCardData);
  });

  it('returns undefined when currentCardRefUid is undefined (on complete)', () => {
    const currentCardRefUid = undefined;
    const practiceData = {};

    const { result } = renderHook(() =>
      useCurrentCardData({ practiceData, dataPageTitle, currentCardRefUid })
    );

    expect(result.current.currentCardData).toEqual(undefined);
  });

  it('returns undefined when currentCardRefUid becomes undefined (on complete)', async () => {
    const { result } = renderHook(() => {
      const [currentCardRefUid, setCurrentCardRefUid] = React.useState('id_0');
      const currentCardData = generateNewSession({ isNew: false });
      const practiceData = {
        ['id_0']: currentCardData,
      };
      const { currentCardData: currentCardDataResult } = useCurrentCardData({
        practiceData,
        dataPageTitle,
        currentCardRefUid,
      });

      return {
        currentCardData: currentCardDataResult,
        setCurrentCardRefUid,
      };
    });

    act(() => {
      result.current.setCurrentCardRefUid(undefined);
    });

    expect(result.current.currentCardData).toEqual(undefined);
  });

  describe('When review mode changed', () => {
    it('Return new session when no matching one exists', async () => {
      const currentCardRefUid = 'id_0';
      const currentCardData = generateNewSession({ isNew: false });
      const practiceData = {
        [currentCardRefUid]: currentCardData,
      };

      const TestSessionsData = new TestSessionsResponse({ uid: currentCardRefUid })
        .withSession({
          reviewMode: ReviewModes.DefaultSpacedInterval,
        })
        .build();

      testUtils.mockQueryResult(TestSessionsData);
      const { result, waitForNextUpdate } = renderHook(() =>
        useCurrentCardData({ practiceData, dataPageTitle, currentCardRefUid })
      );

      act(() => {
        result.current.setReviewMode(ReviewModes.FixedInterval);
      });

      await waitForNextUpdate();
      const resultData = result.current.currentCardData as NewSession;
      expect(resultData.reviewMode).toEqual(ReviewModes.FixedInterval);
      expect(resultData.isNew).toBe(true);
    });

    it('Returns first matching existing session when available', async () => {
      const currentCardRefUid = 'id_0';
      const currentCardData = generateNewSession({ isNew: false });
      const practiceData = {
        [currentCardRefUid]: currentCardData,
      };

      const TestSessionsData = new TestSessionsResponse({ uid: currentCardRefUid })
        .withSession({
          reviewMode: ReviewModes.DefaultSpacedInterval,
        })
        .withSession({
          reviewMode: ReviewModes.FixedInterval,
          grade: 1,
        })
        .withSession({
          reviewMode: ReviewModes.FixedInterval,
          grade: 2,
        })
        .build();

      testUtils.mockQueryResult(TestSessionsData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useCurrentCardData({ practiceData, dataPageTitle, currentCardRefUid })
      );

      act(() => {
        result.current.setReviewMode(ReviewModes.FixedInterval);
      });

      await waitForNextUpdate();

      const resultData = result.current.currentCardData as Session;
      expect(resultData.reviewMode).toEqual(ReviewModes.FixedInterval);
      expect(resultData.grade).toEqual(1);
      expect((resultData as NewSession).isNew).toBe(false);
    });

    it('Can switch back to original card', async () => {
      const currentCardRefUid = 'id_0';
      const originalCurrentCardData = generateNewSession({ isNew: false });
      const practiceData = {
        [currentCardRefUid]: originalCurrentCardData,
      };

      const TestSessionsData = new TestSessionsResponse({ uid: currentCardRefUid })
        .withSession({
          reviewMode: ReviewModes.DefaultSpacedInterval,
        })
        .withSession({
          reviewMode: ReviewModes.FixedInterval,
        })
        .build();

      testUtils.mockQueryResult(TestSessionsData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useCurrentCardData({ practiceData, dataPageTitle, currentCardRefUid })
      );

      act(() => {
        result.current.setReviewMode(ReviewModes.FixedInterval);
      });

      await waitForNextUpdate();

      let resultData = result.current.currentCardData as Session;
      expect(resultData.reviewMode).toEqual(ReviewModes.FixedInterval);
      expect((resultData as NewSession).isNew).toBe(false);

      act(() => {
        result.current.setReviewMode(ReviewModes.DefaultSpacedInterval);
      });

      resultData = result.current.currentCardData;
      expect(window.roamAlphaAPI.q).toBeCalledTimes(1);
      expect(resultData).toEqual(originalCurrentCardData);
    });

    it('Updates state when switching to next cards', async () => {
      const currentCardRefUid_0 = 'id_0';
      const originalCurrentCardData_0 = generateNewSession({ isNew: false });
      const currentCardRefUid_1 = 'id_1';
      const originalCurrentCardData_1 = generateNewSession({
        isNew: false,
        reviewMode: ReviewModes.FixedInterval,
      });
      const practiceData = {
        [currentCardRefUid_0]: originalCurrentCardData_0,
        [currentCardRefUid_1]: originalCurrentCardData_1,
      };

      const { result } = renderHook(() => {
        const [currentCardRefUid, setCurrentCardRefUid] = React.useState(currentCardRefUid_0);
        const { reviewMode, setReviewMode, currentCardData } = useCurrentCardData({
          practiceData,
          dataPageTitle,
          currentCardRefUid: currentCardRefUid,
        });

        return {
          reviewMode,
          setReviewMode,
          currentCardData,
          currentCardRefUid,
          setCurrentCardRefUid,
        };
      });

      act(() => {
        // Switch to next card
        result.current.setCurrentCardRefUid(currentCardRefUid_1);
      });

      expect(result.current.currentCardData).toEqual(originalCurrentCardData_1);
      expect(result.current.reviewMode).toEqual(originalCurrentCardData_1.reviewMode);
    });

    it('Updates state when switching to next card after first switching review mode', async () => {
      const originalCurrentCardRefUid = 'id_0';
      const originalCurrentCardData = generateNewSession({ isNew: false });
      const nextCardRefUid = 'id_1';
      const nextCardData = generateNewSession({
        isNew: false,
        reviewMode: ReviewModes.FixedInterval,
      });
      const practiceData = {
        [originalCurrentCardRefUid]: originalCurrentCardData,
        [nextCardRefUid]: nextCardData,
      };

      const TestSessionsData = new TestSessionsResponse({ uid: originalCurrentCardRefUid })
        .withSession({
          reviewMode: ReviewModes.DefaultSpacedInterval,
        })
        .withSession({
          reviewMode: ReviewModes.FixedInterval,
        })
        .build();

      testUtils.mockQueryResult(TestSessionsData);

      const { result, waitForNextUpdate } = renderHook(() => {
        const [currentCardRefUid, setCurrentCardRefUid] = React.useState(originalCurrentCardRefUid);
        const { reviewMode, setReviewMode, currentCardData } = useCurrentCardData({
          practiceData,
          dataPageTitle,
          currentCardRefUid: currentCardRefUid,
        });

        return {
          reviewMode,
          setReviewMode,
          currentCardData,
          currentCardRefUid,
          setCurrentCardRefUid,
        };
      });

      act(() => {
        // Switch to fixed
        result.current.setReviewMode(ReviewModes.FixedInterval);
      });

      await waitForNextUpdate();

      const resultData = result.current.currentCardData as Session;
      expect(resultData.reviewMode).toEqual(ReviewModes.FixedInterval);
      expect((resultData as NewSession).isNew).toBe(false);

      act(() => {
        // Switch back
        result.current.setReviewMode(ReviewModes.DefaultSpacedInterval);
      });

      expect(window.roamAlphaAPI.q).toBeCalledTimes(1);
      expect(result.current.currentCardData).toEqual(originalCurrentCardData);

      act(() => {
        // Switch to next card
        result.current.setCurrentCardRefUid(nextCardRefUid);
      });

      expect(result.current.currentCardData).toEqual(nextCardData);
    });
  });
});
