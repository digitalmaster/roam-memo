import React from 'react';
import { CompleteRecords, NewSession, ReviewModes, Session } from '~/models/session';
import { generateNewSession, getPluginPageData } from '~/queries';

const getCurrentCardSessions = async ({
  dataPageTitle,
  currentCardRefUid,
}: {
  dataPageTitle: string;
  currentCardRefUid: string;
}) => {
  // Fetch last matching review mode for this card or use default
  const pluginPageData = (await getPluginPageData({
    dataPageTitle,
    limitToLatest: false,
  })) as CompleteRecords;

  return pluginPageData[currentCardRefUid];
};

const getResolvedCardData = async ({ reviewMode, currentCardRefUid, dataPageTitle }) => {
  const allCurrentCardSessions = await getCurrentCardSessions({
    dataPageTitle,
    currentCardRefUid,
  });

  const lastSessionWithMatchingReviewMode = allCurrentCardSessions.find(
    (data) => data.reviewMode === reviewMode
  );

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
 * Here i'm doing both. First I try to find the last session with matching review mode
 * and if I can't find one I generate a new session.
 */
const useCurrentCardData = ({ practiceData, dataPageTitle, currentCardRefUid }) => {
  const [cardRefUidHasChanged, setCardREfUidHasChanged] = React.useState(null);
  const [cachedCurrentCardRefUid, setCachedCurrentCardRefUid] = React.useState(currentCardRefUid);
  const [currentCardData, setCurrentCardData] = React.useState<Session | NewSession>(
    practiceData[cachedCurrentCardRefUid]
  );
  const [reviewMode, setReviewMode] = React.useState<ReviewModes>(
    currentCardData?.reviewMode || ReviewModes.DefaultSpacedInterval
  );
  const [hasResolvedMismatch, setHasResolvedMismatch] = React.useState(false);

  React.useEffect(() => {
    if (!currentCardData) return;

    const hasReviewModeMismatch = reviewMode !== currentCardData.reviewMode;

    if (!hasReviewModeMismatch || hasResolvedMismatch) {
      if (hasReviewModeMismatch) {
        setCurrentCardData(practiceData[cachedCurrentCardRefUid]);
      }
      return;
    }

    const fetchResolvedCardData = async () => {
      const response = await getResolvedCardData({
        reviewMode,
        currentCardRefUid: cachedCurrentCardRefUid,
        dataPageTitle,
      });
      setCurrentCardData(response);
      setHasResolvedMismatch(true);
    };

    fetchResolvedCardData();
  }, [
    reviewMode,
    currentCardData,
    cachedCurrentCardRefUid,
    dataPageTitle,
    practiceData,
    hasResolvedMismatch,
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
    const nextCard = practiceData[cachedCurrentCardRefUid];

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
  ]);

  return {
    reviewMode,
    setReviewMode,
    currentCardData,
  };
};

export default useCurrentCardData;
