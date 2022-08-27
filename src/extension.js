import ReactDOM from 'react-dom';
import App from './app.jsx';

console.log('Memo: Initializing...');

const container_id = 'roam-memo-wrapper';

const createAndRenderContainer = () => {
  // @TODO: This is where I want it personally, but maybe make this a configurable setting?
  const siblingElm = document.querySelector('.rm-left-sidebar__daily-notes');
  const newContainerElm = document.createElement('div');
  newContainerElm.id = container_id;
  newContainerElm.classList.add('log-button'); // match style
  siblingElm.parentNode.insertBefore(newContainerElm, siblingElm.nextSibling);

  return newContainerElm;
};
function onload({ extensionAPI }) {
  // This just makes life easier (instead of having to pipe it down everywhere I
  // want to dynamically fetch the latest config)
  window.roamMemo = {
    extensionAPI,
  };

  const container = createAndRenderContainer();
  ReactDOM.render(<App />, container);

  console.log('Memo: Initialized');
}

function onunload() {
  const container = document.getElementById(container_id);

  ReactDOM.unmountComponentAtNode(container);
  container.remove();

  console.log('Memo: Unloaded');
}

export default {
  onload: onload,
  onunload: onunload,
};
