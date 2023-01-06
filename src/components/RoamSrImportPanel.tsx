import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import * as queries from '~/queries';
import * as asyncUtils from '~/utils/async';
import styled from '@emotion/styled';
import * as stringUtils from '~/utils/string';
import { Records } from '~/models/session';

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
          {sessions.map((session) => (
            <tr>
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

const Block = ({
  uuid,
  sessions,
  isLast,
  isFirst,
  selectedUids,
  setSelectedUids,
  existingPracticeData,
}) => {
  const [blockInfo, setBlockInfo] = React.useState(null);
  const [isSelected, setIsSelected] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(isFirst ? true : false);
  const isAlreadyImported = uuid in existingPracticeData;
  React.useEffect(() => {
    if (selectedUids.includes(uuid)) {
      setIsSelected(true);
    } else {
      setIsSelected(false);
    }
  }, [selectedUids]);

  React.useEffect(() => {
    (async () => {
      const blockInfo = await queries.fetchBlockInfo(uuid);
      setBlockInfo(blockInfo);
    })();
  }, []);

  const handleCheckboxChange = (e) => {
    if (isAlreadyImported) return;

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
      <div
        className={`flex flex-col px-4 py-4 ${isAlreadyImported ? 'opacity-50 select-none' : ''}`}
      >
        <div className="flex items-center">
          <Blueprint.Checkbox checked={isSelected} onChange={handleCheckboxChange} />
          <div
            className="truncate w-full cursor-pointer"
            onClick={() => setIsExpanded((bool) => !bool)}
          >
            <div>{blockInfo?.string}</div>
            <div className="bp3-text-small bp3-text-muted">
              Found {sessions.length - newSessions.length} Practice Sessions{' '}
              {newSessions.length > 0 && `(merged with ${newSessions.length} new sessions)`}
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

const Header = styled.div`
  border-bottom: 1px solid ${BorderColor};
`;

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
    const payload = {
      graphName: 'jcb',
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
          <FormLabel className="bp3-form-helper-text">
            In order to import your practice data, you need to generate a Roam Graph API Token.{' '}
            <a
              href="https://roamresearch.com/#/app/developer-documentation/page/bmYYKQ4vf"
              target="_blank"
            >
              Click here
            </a>{' '}
            to learn how to generate one.
          </FormLabel>
          <Blueprint.InputGroup
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

const ImportPage = ({ dataPageTitle, token }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [refetchTrigger, setRefetchTrigger] = React.useState(0);
  const [isImporting, setIsImporting] = React.useState(false);
  const [records, setRecords] = React.useState<Records>({});

  const [selectedUids, setSelectedUids] = React.useState<string[]>([]);
  const [alreadyImportedIds, setAlreadyImportedIds] = React.useState<string[]>([]);
  const [existingPracticeData, setExistingPracticeData] = React.useState([]);
  const totalCardsFound = Object.keys(records).length;
  const totalRecords = Object.values(records).reduce((acc, curr) => acc + curr.length, 0);

  // Fetch records
  React.useEffect(() => {
    (async () => {
      setIsLoading(true);
      console.log('refetching');
      await asyncUtils.sleep(300); // fixes modal load delay jank

      // Fetch existing practice data (used to mark blocks that already exist)
      const existingPracticeData = await queries.getPluginPageData({
        dataPageTitle: dataPageTitle,
        limitToLatest: false,
      });
      setExistingPracticeData(existingPracticeData);

      // Fetch Old Review data
      const oldReviewData = await queries.getOldRoamSrPracticeData();
      setAlreadyImportedIds(
        Object.keys(existingPracticeData).filter((uid) => uid in oldReviewData)
      );

      const records = await queries.generateRecordsFromRoamSrData(
        oldReviewData,
        existingPracticeData,
        dataPageTitle
      );
      setRecords(records);
      setSelectedUids(Object.keys(records).filter((uid) => !(uid in existingPracticeData)));

      setIsLoading(false);
    })();
  }, [refetchTrigger]);

  const executeImport = async () => {
    setIsImporting(true);
    await queries.bulkSavePracticeData({ token, records, selectedUids, dataPageTitle });
    setIsImporting(false);
    setRefetchTrigger((n) => n + 1);
  };

  return isLoading ? (
    <div>loading...</div>
  ) : (
    <div className="flex flex-col">
      <Header className="flex px-4 py-4 justify-between">
        <div>
          <h4 className="bp3-heading mb-1">Import Roam Sr. Data</h4>
          <div className="bp3-text-small bp3-text-muted">
            <>
              Found <strong>{totalCardsFound}</strong> cards with a total of{' '}
              <strong>{totalRecords}</strong> sessions.{' '}
              <span className="text-green-600">
                {alreadyImportedIds.length &&
                  `Already imported ${alreadyImportedIds.length} cards.`}
              </span>
              .
            </>
          </div>
        </div>
        <div>
          <Blueprint.Button
            onClick={executeImport}
            disabled={isImporting || !selectedUids.length}
            intent="primary"
          >
            Import {selectedUids.length === totalCardsFound ? 'All' : `(${selectedUids.length})`}
          </Blueprint.Button>
        </div>
      </Header>
      <ResultsWrapper>
        {Object.keys(records).map((uuid, i, list) => (
          <Block
            uuid={uuid}
            sessions={records[uuid]}
            isLast={i === list.length - 1}
            isFirst={i === 0}
            selectedUids={selectedUids}
            setSelectedUids={setSelectedUids}
            existingPracticeData={existingPracticeData}
          />
        ))}
      </ResultsWrapper>
    </div>
  );
};

const Panel = ({ dataPageTitle }) => {
  const [token, setToken] = React.useState<null | string>(null);
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
        <ImportPage dataPageTitle={dataPageTitle} token={token} />
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

  return (
    <div>
      <Blueprint.Button onClick={() => setLaunchPanel(true)}>Launch</Blueprint.Button>
      {launchPanel && <Panel dataPageTitle={dataPageTitle} />}
    </div>
  );
};

export default RoamSrImportPanel;
