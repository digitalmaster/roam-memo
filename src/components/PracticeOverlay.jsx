import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import * as BlueprintSelect from '@blueprintjs/select';
import styled from '@emotion/styled';
import useBlockInfo from '~/hooks/useBlockInfo.jsx';
import * as domUtils from '~/utils/dom';
import * as asyncUtils from '~/utils/async';

const PracticeOverlay = ({
  isOpen,
  tagsList,
  selectedTag,
  onCloseCallback,
  practiceCardUids,
  handleGradeClick,
  handleMemoTagChange,
}) => {
  const hasCards = practiceCardUids.length > 0;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const isDone = currentIndex > practiceCardUids.length - 1;
  const currentCardRefUid = practiceCardUids[currentIndex];
  const totalCardsCount = practiceCardUids.length;

  const [showBlockChildren, setShowBlockChildren] = React.useState(false);
  const { data: blockInfo } = useBlockInfo({ refUid: currentCardRefUid });

  const hasBlockChildren = blockInfo.children && blockInfo.children.length;

  const onTagChange = async (tag) => {
    setShowBlockChildren(false);
    setCurrentIndex(0);
    handleMemoTagChange(tag);

    // To prevent 'space' key event from triggering dropdown
    await asyncUtils.sleep(200);
    document?.activeElement.blur();
  };

  const onGradeClick = React.useCallback(
    (props) => {
      handleGradeClick(props);
      setShowBlockChildren(false);
      setCurrentIndex(currentIndex + 1);
    },
    [currentIndex, handleGradeClick]
  );

  const hotkeys = React.useMemo(
    () => [
      {
        combo: 'space',
        global: true,
        label: 'Show Block Children',
        onKeyDown: () => {
          if (hasBlockChildren && !showBlockChildren) {
            setShowBlockChildren(true);
          } else {
            onGradeClick({ grade: 5, refUid: currentCardRefUid });
          }
        },
      },
      {
        combo: 'F',
        global: true,
        label: 'Grade 0',
        onKeyDown: () => onGradeClick({ grade: 0, refUid: currentCardRefUid }),
      },
      {
        combo: 'H',
        global: true,
        label: 'Grade 3',
        onKeyDown: () => onGradeClick({ grade: 3, refUid: currentCardRefUid }),
      },
      {
        combo: 'G',
        global: true,
        label: 'Grade 4',
        onKeyDown: () => onGradeClick({ grade: 4, refUid: currentCardRefUid }),
      },
    ],
    [hasBlockChildren, showBlockChildren, currentCardRefUid, onGradeClick]
  );
  const { handleKeyDown, handleKeyUp } = Blueprint.useHotkeys(hotkeys);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCloseCallback}
      className="pb-0 bg-white"
      canEscapeKeyClose={false}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <Header
        className="bp3-dialog-header"
        tagsList={tagsList}
        selectedTag={selectedTag}
        currentIndex={currentIndex}
        totalCardsCount={totalCardsCount}
        onCloseCallback={onCloseCallback}
        onTagChange={onTagChange}
      />

      <div className="bp3-dialog-body overflow-y-scroll m-0 pt-6 pb-8 pl-4">
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
        onCloseCallback={onCloseCallback}
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
  width: 60vw;
`;

const HeaderWrapper = styled.div`
  justify-content: space-between;
  color: #5c7080;
  background-color: #f6f9fd;
  box-shadow: 0 1px 0 rgb(16 22 26 / 10%);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-wrap: normal;
  line-height: inherit;
  margin: 0;
  min-height: 50px;

  /* Shortcut way to tag selector color */
  & .bp3-button {
    color: #5c7080;
  }
`;

const TagSelector = ({ tagsList, selectedTag, onTagChange }) => {
  return (
    <BlueprintSelect.Select
      items={tagsList}
      activeItem={selectedTag}
      filterable={false}
      itemRenderer={(tag, { handleClick, modifiers }) => {
        return (
          <TagSelectorItem text={tag} active={modifiers.active} key={tag} onClick={handleClick} />
        );
      }}
      onItemSelect={(tag) => {
        onTagChange(tag);
      }}
      popoverProps={{ minimal: true }}
    >
      <Blueprint.Button text={selectedTag} rightIcon="caret-down" minimal />
    </BlueprintSelect.Select>
  );
};

const TagSelectorItemWrapper = styled.div`
  padding: 4px 6px;
  background-color: ${({ active }) => (active ? '#e8edf4' : 'white')};
  user-select: none;

  &:hover {
    cursor: pointer;
    background-color: ${({ active }) => (active ? '#e8edf4' : '#f6f9fd')};
  }
`;

const TagSelectorItem = ({ text, onClick, active, key }) => {
  return (
    <TagSelectorItemWrapper onClick={onClick} active={active} key={key} tabIndex={-1}>
      {text}
    </TagSelectorItemWrapper>
  );
};

const Header = ({
  tagsList,
  selectedTag,
  currentIndex,
  onCloseCallback,
  totalCardsCount,
  onTagChange,
  className,
}) => {
  return (
    <HeaderWrapper className={className} tabIndex={0}>
      <div className="flex items-center">
        <Blueprint.Icon icon="box" size={14} />
        <DialogHeading className="mr-1">Review: </DialogHeading>
        <div tabIndex={-1}>
          <TagSelector tagsList={tagsList} selectedTag={selectedTag} onTagChange={onTagChange} />
        </div>
      </div>
      <div className="flex items-center justify-end">
        <span className="text-sm mx-2 font-medium">
          <span>{totalCardsCount > 0 ? currentIndex + 1 : 0}</span>
          <span className="opacity-50 mx-1">/</span>
          <span className="opacity-50">{totalCardsCount}</span>
        </span>
        <button
          aria-label="Close"
          className="bp3-dialog-close-button bp3-button bp3-minimal bp3-icon-cross"
          onClick={onCloseCallback}
        ></button>
      </div>
    </HeaderWrapper>
  );
};

const DialogHeading = styled.h4`
  font-size: 15px !important;
  font-weight: 500;
  color: #5c7080;
`;

const FooterWrapper = styled.div`
  background-color: #f6f9fd;
  height: 50px;
  min-height: 50px;
  border-top: 1px solid rgba(16, 22, 26, 0.1);

  & .bp3-button.bp3-outlined {
    background: white;
  }

  & .bp3-button-text {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const ButtonTags = styled.span`
  background-color: rgba(138, 155, 168, 0.1);
  color: #abbbc9;
  text-transform: uppercase;
  font-size: 9px;
  padding: 1px 2px;
  border-radius: 2px;
`;

const Footer = ({
  hasBlockChildren,
  setShowBlockChildren,
  showBlockChildren,
  refUid,
  onGradeClick,
  isDone,
  hasCards,
  onCloseCallback,
}) => {
  return (
    <FooterWrapper className="bp3-multistep-dialog-footer rounded-b-md p-0">
      <div className="flex justify-center items-center h-full">
        <div className="bp3-dialog-footer-actions justify-around w-full">
          {isDone || !hasCards ? (
            <Blueprint.Button
              className="text-base font-medium py-1"
              intent="none"
              onClick={onCloseCallback}
              outlined
            >
              Close
            </Blueprint.Button>
          ) : hasBlockChildren && !showBlockChildren ? (
            <Blueprint.Button
              className="text-base font-medium py-1"
              intent="none"
              onClick={() => setShowBlockChildren(true)}
              outlined
            >
              Show Answer{' '}
              <span className="ml-2">
                <ButtonTags>SPACE</ButtonTags>
              </span>
            </Blueprint.Button>
          ) : (
            <>
              <Blueprint.Button
                className="text-base font-medium py-1"
                intent="danger"
                onClick={() => onGradeClick({ grade: 0, refUid })}
                outlined
              >
                Forgot{' '}
                <span className="ml-2">
                  <ButtonTags>F</ButtonTags>
                </span>
              </Blueprint.Button>
              <Blueprint.Button
                className="text-base font-medium py-1"
                intent="warning"
                onClick={() => onGradeClick({ grade: 3, refUid })}
                outlined
              >
                Hard{' '}
                <span className="ml-2">
                  <ButtonTags>H</ButtonTags>
                </span>
              </Blueprint.Button>
              <Blueprint.Button
                className="text-base font-medium py-1"
                intent="primary"
                onClick={() => onGradeClick({ grade: 4, refUid })}
                outlined
              >
                Good{' '}
                <span className="ml-2">
                  <ButtonTags>G</ButtonTags>
                </span>
              </Blueprint.Button>
              <Blueprint.Button
                className="text-base font-medium py-1"
                intent="success"
                onClick={() => onGradeClick({ grade: 5, refUid })}
                outlined
              >
                Perfect{' '}
                <span className="ml-2">
                  <ButtonTags>SPACE</ButtonTags>
                </span>
              </Blueprint.Button>
            </>
          )}
        </div>
      </div>
    </FooterWrapper>
  );
};
export default PracticeOverlay;
