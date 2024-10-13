import { act, renderHook } from '@testing-library/react-hooks';
import useCurrentCardData from './useCurrentCardData';
import { generateNewSession } from '~/queries';
import { NewSession, ReviewModes, Session } from '~/models/session';
import * as testUtils from '~/utils/testUtils';
import React from 'react';

describe('useCurrentCardData', () => {
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
      [currentCardRefUid]: [currentCardData],
    };

    const { result } = renderHook(() =>
      useCurrentCardData({ sessions: practiceData[currentCardRefUid], currentCardRefUid })
    );

    expect(result.current.currentCardData).toEqual(currentCardData);
  });

  it('returns undefined when currentCardRefUid is undefined (on complete)', () => {
    const currentCardRefUid = undefined;
    const practiceData = {};

    const { result } = renderHook(() =>
      useCurrentCardData({
        sessions: currentCardRefUid ? practiceData[currentCardRefUid] : [],
        currentCardRefUid,
      })
    );

    expect(result.current.currentCardData).toEqual(undefined);
  });

  it('returns undefined when currentCardRefUid becomes undefined (on complete)', async () => {
    const { result } = renderHook(() => {
      const [currentCardRefUid, setCurrentCardRefUid] = React.useState<string | undefined>('id_0');
      const currentCardData = generateNewSession({ isNew: false });
      const practiceData = {
        ['id_0']: [currentCardData],
      };
      const { currentCardData: currentCardDataResult } = useCurrentCardData({
        sessions: currentCardRefUid ? practiceData[currentCardRefUid] : [],
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
      const mockBuilder = new testUtils.MockDataBuilder()
        .withCard({ uid: currentCardRefUid })
        .withSession(currentCardRefUid, {
          reviewMode: ReviewModes.DefaultSpacedInterval,
        });

      mockBuilder.mockQueryResults();
      const { practiceData } = await mockBuilder.getPracticeData();
      const { result } = renderHook(() =>
        useCurrentCardData({ sessions: practiceData[currentCardRefUid], currentCardRefUid })
      );

      act(() => {
        result.current.setReviewModeOverride(ReviewModes.FixedInterval);
      });

      const resultData = result.current.currentCardData as NewSession;
      expect(resultData.reviewMode).toEqual(ReviewModes.FixedInterval);
      expect(resultData.isNew).toBe(true);
    });

    it('Returns first matching existing session when available', async () => {
      const currentCardRefUid = 'id_0';

      const mockBuilder = new testUtils.MockDataBuilder()
        .withCard({ uid: currentCardRefUid })
        .withSession(currentCardRefUid, {
          reviewMode: ReviewModes.FixedInterval,
          grade: 1,
        })
        .withSession(currentCardRefUid, {
          reviewMode: ReviewModes.FixedInterval,
          grade: 2,
        })
        .withSession(currentCardRefUid, {
          reviewMode: ReviewModes.DefaultSpacedInterval,
        });

      mockBuilder.mockQueryResults();
      const { practiceData } = await mockBuilder.getPracticeData();
      const { result } = renderHook(() =>
        useCurrentCardData({ sessions: practiceData[currentCardRefUid], currentCardRefUid })
      );

      act(() => {
        result.current.setReviewModeOverride(ReviewModes.FixedInterval);
      });

      const resultData = result.current.currentCardData as Session;
      expect(resultData.reviewMode).toEqual(ReviewModes.FixedInterval);
      expect(resultData.grade).toEqual(2);
      expect((resultData as NewSession).isNew).toBe(false);
    });

    it('Can switch back to original card', async () => {
      const currentCardRefUid = 'id_0';

      const mockBuilder = new testUtils.MockDataBuilder()
        .withCard({ uid: currentCardRefUid })
        .withSession(currentCardRefUid, {
          reviewMode: ReviewModes.DefaultSpacedInterval,
          grade: 2,
        })
        .withSession(currentCardRefUid, {
          reviewMode: ReviewModes.FixedInterval,
          grade: 1,
        });

      mockBuilder.mockQueryResults();
      const { practiceData } = await mockBuilder.getPracticeData();

      const { result } = renderHook(() =>
        useCurrentCardData({ sessions: practiceData[currentCardRefUid], currentCardRefUid })
      );

      act(() => {
        result.current.setReviewModeOverride(ReviewModes.DefaultSpacedInterval);
      });

      let resultData = result.current.currentCardData as Session | undefined;
      expect(resultData?.reviewMode).toEqual(ReviewModes.DefaultSpacedInterval);
      expect(resultData).toMatchObject({
        reviewMode: ReviewModes.DefaultSpacedInterval,
        grade: 2,
        isNew: false,
      });

      act(() => {
        result.current.setReviewModeOverride(ReviewModes.FixedInterval);
      });

      resultData = result.current.currentCardData;
      expect(resultData?.reviewMode).toEqual(ReviewModes.FixedInterval);
      expect(resultData).toMatchObject({
        reviewMode: ReviewModes.FixedInterval,
        grade: 1,
      });

      act(() => {
        result.current.setReviewModeOverride(ReviewModes.DefaultSpacedInterval);
      });

      resultData = result.current.currentCardData as Session;
      expect(resultData.reviewMode).toEqual(ReviewModes.DefaultSpacedInterval);
      expect(resultData).toMatchObject({
        reviewMode: ReviewModes.DefaultSpacedInterval,
        grade: 2,
        isNew: false,
      });
    });

    it('Updates state when switching to next cards', async () => {
      const currentCardRefUid_0 = 'id_0';
      const currentCardRefUid_1 = 'id_1';
      const mockBuilder = new testUtils.MockDataBuilder()
        .withCard({ uid: currentCardRefUid_0 })
        .withSession(currentCardRefUid_0, {
          reviewMode: ReviewModes.DefaultSpacedInterval,
        })
        .withCard({ uid: currentCardRefUid_1 })
        .withSession(currentCardRefUid_1, {
          grade: 2,
          reviewMode: ReviewModes.FixedInterval,
        });

      mockBuilder.mockQueryResults();
      const { practiceData } = await mockBuilder.getPracticeData();
      const { result } = renderHook(() => {
        const [currentCardRefUid, setCurrentCardRefUid] = React.useState(currentCardRefUid_0);
        const { reviewMode, setReviewModeOverride, currentCardData } = useCurrentCardData({
          sessions: practiceData[currentCardRefUid],
          currentCardRefUid: currentCardRefUid,
        });

        return {
          reviewMode,
          setReviewModeOverride,
          currentCardData,
          currentCardRefUid,
          setCurrentCardRefUid,
        };
      });

      act(() => {
        // Switch to next card
        result.current.setCurrentCardRefUid(currentCardRefUid_1);
      });

      expect(result.current.currentCardData).toMatchObject({
        refUid: currentCardRefUid_1,
        reviewMode: ReviewModes.FixedInterval,
        grade: 2,
      });
      expect(result.current.reviewMode).toEqual(ReviewModes.FixedInterval);
    });

    it('Updates state when switching to next card after first switching review mode', async () => {
      const originalCurrentCardRefUid = 'id_0';
      const nextCardRefUid = 'id_1';

      const mockBuilder = new testUtils.MockDataBuilder()
        .withCard({ uid: originalCurrentCardRefUid })
        .withSession(originalCurrentCardRefUid, {
          grade: 1,
          reviewMode: ReviewModes.DefaultSpacedInterval,
        })
        .withSession(originalCurrentCardRefUid, {
          reviewMode: ReviewModes.FixedInterval,
        })
        .withCard({ uid: nextCardRefUid })
        .withSession(nextCardRefUid, {
          grade: 2,
          reviewMode: ReviewModes.FixedInterval,
        });

      mockBuilder.mockQueryResults();

      const { practiceData } = await mockBuilder.getPracticeData();
      const { result } = renderHook(() => {
        const [currentCardRefUid, setCurrentCardRefUid] = React.useState(originalCurrentCardRefUid);
        const { reviewMode, setReviewModeOverride, currentCardData } = useCurrentCardData({
          sessions: practiceData[currentCardRefUid],
          currentCardRefUid: currentCardRefUid,
        });

        return {
          reviewMode,
          setReviewModeOverride,
          currentCardData,
          currentCardRefUid,
          setCurrentCardRefUid,
        };
      });

      act(() => {
        // Switch to fixed
        result.current.setReviewModeOverride(ReviewModes.FixedInterval);
      });

      const resultData = result.current.currentCardData as Session;
      expect(resultData.reviewMode).toEqual(ReviewModes.FixedInterval);
      expect((resultData as NewSession).isNew).toBe(false);

      act(() => {
        // Switch back
        result.current.setReviewModeOverride(ReviewModes.DefaultSpacedInterval);
      });

      expect(result.current.currentCardData).toMatchObject({
        refUid: originalCurrentCardRefUid,
        reviewMode: ReviewModes.DefaultSpacedInterval,
        grade: 1,
      });

      act(() => {
        // Switch to next card
        result.current.setCurrentCardRefUid(nextCardRefUid);
      });

      expect(result.current.currentCardData).toMatchObject({
        refUid: nextCardRefUid,
        reviewMode: ReviewModes.FixedInterval,
        grade: 2,
      });
    });
  });
});
