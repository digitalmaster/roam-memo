import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import * as queries from '~/queries';
import * as asyncUtils from '~/utils/async';
import styled from '@emotion/styled';
import * as stringUtils from '~/utils/string';
import { CompleteRecords } from '~/models/session';

const BorderColor = '#e5e7eb';

const SessionsTable = ({ sessions }) => {
  const hasNewSession = sessions.some((session) => !session.isRoamSrOldPracticeRecord);
  return (
    <div className="overflow-scroll">
      <table className="bp3-html-table bp3-small bp3-html-table-striped w-full">
        <thead>
          <tr>
            <th>Grade</th>
            <th>Date</th>
            <th>eFactor</th>
            <th>Interval</th>
            <th>Streak</th>
            <th>Due</th>
            {hasNewSession && <th>New</th>}
          </tr>
        </thead>
        <tbody>
          {sessions.map((session, i) => (
            <tr key={i}>
              <td>{session.grade}</td>
              <td>{stringUtils.toDateString(session.dateCreated)}</td>
              <td>{session.eFactor.toFixed(2)}</td>
              <td>{session.interval}</td>
              <td>{session.repetitions}</td>
              <td>{stringUtils.toDateString(session.nextDueDate)}</td>
              {hasNewSession && <td>{!session.isRoamSrOldPracticeRecord ? '❇️' : ''}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Divider = styled.div`
  width: 100%;
  border-bottom: 1px solid ${BorderColor};
`;

const Block = ({ uuid, sessions, isLast, isFirst, selectedUids, setSelectedUids, blockInfo }) => {
  const [isSelected, setIsSelected] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(isFirst ? true : false);

  // Set selected
  React.useEffect(() => {
    if (selectedUids.includes(uuid)) {
      setIsSelected(true);
    } else {
      setIsSelected(false);
    }
  }, [selectedUids]);

  const handleCheckboxChange = (e) => {
    setSelectedUids((currentUids) => {
      if (e.target.checked) {
        return [...currentUids, uuid];
      } else {
        return currentUids.filter((uid) => uid !== uuid);
      }
    });
  };

  const newSessions = sessions.filter((session) => !session.isRoamSrOldPracticeRecord);

  return (
    <>
      <div className={`flex flex-col px-4 py-4`}>
        <div className="flex items-center">
          <Blueprint.Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="cursor-not-allowed"
          />
          <div
            className="truncate w-full cursor-pointer"
            onClick={() => setIsExpanded((bool) => !bool)}
          >
            <div className="truncate w-full cursor-pointer text-gray-600">{blockInfo?.string}</div>
            <div className="bp3-text-small bp3-text-muted">
              Found {sessions.length - newSessions.length} Practice Sessions{' '}
              <span className="text-green-600">
                {newSessions.length > 0 && `(merged with ${newSessions.length} new sessions)`}
              </span>
            </div>
          </div>
          <div className={`px-5 cursor-pointer`} onClick={() => setIsExpanded((bool) => !bool)}>
            <Blueprint.Icon
              icon="chevron-down"
              className={`${isExpanded ? 'transform rotate-180' : ''}`}
            />
          </div>
        </div>
        {isExpanded && <SessionsTable sessions={sessions} />}
      </div>
      {!isLast && <Divider />}
    </>
  );
};

const ResultsWrapper = styled.div`
  max-height: 500px;
  overflow: scroll;
`;

const Dialog = styled(Blueprint.Dialog)`
  width: 90%;
  max-width: 700px;
`;

const HeaderElm = styled.div`
  border-bottom: 1px solid ${BorderColor};
`;

const Header = ({
  totalCardsFound,
  totalRecords,
  executeImport,
  isImporting,
  selectedUids,
  setLaunchPanel,
  importedUids,
  onSelectAllClick,
  onDeselectAllClick,
}) => (
  <HeaderElm className="flex px-4 py-4 justify-between">
    <div>
      <h4 className="bp3-heading mb-1">Import Roam Sr. Data</h4>
      <div className="bp3-text-small bp3-text-muted">
        <>
          Found <strong>{totalCardsFound}</strong> cards with a total of{' '}
          <strong>{totalRecords}</strong> sessions.
        </>
      </div>
      {importedUids.length > 0 && (
        <div className="bp3-text-small bp3-text-muted">
          <>
            <strong>{importedUids.length}</strong> cards have already been imported.
          </>
        </div>
      )}
    </div>
    <div>
      <div className="flex justify-end items-center">
        <Blueprint.Button
          onClick={executeImport}
          disabled={isImporting || !selectedUids.length}
          intent="primary"
        >
          Import {selectedUids.length === totalCardsFound ? 'All' : `(${selectedUids.length})`}
        </Blueprint.Button>
        <Blueprint.Button icon="cross" onClick={() => setLaunchPanel(false)} className="ml-2" />
      </div>
      <div className="bp3-text-small bp3-text-muted pt-2">
        <Blueprint.Button onClick={onSelectAllClick} className="ml-2" small minimal>
          <span className="bp3-text-small bp3-text-muted">Select All</span>
        </Blueprint.Button>{' '}
        /{' '}
        <Blueprint.Button onClick={onDeselectAllClick} small minimal>
          <span className="bp3-text-small bp3-text-muted">Deselect All</span>
        </Blueprint.Button>
      </div>
    </div>
  </HeaderElm>
);

const FormLabel = styled.div`
  margin-top: 0 !important;
  margin-bottom: 5px;
`;

const TokenPage = ({ token, setToken, setShowImportPage, dataPageTitle }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [validationMessage, setValidationMessage] = React.useState('');
  const testApiToken = async () => {
    setIsLoading(true);
    const dataPageUid = await queries.getOrCreatePage(dataPageTitle);
    const testBlockUid = window.roamAlphaAPI.util.generateUID();
    const graphName = window.roamAlphaAPI.graph.name;

    const payload = {
      graphName,
      data: {
        action: 'batch-actions',
        actions: [
          {
            action: 'create-block',
            location: {
              'parent-uid': dataPageUid,
              order: 'last',
            },
            block: {
              uid: testBlockUid,
              string: 'test',
            },
          },
          {
            action: 'delete-block',
            block: {
              uid: testBlockUid,
            },
          },
        ],
      },
    };
    const baseUrl = 'https://roam-memo-server.onrender.com';
    // const baseUrl = 'http://localhost:3000';
    try {
      const response = await fetch(`${baseUrl}/save-roam-sr-data`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.status !== 200) {
        throw new Error(
          'API validation failed. Please check your token and make sure you have edit access to this graph'
        );
      }
      setShowImportPage(true);
    } catch (e) {
      setValidationMessage(e.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex px-4 py-4 justify-between">
      <div className="flex items-center">
        {/*@ts-ignore*/}
        <Blueprint.FormGroup
          label="Roam Graph API Token"
          labelFor="text-input"
          labelInfo="(required)"
        >
          <FormLabel className="bp3-form-helper-text" style={{ marginBottom: 10 }}>
            In order to import your practice data, you need to generate a Roam Graph API Token.{' '}
            <a
              href="https://roamresearch.com/#/app/developer-documentation/page/bmYYKQ4vf"
              target="_blank"
              rel="noreferrer"
            >
              Click here
            </a>{' '}
            to learn how to generate one.
          </FormLabel>
          <Blueprint.InputGroup
            autoFocus
            id="text-input"
            placeholder="roam-graph-token-XXXXX-XXXXXXXXXXXX"
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
            }}
            onKeyUp={(event) => {
              if (event.key === 'Enter') {
                testApiToken();
              }
            }}
            className="mb-3"
          />
          <div className="flex justify-center flex-col">
            <div className="text-center">
              <Blueprint.Button
                icon="geosearch"
                intent="primary"
                loading={isLoading}
                disabled={!token || isLoading}
                onClick={testApiToken}
              >
                Fetch Preview Data
              </Blueprint.Button>
            </div>
            {validationMessage && (
              <div className="mt-3 text-center text-sm text-red-400">{validationMessage}</div>
            )}
          </div>
        </Blueprint.FormGroup>
      </div>
    </div>
  );
};

const ImportProgressOverlay = ({
  isImporting,
  setLaunchPanel,
  hasImported,
  selectedUids,
  importedUids,
}) => {
  const selectedCount = selectedUids.length;
  const [toImportCount] = React.useState(selectedCount);
  const [startingImportCount] = React.useState(importedUids.length);
  const currentImportedCount = importedUids.length - startingImportCount;
  const finishedImporting = currentImportedCount === toImportCount;

  if (!isImporting && !hasImported) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-white z-10">
      <div className="py-5 px-5 flex h-full flex-col justify-center items-center">
        {hasImported ? (
          <h4 className="bp3-heading mb-3">Import Complete</h4>
        ) : (
          <h4 className="bp3-heading mb-3">
            Importing Sessions {currentImportedCount}/{toImportCount}
          </h4>
        )}
        <Blueprint.ProgressBar
          intent={finishedImporting ? 'success' : 'primary'}
          animate={finishedImporting ? false : true}
          stripes={finishedImporting ? false : true}
          value={currentImportedCount / toImportCount}
          className="mb-3"
        />

        {finishedImporting ? (
          <Blueprint.Button
            onClick={() => {
              setLaunchPanel(false);
            }}
          >
            Close
          </Blueprint.Button>
        ) : (
          <FormLabel className="bp3-form-helper-text mb-5">
            This may take a while to sync especially if you have a lot of practice data. Go grab
            coffee.
          </FormLabel>
        )}
      </div>
    </div>
  );
};

const ImportPage = ({ dataPageTitle, token, setLaunchPanel }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [refetchTrigger, setRefetchTrigger] = React.useState(0);
  const [hasImported, setHasImported] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [records, setRecords] = React.useState<CompleteRecords>({});
  const hasRecords = Object.keys(records).length > 0;

  const [selectedUids, setSelectedUids] = React.useState<string[]>([]);
  const [importedUids, setImportedUids] = React.useState<string[]>([]);

  const [blockInfoMap, setBlockInfoMap] = React.useState({});

  const totalCardsFound = Object.keys(records).length;
  const totalRecords = Object.values(records).reduce((acc, curr) => acc + curr.length, 0);

  // Fetch records
  React.useEffect(() => {
    (async () => {
      setIsLoading(true);
      await asyncUtils.sleep(300); // fixes modal load delay jank

      // Fetch existing practice data (used to mark blocks that already exist)
      const existingPracticeData = (await queries.getPluginPageData({
        dataPageTitle: dataPageTitle,
        limitToLatest: false,
      })) as CompleteRecords;

      // Fetch Old Review data
      const oldReviewData = await queries.getOldRoamSrPracticeData();

      const records = await queries.generateRecordsFromRoamSrData(
        oldReviewData,
        existingPracticeData,
        dataPageTitle
      );

      // Generate list of ids that have already been imported
      const idsAlreadyImported: string[] = [];
      for (const uid of Object.keys(existingPracticeData)) {
        if (!(uid in oldReviewData)) continue;
        const records = existingPracticeData[uid];
        const alreadyImported = records.some((record) => {
          return record.isRoamSrOldPracticeRecord;
        });

        if (alreadyImported) {
          idsAlreadyImported.push(uid);
        }
      }

      // Fetch block info
      for (const uid of Object.keys(records)) {
        if (uid in blockInfoMap) continue;
        const blockInfo = await queries.fetchBlockInfo(uid);
        setBlockInfoMap((currentMap) => ({ ...currentMap, [uid]: blockInfo }));
      }

      setImportedUids(idsAlreadyImported);
      setRecords(records);
      setSelectedUids(Object.keys(records).filter((uid) => !idsAlreadyImported.includes(uid)));
      setIsLoading(false);
    })();
  }, [refetchTrigger]);

  // Refetch while importing
  React.useEffect(() => {
    // Keep refretching while import panel is open just in case the API early returns we still want progress to keep updating.
    if (!isImporting && !hasImported) return;
    const interval = setInterval(async () => {
      setRefetchTrigger((n) => n + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [isImporting]);

  const executeImport = async () => {
    setIsImporting(true);
    await queries.bulkSavePracticeData({ token, records, selectedUids, dataPageTitle });
    setHasImported(true);
    setIsImporting(false);
    setRefetchTrigger((n) => n + 1);
  };

  return isLoading && !isImporting && !hasImported ? (
    <div className="flex justify-center items-center my-10">
      <Blueprint.Spinner className="mr-3" />
      <div>Loading...</div>
    </div>
  ) : (
    <div className="flex flex-col relative">
      <ImportProgressOverlay
        isImporting={isImporting}
        hasImported={hasImported}
        setLaunchPanel={setLaunchPanel}
        selectedUids={selectedUids}
        importedUids={importedUids}
      />
      <Header
        totalCardsFound={totalCardsFound}
        totalRecords={totalRecords}
        executeImport={executeImport}
        isImporting={isImporting}
        selectedUids={selectedUids}
        setLaunchPanel={setLaunchPanel}
        importedUids={importedUids}
        onSelectAllClick={() => setSelectedUids(Object.keys(records))}
        onDeselectAllClick={() => setSelectedUids([])}
      />
      <ResultsWrapper>
        {hasRecords ? (
          Object.keys(records)
            .sort((uid) => (!importedUids.includes(uid) ? -1 : 1))
            .map((uuid, i, list) => (
              <Block
                key={uuid}
                uuid={uuid}
                sessions={records[uuid]}
                isLast={i === list.length - 1}
                isFirst={i === 0}
                selectedUids={selectedUids}
                setSelectedUids={setSelectedUids}
                blockInfo={blockInfoMap[uuid]}
              />
            ))
        ) : (
          <div className="flex justify-center items-center my-10">
            <div>No records found.</div>
          </div>
        )}
      </ResultsWrapper>
    </div>
  );
};

const Panel = ({ dataPageTitle, setLaunchPanel, token, setToken }) => {
  const [showImportPage, setShowImportPage] = React.useState(false);

  return (
    // @ts-ignore
    <Dialog
      // onClose={onCloseCallback}
      className="bp3-ui-text pb-0 bg-white select-none"
      canEscapeKeyClose={false}
      isOpen
    >
      {token && showImportPage ? (
        <ImportPage dataPageTitle={dataPageTitle} token={token} setLaunchPanel={setLaunchPanel} />
      ) : (
        <TokenPage
          token={token}
          setToken={setToken}
          setShowImportPage={setShowImportPage}
          dataPageTitle={dataPageTitle}
        />
      )}
    </Dialog>
  );
};

const RoamSrImportPanel = ({ dataPageTitle }) => {
  const [launchPanel, setLaunchPanel] = React.useState(false);
  const [token, setToken] = React.useState<null | string>(null);

  return (
    <div>
      <Blueprint.Button onClick={() => setLaunchPanel(true)}>Launch</Blueprint.Button>
      {launchPanel && (
        <Panel
          dataPageTitle={dataPageTitle}
          setLaunchPanel={setLaunchPanel}
          token={token}
          setToken={setToken}
        />
      )}
    </div>
  );
};

export default RoamSrImportPanel;
