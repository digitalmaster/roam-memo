const settingsPanelConfig = {
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
      },
    },
  ],
};

export default settingsPanelConfig;
