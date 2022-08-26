import * as React from 'react';

const useTags = ({ tagsListString }) => {
  const [tagsList, setTagsList] = React.useState([]);
  const [selectedTag, setSelectedTag] = React.useState();

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
