import React from 'react';
import * as queries from '~/queries';
import { saveCacheData } from '~/queries';

const defaultData = {
  lastCompletedDate: null,
};

const useCachedData = ({ dataPageTitle }: { dataPageTitle: string }) => {
  const [data, setData] = React.useState(defaultData);
  const [refetchTrigger, setRefetchTrigger] = React.useState(0);

  React.useEffect(() => {
    const getData = async () => {
      const result = await queries.getPluginPageCachedData({ dataPageTitle });
      setData(result);
    };
    getData();
  }, [refetchTrigger]);

  return {
    saveCacheData: async (data: { [key: string]: any }) => {
      await saveCacheData({ dataPageTitle, data });
      setRefetchTrigger((prev) => prev + 1);
    },
    data,
  };
};

export default useCachedData;
