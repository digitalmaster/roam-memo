import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import PracticeOverlay from '~/components/overlay/PracticeOverlay';
import SidePandelWidget from '~/components/SidePandelWidget';
import practice from '~/practice';
import usePracticeCardsData from '~/hooks/usePracticeCardsData';
import useTags from '~/hooks/useTags';
import useSettings from '~/hooks/useSettings';
import useCollapseReferenceList from '~/hooks/useCollapseReferenceList';
import useOnBlockInteract from '~/hooks/useOnBlockInteract';
import useCommandPaletteAction from './hooks/useCommandPaletteAction';

const App = () => {
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);
  const [isCramming, setIsCramming] = React.useState(false);

  const { tagsListString, dataPageTitle, dailyLimit } = useSettings();

  const { selectedTag, setSelectedTag, tagsList } = useTags({ tagsListString });

  const { practiceCardsUids, practiceCardsData, displayCardCounts, fetchPracticeData } =
    usePracticeCardsData({
      selectedTag,
      dataPageTitle,
      isCramming,
    });

  const handleGradeClick = async ({ grade, refUid }) => {
    if (!refUid) return;

    const cardData = practiceCardsData[refUid];

    try {
      setTimeout(() => {
        // Note: Delaying this due to user report of slow UI transitions when data sync happens while UI is transitionsing.
        practice({
          ...cardData,
          grade,
          refUid,
          dataPageTitle,
          dateCreated: new Date(),
          isCramming,
        });
      }, 1000);
    } catch (error) {
      console.log('Error Saving Practice Data', error);
    }
  };

  const onShowPracticeOverlay = () => {
    fetchPracticeData();
    setShowPracticeOverlay(true);
    setIsCramming(false);
  };

  const onClosePracticeOverlayCallback = () => {
    setShowPracticeOverlay(false);
    fetchPracticeData();
  };

  const handleMemoTagChange = (tag) => {
    setSelectedTag(tag);
  };

  useCollapseReferenceList({ dataPageTitle });

  // Keep counters in sync as you add/remove tags from blocks
  const [tagsOnEnter, setTagsOnEnter] = React.useState([]);
  const onBlockEnterHandler = (elm: HTMLTextAreaElement) => {
    const tags = tagsList.filter((tag) => elm.value.includes(tag));
    setTagsOnEnter(tags);
  };
  const onBlockLeaveHandler = (elm: HTMLTextAreaElement) => {
    const tags = tagsList.filter((tag) => elm.value.includes(tag));

    if (tagsOnEnter.length !== tags.length) {
      fetchPracticeData();
    }
  };

  useOnBlockInteract({
    onEnterCallback: onBlockEnterHandler,
    onLeaveCallback: onBlockLeaveHandler,
  });

  useCommandPaletteAction({ onShowPracticeOverlay });

  return (
    <Blueprint.HotkeysProvider>
      <>
        <SidePandelWidget
          onClickCallback={onShowPracticeOverlay}
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
            isCramming={isCramming}
            setIsCramming={setIsCramming}
          />
        )}
      </>
    </Blueprint.HotkeysProvider>
  );
};

export default App;
