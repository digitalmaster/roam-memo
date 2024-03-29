import React from 'react';
import * as queries from '~/queries';
import { saveCacheData } from '~/queries';

const defaultData = {
  lastCompletedDate: null,
};

const useCachedData = ({
  dataPageTitle,
  selectedTag,
}: {
  dataPageTitle: string;
  selectedTag: string;
}) => {
  const [data, setData] = React.useState(defaultData);
  const [refetchTrigger, setRefetchTrigger] = React.useState(0);

  const deleteCacheDataKey = async (toDeleteKeyId: string) => {
    await queries.deleteCacheDataKey({ dataPageTitle, selectedTag, toDeleteKeyId });
  };

  React.useEffect(() => {
    const getData = async () => {
      const result = await queries.getPluginPageCachedData({ dataPageTitle, selectedTag });

      setData({ ...defaultData, ...result });
    };

    getData();
  }, [refetchTrigger, dataPageTitle, selectedTag]);

  return {
    saveCacheData: async (data: { [key: string]: any }) => {
      await saveCacheData({ dataPageTitle, data, selectedTag });
      setRefetchTrigger((prev) => prev + 1);
    },
    deleteCacheDataKey,
    fetchCacheData: () => setRefetchTrigger((prev) => prev + 1),
    data,
  };
};

export default useCachedData;
