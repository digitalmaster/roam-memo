import * as React from 'react';

const useCloze = ({ renderedBlockElm, onClozeCallback }) => {
  React.useEffect(() => {
    if (!renderedBlockElm) return;
    (async () => {
      const clozeElms = renderedBlockElm.querySelectorAll('.rm-highlight');

      onClozeCallback(!!clozeElms.length);
    })();
  }, [renderedBlockElm]);
};

export default useCloze;
