import * as React from 'react';
import * as queries from '~/queries.js';

const usePracticeCardsData = ({ selectedTag, pluginPageTitle }) => {
  const [practiceCardsUids, setPracticeCardsUids] = React.useState([]);
  const [practiceCardsData, setPracticeCardsData] = React.useState({});
  const [refetchTrigger, setRefetchTrigger] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { cardsData, newCardsUids, dueCardsUids } = await queries.getPracticeCardData({
        selectedTag,
        pluginPageTitle,
      });

      // Always practice due cards first
      // @TODO: Perhaps make this order configurable?
      setPracticeCardsData(cardsData);
      setPracticeCardsUids([...dueCardsUids, ...newCardsUids]);
    })();
  }, [selectedTag, pluginPageTitle, refetchTrigger]);

  return {
    practiceCardsUids,
    practiceCardsData,
    displayCardCount: practiceCardsUids.length,
    fetchPracticeData: () => setRefetchTrigger((trigger) => !trigger),
  };
};

export default usePracticeCardsData;
