import * as asyncUtils from '~/utils/async';
import RoamSrImportPanel from '~/components/RoamSrImportPanel';
import { defaultSettings } from './hooks/useSettings';

const settingsPanelConfig = ({ settings, setSettings }) => {
  const syncFn = async ({ key, value }: { key: string; value: any }) => {
    window.roamMemo.extensionAPI.settings.set(key, value);
    setSettings((currentSettings) => {
      return { ...currentSettings, [key]: value };
    });
  };

  const processChange = asyncUtils.debounce((e) => syncFn(e));
  return {
    tabTitle: 'Memo',
    settings: [
      {
        id: 'tagsListString',
        name: 'Tag Pages (aka Decks)',
        description:
          'Separate multiple decks with commas. Example: "memo, sr, 🐘, french exam, fun facts"',
        action: {
          type: 'input',
          placeholder: defaultSettings.tagsListString,
          onChange: (e) => {
            const tagsListString = e.target.value.trim();
            processChange({ key: 'tagsListString', value: tagsListString });
          },
        },
      },
      {
        id: 'import-roam-sr-data',
        name: 'Import Roam/Sr Data',
        description: 'A tool to import your Roam/Sr data into Memo',
        action: {
          type: 'reactComponent',
          component: () => <RoamSrImportPanel dataPageTitle={settings.dataPageTitle} />,
        },
      },
      {
        id: 'dataPageTitle',
        name: 'Data Page Title',
        description: "Name of page where we'll store all your data",
        action: {
          type: 'input',
          placeholder: defaultSettings.dataPageTitle,
          onChange: (e) => {
            const value = e.target.value.trim();
            processChange({ key: 'dataPageTitle', value });
          },
        },
      },
    ],
  };
};

export default settingsPanelConfig;
