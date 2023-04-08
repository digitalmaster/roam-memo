import React from 'react';
import settingsPanelConfig from '~/settingsPanelConfig';

export const defaultSettings = {
  tagsListString: 'memo',
  dataPageTitle: 'roam/memo',
  dailyLimit: 0, // 0 = no limit
};

// @TODO: Refactor/Hoist this so we can call useSettings in multiple places
// without duplicating settings state (ie maybe init state in app and use
// context to access it anywhere)
const useSettings = () => {
  const [settings, setSettings] = React.useState(defaultSettings);

  React.useEffect(() => {
    if (!settings.tagsListString.trim()) {
      setSettings((currentSettings) => ({
        ...currentSettings,
        tagsListString: defaultSettings.tagsListString,
      }));
    }
  }, [settings]);

  React.useEffect(() => {
    // Init config panel
    window.roamMemo.extensionAPI.settings.panel.create(
      settingsPanelConfig({ settings, setSettings })
    );
  }, [setSettings, settings.dataPageTitle]);

  React.useEffect(() => {
    const allSettings = window.roamMemo.extensionAPI.settings.getAll() || {};

    // For some reason the getAll() method casts numbers to strings, so here we
    // map keys in this list back to numbers
    const numbers = ['dailyLimit'];

    const filteredSettings = Object.keys(allSettings).reduce((acc, key) => {
      const value = allSettings[key];
      // Filterout out any settings that are falsey
      if (value) {
        acc[key] = numbers.includes(key) ? Number(value) : value;
      }
      return acc;
    }, {});

    setSettings((currentSettings) => ({ ...currentSettings, ...filteredSettings }));
  }, [setSettings]);

  return settings;
};

export default useSettings;
