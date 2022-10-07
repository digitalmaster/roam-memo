import * as React from 'react';
import * as queries from '~/queries';

const usePracticeCardsData = ({ selectedTag, pluginPageTitle }) => {
  const [practiceCardsUids, setPracticeCardsUids] = React.useState([]);
  const [practiceCardsData, setPracticeCardsData] = React.useState({});
  const [refetchTrigger, setRefetchTrigger] = React.useState(false);
  const [displayCardCounts, setDisplayCardCounts] = React.useState({ new: 0, due: 0 });

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
      setDisplayCardCounts({ new: newCardsUids.length, due: dueCardsUids.length });
    })();
  }, [selectedTag, pluginPageTitle, refetchTrigger]);

  return {
    practiceCardsUids,
    practiceCardsData,
    displayCardCounts,
    fetchPracticeData: () => setRefetchTrigger((trigger) => !trigger),
  };
};

export default usePracticeCardsData;
