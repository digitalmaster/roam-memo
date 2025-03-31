import * as React from 'react';

interface UseCustomClozeProps {
  renderedBlockElm: HTMLElement;
  setClozeCounts: any;
}

function getAllTextNodes(element: Element) {
  return Array.from(element.childNodes).filter(
    (node) => node.nodeType === 3 && node.textContent.trim().length > 1
  );
}

// Takes a dom node and regex and wraps matching part of text in a span
function wrapMatches(node: Element, regex: RegExp) {
  let textNodes = getAllTextNodes(node);

  for (let i = 0; i < textNodes.length; ) {
    const textNode = textNodes[i];
    const text = textNode.textContent;

    const match = regex.exec(text);

    if (match) {
      const matchedText = match[0];

      const matchedTextStart = match.index;
      const matchedTextEnd = matchedTextStart + matchedText.length;
      const beforeText = text.slice(0, matchedTextStart);
      const afterText = text.slice(matchedTextEnd);

      // Create span and add text
      const clozeElm = document.createElement('span');
      clozeElm.classList.add('roam-memo-cloze');
      clozeElm.textContent = matchedText;

      // Add before and after text
      const beforeElm = document.createTextNode(beforeText);
      const afterElm = document.createTextNode(afterText);

      // Replace text node with new elements
      textNode.parentNode.insertBefore(beforeElm, textNode);
      textNode.parentNode.insertBefore(clozeElm, textNode);
      textNode.parentNode.insertBefore(afterElm, textNode);
      textNode.parentNode.removeChild(textNode);
      textNodes = getAllTextNodes(node);
    } else {
      i++;
    }
  }
}

const useCustomCloze = ({ renderedBlockElm, setClozeCounts }: UseCustomClozeProps) => {
  React.useEffect(() => {
    (async () => {
      if (!renderedBlockElm) return;

      const mainBlockElm = renderedBlockElm.querySelector(
        '.rm-block-main .dont-unfocus-block span'
      );
      if (!mainBlockElm) return;

      // @TODO: Perhaps make this customizable
      const left = '{';
      const right = '}';
      const re = new RegExp(`${left}(.+?)${right}`, 'gs');
      const clozeRegex = new RegExp(re, 'gs');
      wrapMatches(mainBlockElm, clozeRegex);

      const clozeElms = renderedBlockElm.querySelectorAll('.roam-memo-cloze');

      setClozeCounts((clozeCounts) => ({ ...clozeCounts, custom: clozeElms.length }));
    })();
  }, [renderedBlockElm]);
};

interface UseClozeProps {
  renderedBlockElm: HTMLElement;
  hasClozeCallback: (hasCloze: boolean) => void;
}

const useCloze = ({ renderedBlockElm, hasClozeCallback }: UseClozeProps) => {
  const [clozeCounts, setClozeCounts] = React.useState({ default: undefined, custom: undefined });

  // Count default clozes
  React.useEffect(() => {
    (async () => {
      if (!renderedBlockElm) return;
      const clozeElms = renderedBlockElm.querySelectorAll('.rm-highlight');

      setClozeCounts(() => ({ ...clozeCounts, default: clozeElms.length }));
    })();
  }, [renderedBlockElm]);

  // Set and count custom clozes
  useCustomCloze({ renderedBlockElm, setClozeCounts });

  // Use Cloze counts to enable/disable "Show Answer" UI blocking
  React.useEffect(() => {
    // Wait for both default and custom cloze counts to be set
    if (Object.values(clozeCounts).every((count) => count === undefined)) {
      return;
    }

    const sum = Object.values(clozeCounts).reduce((a, b) => a + b, 0);

    hasClozeCallback(sum > 0);
  }, [clozeCounts]);
};

export default useCloze;
