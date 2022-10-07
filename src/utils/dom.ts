export const simulateMouseEvents = (element, events = []) => {
  events.forEach((mouseEventType) =>
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
export const simulateMouseClick = (element) => {
  const mouseClickEvents = ['mouseenter', 'mouseover', 'mousedown', 'click', 'mouseup'];
  simulateMouseEvents(element, mouseClickEvents);
};
