import App from './app.jsx';

console.log('Roam Memo initializing...');

const container_id = 'roam-memo-wrapper';

const createAndRenderContainer = () => {
  const starredPagesWrapperElm = document.getElementsByClassName(
    'starred-pages-wrapper'
  )[0];
  const newContainerElm = document.createElement('div');
  newContainerElm.id = container_id;
  newContainerElm.classList.add('log-button'); // match style
  const starredPagesWrapperElmParent = starredPagesWrapperElm.parentNode;
  starredPagesWrapperElmParent.insertBefore(
    newContainerElm,
    starredPagesWrapperElm
  );

  return newContainerElm;
};
function onload() {
  const container = createAndRenderContainer();
  ReactDOM.render(<App />, container);

  console.log('Loaded roam/memo');
}

function onunload() {
  const container = document.getElementById(container_id);

  ReactDOM.unmountComponentAtNode(container);
  container.remove();

  console.log('Unloaded roam/memo');
}

export default {
  onload: onload,
  onunload: onunload,
};
