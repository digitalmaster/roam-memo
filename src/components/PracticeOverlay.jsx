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
      title="Review"
      className="pb-0"
      icon="box"
      canEscapeKeyClose={false}
    >
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
  & .rm-block-children {
    display: ${(props) => (props.showBlockChildren ? 'flex' : 'none')};
  }
`;

const Dialog = styled(Blueprint.Dialog)`
  min-height: 70vh;
  max-height: 80vh;
`;

const FooterWrapper = styled.div`
  height: 60px;
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
