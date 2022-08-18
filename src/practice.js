import { updateDateOrCreateData } from "./queries";

export const practice = async ({ refUid }) => {
  // call supermemo API

  // update data props
  await updateDateOrCreateData(refUid);
  return;
};
