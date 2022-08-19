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
  const [newCardUids, setNewCardUids] = React.useState([]);

  React.useEffect(() => {
    const fn = async () => {
      // Get all card data
      const { cardsData, newCardsData, dueCardUids } =
        await queries.getCardData({
          tag: config.tag,
          pluginPageTitle: config.pluginPageTitle,
        });

      setCardData({ ...cardsData, ...newCardsData });
      setDueCardUids(dueCardUids);
      setNewCardUids(Object.keys(newCardsData));
    };

    fn();
  }, []);

  const handleGradeClick = async ({ grade, refUid }) => {
    const cardData = cardsData[refUid];
    await practice({ ...cardData, grade, refUid });
  };

  const [practiceCardUids, setPracticeCardUids] = React.useState([]);
  const handlePracticeClick = async () => {
    // Always practice new cards first
    setPracticeCardUids([...newCardUids, ...dueCardUids]);
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
