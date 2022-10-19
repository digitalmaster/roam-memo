import * as React from 'react';
import { Breadcrumbs as BreadcrumbsType } from '~/queries';
import styled from '@emotion/styled';
import * as domUtils from '~/utils/dom';
import * as asyncUtils from '~/utils/async';
import { Icon } from '@blueprintjs/core';
import useCloze from '~/hooks/useCloze';

const CardBlock = ({
  refUid,
  showAnswers,
  setHasCloze,
  breadcrumbs,
  showBreadcrumbs,
}: {
  refUid: string;
  showAnswers: boolean;
  setHasCloze: (hasCloze: boolean) => void;
  breadcrumbs: BreadcrumbsType[];
  showBreadcrumbs: boolean;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [renderedBlockElm, setRenderedBlockElm] = React.useState<HTMLElement>();
  useCloze({ renderedBlockElm, onClozeCallback: setHasCloze });

  React.useEffect(() => {
    const asyncFn = async () => {
      if (!ref.current) return;
      await window.roamAlphaAPI.ui.components.unmountNode({ el: ref.current });
      await window.roamAlphaAPI.ui.components.renderBlock({ uid: refUid, el: ref.current });

      // Wait for component to mount and render
      await asyncUtils.sleep(100);
      setRenderedBlockElm(ref.current);

      // Ensure block is not collapsed (so we can reveal children programatically)
      const roamBlockElm = ref.current.querySelector('.rm-block');
      const isCollapsed = roamBlockElm.classList.contains('rm-block--closed');
      if (isCollapsed) {
        // Currently no Roam API to toggle block collapse, so had to find this hacky
        // way to do it by simulating click
        const expandControlBtn = ref.current.querySelector('.block-expand .rm-caret');

        domUtils.simulateMouseClick(expandControlBtn);
        await asyncUtils.sleep(100);
        domUtils.simulateMouseClick(expandControlBtn);
      }
    };
    asyncFn();
  }, [ref, refUid]);

  return (
    <div>
      {breadcrumbs && showBreadcrumbs && <Breadcrumbs breadcrumbs={breadcrumbs} />}
      <ContentWrapper ref={ref} showAnswers={showAnswers}></ContentWrapper>
    </div>
  );
};

const ContentWrapper = styled.div<{
  showAnswers: boolean;
}>`
  // To align bullet on the left + ref count on the right correctly
  position: relative;
  left: -14px;
  width: calc(100% + 19px);

  & .rm-block-children {
    display: ${(props) => (props.showAnswers ? 'flex' : 'none')};
  }

  & .rm-block-separator {
    min-width: unset; // Keeping roam block from expanding 100
  }

  & .rm-highlight,
  .roam-memo-cloze {
    background-color: ${(props) => (props.showAnswers ? 'transparent' : '#e1e3e5')};
    color: ${(props) => (props.showAnswers ? 'inherit' : 'transparent')};
    overflow: hidden;
    border-radius: 2px;
  }
`;

const Breadcrumbs = ({ breadcrumbs }) => {
  const items = breadcrumbs.map((breadcrumb, index) => ({
    current: index === breadcrumbs.length - 1,
    text: breadcrumb.title || breadcrumb.string, // root pages have title but no string
  }));
  return (
    <BreadCrumbWrapper className="rm-zoom zoom-path-view">
      {items.map((item, i) => (
        <div key={i} className="rm-zoom-item">
          <span className="rm-zoom-item-content">{item.text}</span>{' '}
          {i !== items.length - 1 && <Icon icon="chevron-right" />}
        </div>
      ))}
    </BreadCrumbWrapper>
  );
};

const BreadCrumbWrapper = styled.div`
  opacity: 0.7;
  margin-left: 8px !important;
  margin-top: -4px !important;

  &.rm-zoom-item {
    cursor: auto !important;
  }
`;

export default CardBlock;
