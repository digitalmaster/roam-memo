import { Dialog } from "@blueprintjs/core";

const PracticeOverlay = ({ isOpen, onClose, cardData, dueCardUids }) => {
  console.log("DEBUG:: ~ dueCardUids", dueCardUids);
  console.log("DEBUG:: ~ cards", cardData);
  return <Dialog isOpen={isOpen} onClose={onClose} title="Review"></Dialog>;
};

export default PracticeOverlay;
