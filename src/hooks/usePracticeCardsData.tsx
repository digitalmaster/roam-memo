import * as React from 'react';
import { NewRecords, Records, RecordUid } from '~/models/session';
import * as queries from '~/queries';

const usePracticeCardsData = ({
  selectedTag,
  dataPageTitle,
  isCramming,
  dailyLimit,
  lastCompletedDate,
}) => {
  const [practiceCardsUids, setPracticeCardsUids] = React.useState<RecordUid[]>([]);
  const [practiceCardsData, setPracticeCardsData] = React.useState<Records | NewRecords>({});

  const [refetchTrigger, setRefetchTrigger] = React.useState(false);
  const [displayCardCounts, setDisplayCardCounts] = React.useState({ new: 0, due: 0 });
  const [completedTodayCount, setCompletedTodayCount] = React.useState(0);
  const [remainingDueCardsCount, setRemainingDueCardsCount] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      const {
        cardsData,
        newCardsUids,
        dueCardsUids,
        allSelectedTagCardsUids,
        completedTodayCount,
        remainingDueCardsCount,
      } = await queries.getPracticeCardData({
        selectedTag,
        dataPageTitle,
        dailyLimit,
        isCramming,
        lastCompletedDate,
      });

      setRemainingDueCardsCount(remainingDueCardsCount);
      setPracticeCardsData(cardsData);
      setCompletedTodayCount(completedTodayCount);

      if (isCramming) {
        setPracticeCardsUids(
          Object.keys(cardsData).filter((uid) => allSelectedTagCardsUids.includes(uid))
        );
      } else {
        // Always practice due cards first
        // @TODO: Perhaps make this order configurable?
        setPracticeCardsUids([...dueCardsUids, ...newCardsUids]);
      }
      setDisplayCardCounts({ new: newCardsUids.length, due: dueCardsUids.length });
    })();
  }, [selectedTag, dataPageTitle, refetchTrigger, isCramming, dailyLimit, lastCompletedDate]);

  return {
    practiceCardsUids,
    practiceCardsData,
    displayCardCounts,
    fetchPracticeData: () => setRefetchTrigger((trigger) => !trigger),
    completedTodayCount,
    remainingDueCardsCount,
  };
};

export default usePracticeCardsData;
