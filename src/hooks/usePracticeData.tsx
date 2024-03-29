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
  const [practiceData, setPracticeData] = React.useState<Records | NewRecords>({});

  const [refetchTrigger, setRefetchTrigger] = React.useState(false);
  const [displayCardCounts, setDisplayCardCounts] = React.useState({ new: 0, due: 0 });
  const [completedTodayCount, setCompletedTodayCount] = React.useState(0);
  const [remainingDueCardsCount, setRemainingDueCardsCount] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      const {
        pluginPageData,
        newCardsUids,
        dueCardsUids,
        allSelectedTagCardsUids,
        completedTodayCount,
        remainingDueCardsCount,
      } = await queries.getPracticeData({
        selectedTag,
        dataPageTitle,
        dailyLimit,
        isCramming,
        lastCompletedDate,
      });

      setRemainingDueCardsCount(remainingDueCardsCount);
      setPracticeData(pluginPageData);
      setCompletedTodayCount(completedTodayCount);

      if (isCramming) {
        setPracticeCardsUids(
          Object.keys(pluginPageData).filter((uid) => allSelectedTagCardsUids.includes(uid))
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
    practiceData,
    displayCardCounts,
    fetchPracticeData: () => setRefetchTrigger((trigger) => !trigger),
    completedTodayCount,
    remainingDueCardsCount,
  };
};

export default usePracticeCardsData;
