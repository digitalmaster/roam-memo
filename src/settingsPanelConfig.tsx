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
        id: 'migrate-roam-sr-data',
        name: 'Migrate Roam/Sr Data',
        description: 'A tool to import your Roam/Sr data into Memo.',
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
      {
        id: 'dailyLimit',
        name: 'Daily Review Limit',
        description: 'Number of cards to review each day. 0 means no limit.',
        action: {
          type: 'input',
          placeholder: defaultSettings.dailyLimit,
          onChange: (e) => {
            const value = e.target.value.trim();
            const isNumber = !isNaN(Number(value));

            processChange({ key: 'dailyLimit', value: isNumber ? Number(value) : 0 });
          },
        },
      },
      {
        id: 'rtlEnabled',
        name: 'Right-to-Left (RTL) Enabled',
        description: 'Enable RTL for languages like Arabic, Hebrew, etc.',
        action: {
          type: 'switch',
          onChange: (e) => {
            processChange({ key: 'rtlEnabled', value: e.target.checked });
          },
        },
      },
    ],
  };
};

export default settingsPanelConfig;
