import * as React from 'react';

const useTags = ({ tagsListString }: { tagsListString: string }) => {
  const [tagsList, setTagsList] = React.useState<string[]>([]);
  const [selectedTag, setSelectedTag] = React.useState<string | undefined>();

  React.useEffect(() => {
    const tagsList = tagsListString.split(',').map((tag) => tag.trim());
    setTagsList(tagsList);
  }, [tagsListString, setTagsList]);

  React.useEffect(() => {
    setSelectedTag(tagsList[0]);
  }, [tagsList]);

  return {
    selectedTag,
    setSelectedTag,
    tagsList,
  };
};

export default useTags;
