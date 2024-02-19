import React from 'react';
interface CommandPaletteAction {
  onShowPracticeOverlay: () => void;
}

const useCommandPaletteAction = ({ onShowPracticeOverlay }: CommandPaletteAction) => {
  React.useEffect(() => {
    const startLabel = 'Memo: Start Review Session';
    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: startLabel,
      callback: () => onShowPracticeOverlay(),
    });

    return () => {
      window.roamAlphaAPI.ui.commandPalette.removeCommand({ label: startLabel });
    };
  }, [onShowPracticeOverlay]);
};

export default useCommandPaletteAction;
