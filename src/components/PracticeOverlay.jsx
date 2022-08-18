import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import { fetchBlockInfo } from '../queries';

const FooterWrapper = ({ children }) => (
  <div className="bp3-multistep-dialog-footer rounded-b-md">{children}</div>
);

const PracticeOverlay = ({
  isOpen,
  onClose,
  cardData,
  practiceCardUids,
  onGradeClick,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const refUid = practiceCardUids[currentIndex];
  const [blockInfo, setBlockInfo] = React.useState({});
  const [showBlockChildren, setShowBlockChildren] = React.useState(false);
  const hasBlockChildren =
    blockInfo.questionBlockChildren && blockInfo.questionBlockChildren.length;

  React.useEffect(() => {
    const fetch = async () => {
      const blockInfo = await fetchBlockInfo(refUid);
      setBlockInfo(blockInfo);
    };
    fetch(refUid);
  }, [currentIndex]);

  return (
    <Blueprint.Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Review"
      className="pb-0"
    >
      <div>{blockInfo.questionBlockString}</div>

      {showBlockChildren &&
        hasBlockChildren &&
        blockInfo.questionBlockChildren.map((childString, index) => (
          <div key={index}>{childString}</div>
        ))}

      <FooterWrapper>
        <div className="bp3-dialog-footer-actions justify-around">
          {hasBlockChildren && !showBlockChildren ? (
            <Blueprint.Button
              intent="none"
              onClick={() => setShowBlockChildren(true)}
            >
              Show Answer
            </Blueprint.Button>
          ) : (
            <>
              <Blueprint.Button
                intent="danger"
                onClick={onGradeClick({ grade: 0 })}
              >
                Forgot
              </Blueprint.Button>
              <Blueprint.Button
                intent="warning"
                onClick={onGradeClick({ grade: 3 })}
              >
                Hard
              </Blueprint.Button>
              <Blueprint.Button
                intent="success"
                onClick={onGradeClick({ grade: 5 })}
              >
                Perfect
              </Blueprint.Button>
            </>
          )}
        </div>
      </FooterWrapper>
    </Blueprint.Dialog>
  );
};

export default PracticeOverlay;
