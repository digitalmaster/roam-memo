import * as React from 'react';
import { Today, TodayInitial } from '~/models/practice';
import { NewRecords, Records, RecordUid } from '~/models/session';
import * as queries from '~/queries';

const usePracticeCardsData = ({ tagsList, selectedTag, dataPageTitle, isCramming, dailyLimit }) => {
  const [practiceCardsUids, setPracticeCardsUids] = React.useState<RecordUid[]>([]);
  const [practiceData, setPracticeData] = React.useState<Records | NewRecords>({});
  const [refetchTrigger, setRefetchTrigger] = React.useState(false);
  const [today, setToday] = React.useState<Today>(TodayInitial);

  const [completedTodayCounts, setCompletedTodayCounts] = React.useState({});
  const [remainingDueCardsCount, setRemainingDueCardsCount] = React.useState(0);
  const refetchTriggerFn = () => setRefetchTrigger((trigger) => !trigger);

  React.useEffect(() => {
    (async () => {
      if (!selectedTag) return;

      const { pluginPageData, todayStats, cardUids } = await queries.getPracticeData({
        tagsList,
        dataPageTitle,
        dailyLimit,
        isCramming,
      });

      const selectedTagTodayData = todayStats.tags[selectedTag];
      const newCardsUids = selectedTagTodayData.newUids;
      const dueCardsUids = selectedTagTodayData.dueUids;
      const allSelectedTagCardsUids = cardUids[selectedTag];

      setToday(todayStats);
      setRemainingDueCardsCount(selectedTagTodayData.due);
      setPracticeData(pluginPageData);
      setCompletedTodayCounts(selectedTagTodayData.completed);

      if (isCramming) {
        setPracticeCardsUids(
          Object.keys(pluginPageData).filter((uid) => allSelectedTagCardsUids.includes(uid))
        );
      } else {
        // Always practice due cards first
        // @TODO: Perhaps make this order configurable?
        setPracticeCardsUids([...dueCardsUids, ...newCardsUids]);
      }
    })();
  }, [selectedTag, dataPageTitle, refetchTrigger, isCramming, dailyLimit, tagsList]);

  return {
    practiceCardsUids,
    practiceData,
    fetchPracticeData: refetchTriggerFn,
    today,
    completedTodayCounts,
    remainingDueCardsCount,
  };
};

export default usePracticeCardsData;
