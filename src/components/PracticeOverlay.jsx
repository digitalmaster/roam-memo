import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import styled from '@emotion/styled';
import useBlockInfo from '~/hooks/useBlockInfo.jsx';
import * as domUtils from '~/utils/dom';
import * as asyncUtils from '~/utils/async';

const PracticeOverlay = ({
  isOpen,
  setShowPracticeOverlay,
  practiceCardUids,
  handleGradeClick,
}) => {
  const hasCards = practiceCardUids.length > 0;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const isDone = currentIndex > practiceCardUids.length - 1;
  const currentCardRefUid = practiceCardUids[currentIndex];
  const totalCardsCount = practiceCardUids.length;

  const [showBlockChildren, setShowBlockChildren] = React.useState(false);
  const { data: blockInfo } = useBlockInfo({ refUid: currentCardRefUid });

  const hasBlockChildren = blockInfo.children && blockInfo.children.length;

  const onGradeClick = (props) => {
    handleGradeClick(props);
    setShowBlockChildren(false);
    setCurrentIndex(currentIndex + 1);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => setShowPracticeOverlay(false)}
      className="pb-0 bg-white"
      canEscapeKeyClose={false}
    >
      <div className="bp3-dialog-header">
        <DialogHeaderIcon className="bp3-icon-large bp3-icon-box"></DialogHeaderIcon>
        <DialogHeading className="bp3-heading">Review </DialogHeading>
        <span className="text-sm mx-2 font-medium">
          <span>{currentIndex + 1}</span>
          <span className="opacity-50 mx-1">/</span>
          <span className="opacity-50">{totalCardsCount}</span>
        </span>
        <button
          aria-label="Close"
          className="bp3-dialog-close-button bp3-button bp3-minimal bp3-icon-cross"
          onClick={() => setShowPracticeOverlay(false)}
        ></button>
      </div>
      <div className="bp3-dialog-body overflow-y-scroll m-0 p-5">
        {currentCardRefUid ? (
          <CardBlock refUid={currentCardRefUid} showBlockChildren={showBlockChildren} />
        ) : (
          <div>No cards left to review!</div>
        )}
      </div>
      <Footer
        refUid={currentCardRefUid}
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

const CardBlock = ({ refUid, showBlockChildren }) => {
  const ref = React.useRef();

  React.useEffect(() => {
    const asyncFn = async () => {
      await window.roamAlphaAPI.ui.components.unmountNode({ el: ref.current });
      await window.roamAlphaAPI.ui.components.renderBlock({ uid: refUid, el: ref.current });

      // Ensure block is not collapsed (so we can reveal children programatically)
      const roamBlockElm = ref.current.querySelector('.rm-block');
      const isCollapsed = roamBlockElm.classList.contains('rm-block--closed');
      if (isCollapsed) {
        // Currently no Roam API to toggle block collapse, so had to find this hacky
        // way to do it by simulating click
        const expandControlBtn = ref.current.querySelector('.block-expand .rm-caret');
        await asyncUtils.sleep(100);
        domUtils.simulateMouseClick(expandControlBtn);
        await asyncUtils.sleep(100);
        domUtils.simulateMouseClick(expandControlBtn);
      }
    };
    asyncFn();
  }, [ref, refUid]);

  return <ContentWrapper ref={ref} showBlockChildren={showBlockChildren} />;
};

const ContentWrapper = styled.div`
  position: relative;
  left: -14px;

  & .rm-block-children {
    display: ${(props) => (props.showBlockChildren ? 'flex' : 'none')};
  }

  & .rm-block-separator {
    min-width: unset; // Keeping roam block from expanding 100
  }
`;

const Dialog = styled(Blueprint.Dialog)`
  max-height: 80vh;
`;

const DialogHeaderIcon = styled.span`
  font-size: 18x !important;
`;

const DialogHeading = styled.h4`
  color: #5c7080;
`;

const FooterWrapper = styled.div`
  height: 50px;
  min-height: 50px;
`;

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
    <FooterWrapper className="bp3-multistep-dialog-footer rounded-b-md p-0">
      <div className="flex justify-center items-center h-full">
        <div className="bp3-dialog-footer-actions justify-around w-full">
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
      </div>
    </FooterWrapper>
  );
};
export default PracticeOverlay;
