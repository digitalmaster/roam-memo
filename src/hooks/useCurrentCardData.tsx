import React from 'react';
import { CompleteRecords, NewSession, ReviewModes, Session } from '~/models/session';
import { generateNewSession } from '~/queries';

const getResolvedCardData = ({
  practiceData,
  reviewMode,
  currentCardRefUid,
}: {
  practiceData: CompleteRecords;
  reviewMode: ReviewModes;
  currentCardRefUid: string;
}) => {
  const currentCardSessions = practiceData[currentCardRefUid];

  let lastSessionWithMatchingReviewMode: Session;
  for (let i = currentCardSessions.length - 1; i >= 0; i--) {
    const data = currentCardSessions[i];
    if (data.reviewMode === reviewMode) {
      lastSessionWithMatchingReviewMode = data;
      break;
    }
  }

  if (lastSessionWithMatchingReviewMode) {
    return lastSessionWithMatchingReviewMode;
  } else {
    const newCard = generateNewSession({ reviewMode });
    return newCard;
  }
};

/**
 * How do we handle switching review mode for a card that already has practice
 * data? We have two options:
 *  1. We can just start from scratch (ie. generate a new session)
 *  2. We can find the last session with the matching review mode and pickup
 *     where we left off
 *
 * Here i'm doing both. First I try to find the last session with matching
 * review mode and if I can't find one I generate a new session.
 *
 * Thinking: I since we're no longer fetching the rest of the cards async here
 * we should be able to refactor this to a plain function?
 */
const useCurrentCardData = ({
  practiceData,
  currentCardRefUid,
}: {
  practiceData: CompleteRecords;
  currentCardRefUid: string;
}) => {
  const [cardRefUidHasChanged, setCardREfUidHasChanged] = React.useState(null);
  const [cachedCurrentCardRefUid, setCachedCurrentCardRefUid] = React.useState(currentCardRefUid);
  const sessions = practiceData[cachedCurrentCardRefUid] || [];
  const latestSession = sessions[sessions.length - 1];
  const [currentCardData, setCurrentCardData] = React.useState<Session | NewSession>(latestSession);
  const [reviewMode, setReviewMode] = React.useState<ReviewModes>(
    currentCardData?.reviewMode || ReviewModes.DefaultSpacedInterval
  );
  const [hasResolvedMismatch, setHasResolvedMismatch] = React.useState(false);

  React.useEffect(() => {
    if (!currentCardData) return;

    const hasReviewModeMismatch = reviewMode !== currentCardData.reviewMode;

    if (!hasReviewModeMismatch || hasResolvedMismatch) {
      if (hasReviewModeMismatch) {
        setCurrentCardData(latestSession);
      }
      return;
    }

    const fetchResolvedCardData = () => {
      const response = getResolvedCardData({
        practiceData,
        reviewMode,
        currentCardRefUid: cachedCurrentCardRefUid,
      });
      setCurrentCardData(response);
      setHasResolvedMismatch(true);
    };

    fetchResolvedCardData();
  }, [
    reviewMode,
    currentCardData,
    cachedCurrentCardRefUid,
    practiceData,
    hasResolvedMismatch,
    latestSession,
  ]);

  // Handle cardRefUid change so we have clean signal to reset state
  // This is ugly, but it keeps the reset state hook logic simple
  React.useEffect(() => {
    if (currentCardRefUid === cachedCurrentCardRefUid) return;
    setCachedCurrentCardRefUid(currentCardRefUid);
    setCardREfUidHasChanged(true);
  }, [cachedCurrentCardRefUid, currentCardRefUid]);

  // When we switch cards reset state
  React.useEffect(() => {
    if (!cardRefUidHasChanged) return;
    const nextCard = latestSession;

    setCurrentCardData(nextCard);
    setHasResolvedMismatch(false);
    setReviewMode(nextCard?.reviewMode || ReviewModes.DefaultSpacedInterval);
    setCardREfUidHasChanged(false);
  }, [
    cachedCurrentCardRefUid,
    practiceData,
    currentCardData,
    hasResolvedMismatch,
    cardRefUidHasChanged,
    latestSession,
  ]);

  return {
    reviewMode,
    setReviewMode,
    currentCardData,
  };
};

export default useCurrentCardData;
