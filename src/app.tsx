import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import PracticeOverlay from '~/components/PracticeOverlay';
import SidePandelWidget from '~/components/SidePandelWidget';
import practice from '~/practice';
import usePracticeCardsData from '~/hooks/usePracticeCardsData';
import useTags from '~/hooks/useTags';
import useSettings from '~/hooks/useSettings';
import useCollapseReferenceList from '~/hooks/useCollapseReferenceList';

const App = () => {
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);
  const { tagsListString, pluginPageTitle } = useSettings();

  const { selectedTag, setSelectedTag, tagsList } = useTags({ tagsListString });

  const { practiceCardsUids, practiceCardsData, displayCardCounts, fetchPracticeData } =
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

  useCollapseReferenceList({ pluginPageTitle });

  return (
    <Blueprint.HotkeysProvider>
      <>
        <SidePandelWidget
          onClickCallback={handlePracticeClick}
          displayCardCounts={displayCardCounts}
        />
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
      </>
    </Blueprint.HotkeysProvider>
  );
};

export default App;
