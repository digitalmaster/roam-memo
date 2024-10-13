import * as React from 'react';
import { ReviewModes, Session } from '~/models/session';
import { generateNewSession } from '~/queries';

/**
 * Find the last session with matching review mode and returns it.
 * If no matching session exists, generate a new session.
 */
export const getResolvedCardData = ({
  sessions,
  reviewMode,
}: {
  sessions: Session[];
  reviewMode: ReviewModes;
}) => {
  let lastSessionWithMatchingReviewMode: Session | undefined;

  for (let i = sessions.length - 1; i >= 0; i--) {
    const data = sessions[i];
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

export default function useCurrentCardData({
  currentCardRefUid,
  sessions,
}: {
  currentCardRefUid: string | undefined;
  sessions: Session[];
}) {
  const latestSession = sessions[sessions.length - 1] as Session | undefined;
  const [currentCardData, setCurrentCardData] = React.useState<Session | undefined>(latestSession);
  const [reviewMode, setReviewMode] = React.useState<ReviewModes | undefined>(
    latestSession?.reviewMode
  );

  // Create separate review mode override toggle This is to keep the default
  // case of review mode being the same as the latest session easy to understand
  const [reviewModeOverride, setReviewModeOverride] = React.useState<ReviewModes | undefined>();

  React.useEffect(() => {
    if (!currentCardRefUid) {
      setCurrentCardData(undefined);
      return;
    }

    if (reviewModeOverride && reviewModeOverride !== latestSession?.reviewMode) {
      const resolvedCardData = getResolvedCardData({
        sessions,
        reviewMode: reviewModeOverride,
      });
      setCurrentCardData(resolvedCardData);
      setReviewMode(resolvedCardData.reviewMode);

      return;
    }

    setCurrentCardData(latestSession);
    setReviewMode(latestSession?.reviewMode);
  }, [reviewMode, sessions, currentCardRefUid, latestSession, reviewModeOverride]);

  // Here we just need to reset the override each time we change cards
  React.useEffect(() => {
    setReviewModeOverride(undefined);
    setReviewMode(latestSession?.reviewMode);
  }, [currentCardRefUid, latestSession]);

  return {
    currentCardData,
    reviewMode,
    setReviewModeOverride,
  };
}
