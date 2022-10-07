import * as React from 'react';
import { BlockInfo, fetchBlockInfo } from '~/queries';

const useBlockInfo = ({ refUid }) => {
  const [blockInfo, setBlockInfo] = React.useState<BlockInfo>({} as BlockInfo);

  React.useEffect(() => {
    if (!refUid) return;

    const fetch = async () => {
      const blockInfo = await fetchBlockInfo(refUid);

      setBlockInfo(blockInfo);
    };

    fetch();
  }, [refUid]);

  return {
    data: blockInfo,
  };
};

export default useBlockInfo;
