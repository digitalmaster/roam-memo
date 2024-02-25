import React from 'react';
import Arrive from 'arrive';

Arrive; // To prevent tree shaking elimination

const useOnBlockInteract = ({
  onEnterCallback,
  onLeaveCallback,
}: {
  onEnterCallback: (elm: HTMLTextAreaElement) => void;
  onLeaveCallback: (elm: HTMLTextAreaElement) => void;
}) => {
  React.useEffect(() => {
    document.leave('textarea.rm-block-input', onLeaveCallback);
    document.arrive('textarea.rm-block-input', onEnterCallback);

    return () => {
      document.unbindLeave('textarea.rm-block-input', onLeaveCallback);
      document.unbindArrive('textarea.rm-block-input', onEnterCallback);
    };
  }, [onEnterCallback, onLeaveCallback]);
};

export default useOnBlockInteract;
