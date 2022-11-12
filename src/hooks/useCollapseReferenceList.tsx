import * as React from 'react';
import * as asyncUtils from '~/utils/async';
import * as domUtils from '~/utils/dom';

// Collapse memo data block ref by default (to keep things less noisy)
// @TODO: Maybe make this configurable
const useCollapseReferenceList = ({ dataPageTitle }) => {
  const collapseDataReferenceBlock = React.useMemo(() => {
    const fn = async () => {
      await asyncUtils.sleep(100);
      const elmList = [
        ...Array.from(document.querySelectorAll('.rm-ref-page-view .rm-ref-page-view-title')),
      ].filter((elm) => elm.textContent === dataPageTitle);

      for (const elm of elmList) {
        const collapseControlBtn = elm?.parentNode.querySelector('.rm-caret-open');
        collapseControlBtn && domUtils.simulateMouseClick(collapseControlBtn);
      }
    };

    return fn;
  }, [dataPageTitle]);
  const [currentRoute, setCurrentRoute] = React.useState('');

  React.useEffect(() => {
    collapseDataReferenceBlock(); // trigger on page load

    const onRouteChange = () => {
      setCurrentRoute(location.href);
      collapseDataReferenceBlock();
    };
    window.addEventListener('popstate', onRouteChange);
    return () => {
      window.removeEventListener('popstate', onRouteChange);
    };
  }, [dataPageTitle, collapseDataReferenceBlock]);

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      collapseDataReferenceBlock();
    });
    (async () => {
      await asyncUtils.sleep(100);
      const dailyLogsContainerElm = document.querySelector('.roam-log-container');

      if (!dailyLogsContainerElm) return;
      observer.observe(dailyLogsContainerElm, { childList: true });
    })();
    return () => {
      observer.disconnect();
    };
  }, [collapseDataReferenceBlock, currentRoute]);
};
export default useCollapseReferenceList;
