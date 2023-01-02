import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import * as migration from '~/utils/migration';
import * as queries from '~/queries';
import * as asyncUtils from '~/utils/async';
import styled from '@emotion/styled';
import * as stringUtils from '~/utils/string';
import { Records } from '~/models/session';

const SessionsTable = ({ sessions }) => {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Block = ({ uuid, sessions, isLast, selectedUids, setSelectedUids }) => {
  const [blockInfo, setBlockInfo] = React.useState(null);
  const [isSelected, setIsSelected] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

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
    setSelectedUids((currentUids) => {
      if (e.target.checked) {
        return [...currentUids, uuid];
      } else {
        return currentUids.filter((uid) => uid !== uuid);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col px-4 py-4">
        <div className="flex items-center">
          <Blueprint.Checkbox checked={isSelected} onChange={handleCheckboxChange} />
          <div
            className="truncate w-full cursor-pointer"
            onClick={() => setIsExpanded((bool) => !bool)}
          >
            <div>{blockInfo?.string}</div>
            <div className="bp3-text-small bp3-text-muted">
              Found {sessions.length} Practice Sessions
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
      {!isLast && <Blueprint.Divider />}
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

const Panel = ({ dataPageTitle }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isImporting, setIsImporting] = React.useState(false);
  const [records, setRecords] = React.useState<Records>({});

  const [selectedUids, setSelectedUids] = React.useState([]);
  const [existingPracticeData, setExistingPracticeData] = React.useState();
  const totalCardsFound = Object.keys(records).length;
  const totalRecords = Object.values(records).reduce((acc, curr) => acc + curr.length, 0);

  // Fetch records
  React.useEffect(() => {
    (async () => {
      await asyncUtils.sleep(300); // fixes modal load delay
      const oldReviewData = await queries.getOldRoamSrPracticeData();
      const records = await queries.generateRecordsFromRoamSrData(oldReviewData, dataPageTitle);
      setRecords(records);
      setSelectedUids(Object.keys(records));

      // Used to mark blocks that already exist
      const existingPracticeData = await queries.getPluginPageData({
        dataPageTitle: dataPageTitle,
      });
      setExistingPracticeData(existingPracticeData);
      setIsLoading(false);
    })();
  }, []);

  const executeImport = async () => {
    setIsImporting(true);
    await queries.bulkSavePracticeData({ records, selectedUids, dataPageTitle });
    setIsImporting(false);
  };

  return (
    // @ts-ignore
    <Dialog
      // onClose={onCloseCallback}
      className="bp3-ui-text pb-0 bg-white select-none"
      canEscapeKeyClose={false}
      isOpen
    >
      {isLoading ? (
        <div>loading...</div>
      ) : (
        <div className="flex flex-col">
          <div className="flex px-4 py-4 justify-between">
            <div>
              <h4 className="bp3-heading mb-1">Import Roam Sr. Data</h4>
              <div className="bp3-text-small bp3-text-muted">
                <>
                  Found <strong>{totalCardsFound}</strong> cards with a total of{' '}
                  <strong>{totalRecords}</strong> sessions.
                </>
              </div>
            </div>
            <div>
              <Blueprint.Button onClick={executeImport} disabled={isImporting}>
                Import{' '}
                {selectedUids.length === totalCardsFound ? 'All' : `(${selectedUids.length})`}
              </Blueprint.Button>
            </div>
          </div>
          <ResultsWrapper>
            {Object.keys(records).map((uuid, i, list) => (
              <Block
                uuid={uuid}
                sessions={records[uuid]}
                isLast={i === list.length - 1}
                selectedUids={selectedUids}
                setSelectedUids={setSelectedUids}
              />
            ))}
          </ResultsWrapper>
        </div>
      )}
    </Dialog>
  );
};

const RoamSrImportPanel = ({ dataPageTitle }) => {
  const [showPanel, setShowPanel] = React.useState(false);

  return (
    <div>
      <Blueprint.Button onClick={() => setShowPanel(true)}>Preview</Blueprint.Button>
      {showPanel && <Panel dataPageTitle={dataPageTitle} />}
    </div>
  );
};

export default RoamSrImportPanel;
