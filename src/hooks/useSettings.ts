import React from 'react';
import settingsPanelConfig from '~/settingsPanelConfig';

export type Settings = {
  tagsListString: string;
  dataPageTitle: string;
  dailyLimit: number;
  rtlEnabled: boolean;
  shuffleCards: boolean;
};

export const defaultSettings: Settings = {
  tagsListString: 'memo',
  dataPageTitle: 'roam/memo',
  dailyLimit: 0, // 0 = no limit,
  rtlEnabled: false,
  shuffleCards: true,
};

// @TODO: Refactor/Hoist this so we can call useSettings in multiple places
// without duplicating settings state (ie maybe init state in app and use
// context to access it anywhere)
const useSettings = () => {
  const [settings, setSettings] = React.useState(defaultSettings);

  // If tagsListString is empty, set it to the default
  React.useEffect(() => {
    if (!settings.tagsListString.trim()) {
      setSettings((currentSettings) => ({
        ...currentSettings,
        tagsListString: defaultSettings.tagsListString,
      }));
    }
  }, [settings]);

  // Create settings panel
  React.useEffect(() => {
    window.roamMemo.extensionAPI.settings.panel.create(
      settingsPanelConfig({ settings, setSettings })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSettings, settings.dataPageTitle]);

  React.useEffect(() => {
    const allSettings = window.roamMemo.extensionAPI.settings.getAll() || {};
    // Manually set shuffleCards to true if it doesn't exist. Reason: Can't
    // figure out how to make the switch UI default to on so let's just set it
    // to true here unless toggled off
    if (!('shuffleCards' in allSettings)) {
      window.roamMemo.extensionAPI.settings.set('shuffleCards', defaultSettings.shuffleCards);
    }

    // For some reason the getAll() method casts numbers to strings, so here we
    // map keys in this list back to numbers
    const numbers = ['dailyLimit'];

    const filteredSettings = Object.keys(allSettings).reduce((acc, key) => {
      const value = allSettings[key];
      acc[key] = numbers.includes(key) ? Number(value) : value;
      return acc;
    }, {});

    setSettings((currentSettings) => ({ ...currentSettings, ...filteredSettings }));
  }, [setSettings]);

  return settings;
};

export default useSettings;
