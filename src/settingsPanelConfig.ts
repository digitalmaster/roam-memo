import * as asyncUtils from '~/utils/async';
import { importRoamSrOldData } from '~/utils/migration';
import RoamSrImportData from '~/components/RoamSRImport';
import { defaultSettings } from './hooks/useSettings';

const settingsPanelConfig = ({ setSettings }) => {
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
        name: 'Tag Pages',
        description:
          'Separate multiple with commas. First one is the default page. Example: "memo, sr, 🐘, french words, fun facts"',
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
        description: 'Import Roam Sr Old data',
        action: {
          type: 'reactComponent',
          component: RoamSrImportData,
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
