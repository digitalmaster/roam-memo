export const simulateMouseClick = (element) => {
  const mouseClickEvents = ['mouseenter', 'mouseover', 'mousedown', 'click', 'mouseup'];
  mouseClickEvents.forEach((mouseEventType) =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      })
    )
  );
};
