import * as React from "react";
import PracticeOverlay from "./components/PracticeOverlay.jsx";
import SidePandelWidget from "./components/SidePandelWidget.jsx";
import * as queries from "./queries.js";

const config = {
  tag: "🐘",
  pluginPageTitle: "roam/sr",
};

const App = () => {
  const [cardData, setCardData] = React.useState({});
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(true);

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

  return (
    <>
      <SidePandelWidget onClickCallback={() => setShowPracticeOverlay(true)} />
      <PracticeOverlay
        isOpen={showPracticeOverlay}
        onClose={() => setShowPracticeOverlay(false)}
        cardData={cardData}
        dueCardUids={dueCardUids}
      />
    </>
  );
};

export default App;
