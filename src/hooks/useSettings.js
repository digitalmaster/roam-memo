import React from 'react';
import settingsPanelConfig from '~/settingsPanelConfig.js';

const defaultSettings = {
  tagsListString: 'memo',
  pluginPageTitle: 'roam/memo',
};

// @TODO: Refactor/Hoist this so we can call useSettings in multiple places
// without duplicating settings state (ie maybe init state in app and use
// context to access it anywhere)
const useSettings = () => {
  const [settings, setSettings] = React.useState(defaultSettings);

  React.useEffect(() => {
    // Init config panel
    window.roamMemo.extensionAPI.settings.panel.create(
      settingsPanelConfig({ setSettings, defaultSettings })
    );
  }, [setSettings]);

  React.useEffect(() => {
    const allSettings = window.roamMemo.extensionAPI.settings.getAll() || {};

    setSettings((currentSettings) => ({ ...currentSettings, ...allSettings }));
  }, [setSettings]);

  return settings;
};

export default useSettings;
