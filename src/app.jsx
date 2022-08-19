import * as React from 'react';
import config from '~/config';
import PracticeOverlay from '~/components/PracticeOverlay.jsx';
import SidePandelWidget from '~/components/SidePandelWidget.jsx';
import practice from '~/practice.js';
import * as queries from '~/queries.js';

const App = () => {
  const [cardsData, setCardData] = React.useState({});
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);

  const [dueCardUids, setDueCardUids] = React.useState([]);

  React.useEffect(() => {
    const fn = async () => {
      // Get all card data
      const { cardData, dueCardUids } = await queries.getCardData({
        tag: config.tag,
        pluginPageTitle: config.pluginPageTitle,
      });

      setCardData(cardData);
      setDueCardUids(dueCardUids);
    };

    fn();
  }, []);

  const handleGradeClick = async ({ grade, refUid }) => {
    const cardData = cardsData[refUid];
    await practice({ ...cardData, grade, refUid });
  };

  const [practiceCardUids, setPracticeCardUids] = React.useState([]);
  const handlePracticeClick = async () => {
    setPracticeCardUids(dueCardUids);
    setShowPracticeOverlay(true);
  };

  return (
    <>
      <SidePandelWidget onClickCallback={handlePracticeClick} />
      {showPracticeOverlay && (
        <PracticeOverlay
          isOpen={true}
          onClose={() => setShowPracticeOverlay(false)}
          practiceCardUids={practiceCardUids}
          handleGradeClick={handleGradeClick}
        />
      )}
    </>
  );
};

export default App;
