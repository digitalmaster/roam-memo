import * as React from 'react';
import getSettings from '~/getSettings';

const useTags = () => {
  const settings = getSettings();
  const tagsList = settings.tagsList.split(',').map((tag) => tag.trim());
  const [selectedTag, setSelectedTag] = React.useState(tagsList[0]);

  return {
    selectedTag,
    setSelectedTag,
    tagsList,
  };
};

export default useTags;
