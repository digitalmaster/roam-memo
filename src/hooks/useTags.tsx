import * as React from 'react';

const splitStringByCommas = (str: string) => {
  const result = [];
  let current = '';
  let isInsideQuote = false;

  for (let i = 0; i < str.length; i++) {
    const currentChar = str[i];
    if (currentChar === '"') {
      isInsideQuote = !isInsideQuote;
    } else if (currentChar === ',' && !isInsideQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += currentChar;
    }
  }

  result.push(current.trim());
  return result;
};

const useTags = ({ tagsListString }: { tagsListString: string }) => {
  const [tagsList, setTagsList] = React.useState<string[]>([]);
  const [selectedTag, setSelectedTag] = React.useState<string | undefined>();

  React.useEffect(() => {
    const tagsList = splitStringByCommas(tagsListString);
    setTagsList(tagsList);
    setSelectedTag(tagsList[0]);
  }, [tagsListString, setTagsList]);

  return {
    selectedTag,
    setSelectedTag,
    tagsList,
  };
};

export default useTags;
