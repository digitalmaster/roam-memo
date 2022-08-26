import * as asyncUtils from '~/utils/async';

const settingsPanelConfig = ({ setSettings, defaultSettings }) => {

  const syncFn = async (e) => {
    const tagsListString = e.target.value.trim() || defaultSettings.tagsListString;
    extensionAPI.settings.set('tagsListString', tagsListString);
    setSettings((currentSettings) => {
      return { ...currentSettings, tagsListString };
    });
  };

  const processChange = asyncUtils.debounce((e) => syncFn(e));
  return {
    tabTitle: 'Memo',
    settings: [
      {
        id: 'tagsListString',
        name: 'Tag Pages',
        description:
          'Separate multiple with commas. First one is the default page. Example: "memo, sr, 🐘, french words, fun facts"',
        action: {
          type: 'input',
          placeholder: 'memo',
          onChange: processChange,
        },
      },
    ],
  };
};

export default settingsPanelConfig;
