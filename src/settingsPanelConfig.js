import * as asyncUtils from '~/utils/async';

const settingsPanelConfig = ({ initFn }) => {
  const syncFn = async (e) => {
    await extensionAPI.settings.set('tagsList', e.target.value);
    initFn();
  };
  const processChange = asyncUtils.debounce((e) => syncFn(e));
  return {
    tabTitle: 'Memo',
    settings: [
      {
        id: 'tagsList',
        name: 'Tag Pages',
        description:
          'Separate multiple with commas. First one is the default page. Example: "memo, sr, 🐘, french words, fun facts"',
        action: {
          type: 'input',
          placeholder: 'memo, sr, 🐘 Review',
          onChange: processChange,
        },
      },
    ],
  };
};

export default settingsPanelConfig;
