const getSettings = () => {
  const settings = window.extensionAPI.settings.getAll();
  const defaultSettings = {
    tagsList: 'memo',
    pluginPageTitle: 'roam/memo',
  };
  return {
    ...defaultSettings,
    ...settings,
  };
};

export default getSettings;
