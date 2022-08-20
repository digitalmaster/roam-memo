import * as React from 'react';
import { fetchBlockInfo } from '~/queries';

const useBlockInfo = ({ refUid }) => {
  const [blockInfo, setBlockInfo] = React.useState({});
  React.useEffect(() => {
    if (!refUid) return;

    const fetch = async () => {
      const blockInfo = await fetchBlockInfo(refUid);
      setBlockInfo(blockInfo);
    };

    fetch(refUid);
  }, [refUid]);

  return {
    data: blockInfo,
  };
};

export default useBlockInfo;
