import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import styled from '@emotion/styled';
import { fetchBlockInfo } from '~/queries';

const FooterWrapper = ({ children }) => (
  <div className="bp3-multistep-dialog-footer rounded-b-md">{children}</div>
);

const ContentWrapper = ({ children }) => <div className="bp3-dialog-body">{children}</div>;

const Dialog = styled(Blueprint.Dialog)`
  min-height: 70vh;
  max-height: 80vh;
`;

const PracticeOverlay = ({
  isOpen,
  setShowPracticeOverlay,
  practiceCardUids,
  handleGradeClick,
}) => {
  const hasCards = practiceCardUids.length > 0;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const isDone = currentIndex > practiceCardUids.length - 1;
  const refUid = practiceCardUids[currentIndex];

  const [showBlockChildren, setShowBlockChildren] = React.useState(false);

  const [blockInfo, setBlockInfo] = React.useState({});
  const hasBlockChildren =
    blockInfo.questionBlockChildren && blockInfo.questionBlockChildren.length;
  React.useEffect(() => {
    if (!hasCards) return;
    if (isDone) return;
    const fetch = async () => {
      const blockInfo = await fetchBlockInfo(refUid);
      setBlockInfo(blockInfo);
    };
    fetch(refUid);
  }, [currentIndex, hasCards]);

  const onGradeClick = (props) => {
    handleGradeClick(props);
    setCurrentIndex(currentIndex + 1);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => setShowPracticeOverlay(false)}
      title="Review"
      className="pb-0 min-h]"
      icon="box"
    >
      <CardContent
        hasCards={hasCards}
        isDone={isDone}
        hasBlockChildren={hasBlockChildren}
        showBlockChildren={showBlockChildren}
        blockInfo={blockInfo}
      />
      <Footer
        refUid={refUid}
        onGradeClick={onGradeClick}
        hasBlockChildren={hasBlockChildren}
        setShowBlockChildren={setShowBlockChildren}
        showBlockChildren={showBlockChildren}
        isDone={isDone}
        hasCards={hasCards}
        setShowPracticeOverlay={setShowPracticeOverlay}
      />
    </Dialog>
  );
};

const CardContent = ({ hasCards, isDone, hasBlockChildren, showBlockChildren, blockInfo }) => {
  return (
    <ContentWrapper>
      {hasCards && !isDone ? (
        <>
          <div className={`${showBlockChildren && 'mb-2'} font-medium`}>
            {blockInfo.questionBlockString}
          </div>

          {showBlockChildren &&
            hasBlockChildren &&
            blockInfo.questionBlockChildren.map((childString, index) => (
              <div key={index}>{childString}</div>
            ))}
        </>
      ) : (
        <div>No cards left to review!</div>
      )}
    </ContentWrapper>
  );
};

const Footer = ({
  hasBlockChildren,
  setShowBlockChildren,
  showBlockChildren,
  refUid,
  onGradeClick,
  isDone,
  hasCards,
  setShowPracticeOverlay,
}) => {
  return (
    <FooterWrapper>
      <div className="bp3-dialog-footer-actions justify-around">
        {isDone || !hasCards ? (
          <Blueprint.Button intent="none" onClick={() => setShowPracticeOverlay(false)} outlined>
            Close
          </Blueprint.Button>
        ) : hasBlockChildren && !showBlockChildren ? (
          <Blueprint.Button intent="none" onClick={() => setShowBlockChildren(true)} outlined>
            Show Answer
          </Blueprint.Button>
        ) : (
          <>
            <Blueprint.Button
              intent="danger"
              onClick={() => onGradeClick({ grade: 0, refUid })}
              outlined
            >
              Forgot
            </Blueprint.Button>
            <Blueprint.Button
              intent="warning"
              onClick={() => onGradeClick({ grade: 3, refUid })}
              outlined
            >
              Hard
            </Blueprint.Button>
            <Blueprint.Button
              intent="success"
              onClick={() => onGradeClick({ grade: 5, refUid })}
              outlined
            >
              Perfect
            </Blueprint.Button>
          </>
        )}
      </div>
    </FooterWrapper>
  );
};
export default PracticeOverlay;
