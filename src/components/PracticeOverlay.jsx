import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import { fetchBlockInfo } from '~/queries';

const FooterWrapper = ({ children }) => (
  <div className="bp3-multistep-dialog-footer rounded-b-md">{children}</div>
);

const ContentWrapper = ({ children }) => (
  <div className="bp3-dialog-body">{children}</div>
);

const PracticeOverlay = ({
  isOpen,
  onClose,
  practiceCardUids,
  handleGradeClick,
}) => {
  const hasCards = practiceCardUids.length > 0;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const refUid = practiceCardUids[currentIndex];

  const [blockInfo, setBlockInfo] = React.useState({});
  const [showBlockChildren, setShowBlockChildren] = React.useState(false);
  const hasBlockChildren =
    blockInfo.questionBlockChildren && blockInfo.questionBlockChildren.length;

  React.useEffect(() => {
    if (!hasCards) return;
    const fetch = async () => {
      const blockInfo = await fetchBlockInfo(refUid);
      setBlockInfo(blockInfo);
    };
    fetch(refUid);
  }, [currentIndex, hasCards]);

  return (
    <Blueprint.Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Review"
      className="pb-0"
      icon="box"
    >
      {!hasCards && (
        <ContentWrapper>
          <div>No cards left to review!</div>
        </ContentWrapper>
      )}
      {hasCards && (
        <>
          <ContentWrapper>
            {hasCards && (
              <>
                <div className="mb-2">{blockInfo.questionBlockString}</div>

                {showBlockChildren &&
                  hasBlockChildren &&
                  blockInfo.questionBlockChildren.map((childString, index) => (
                    <div key={index}>{childString}</div>
                  ))}
              </>
            )}
          </ContentWrapper>

          <FooterWrapper>
            <div className="bp3-dialog-footer-actions justify-around">
              {hasBlockChildren && !showBlockChildren ? (
                <Blueprint.Button
                  intent="none"
                  onClick={() => setShowBlockChildren(true)}
                  outlined
                >
                  Show Answer
                </Blueprint.Button>
              ) : (
                <>
                  <Blueprint.Button
                    intent="danger"
                    onClick={() => handleGradeClick({ grade: 0, refUid })}
                    outlined
                  >
                    Forgot
                  </Blueprint.Button>
                  <Blueprint.Button
                    intent="warning"
                    onClick={() => handleGradeClick({ grade: 3, refUid })}
                    outlined
                  >
                    Hard
                  </Blueprint.Button>
                  <Blueprint.Button
                    intent="success"
                    onClick={() => handleGradeClick({ grade: 5, refUid })}
                    outlined
                  >
                    Perfect
                  </Blueprint.Button>
                </>
              )}
            </div>
          </FooterWrapper>
        </>
      )}
    </Blueprint.Dialog>
  );
};

export default PracticeOverlay;
