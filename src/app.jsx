import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import PracticeOverlay from '~/components/PracticeOverlay.jsx';
import SidePandelWidget from '~/components/SidePandelWidget.jsx';
import practice from '~/practice.js';
import usePracticeCardsData from '~/hooks/usePracticeCardsData.jsx';
import useTags from '~/hooks/useTags.jsx';
import useSettings from '~/hooks/useSettings';

const App = () => {
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);
  const { tagsListString, pluginPageTitle } = useSettings();

  const { selectedTag, setSelectedTag, tagsList } = useTags({ tagsListString });

  const { practiceCardsUids, practiceCardsData, displayCardCount, fetchPracticeData } =
    usePracticeCardsData({
      selectedTag,
      pluginPageTitle,
    });

  const handleGradeClick = async ({ grade, refUid }) => {
    if (!refUid) return;

    const cardData = practiceCardsData[refUid];
    await practice({ ...cardData, grade, refUid, pluginPageTitle });
  };

  const handlePracticeClick = () => {
    fetchPracticeData();
    setShowPracticeOverlay(true);
  };

  const onClosePracticeOverlayCallback = () => {
    setShowPracticeOverlay(false);
    fetchPracticeData();
  };

  const handleMemoTagChange = (tag) => {
    setSelectedTag(tag);
  };

  return (
    <Blueprint.HotkeysProvider>
      <SidePandelWidget onClickCallback={handlePracticeClick} displayCardCount={displayCardCount} />
      {showPracticeOverlay && (
        <PracticeOverlay
          isOpen={true}
          practiceCardUids={practiceCardsUids}
          practiceCardsData={practiceCardsData}
          handleGradeClick={handleGradeClick}
          onCloseCallback={onClosePracticeOverlayCallback}
          handleMemoTagChange={handleMemoTagChange}
          tagsList={tagsList}
          selectedTag={selectedTag}
        />
      )}
    </Blueprint.HotkeysProvider>
  );
};

export default App;
