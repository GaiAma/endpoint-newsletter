import { RecipientListWithRecipients, Recipient } from 'sparkpost';

type args = {
  list: RecipientListWithRecipients;
  id?: string;
  email?: string;
};

type result = {
  user: Recipient | null;
  msg: string;
};

const findUser = ({ list, id, email }: args): Recipient | undefined =>
  list.recipients.find(
    (x: Recipient) =>
      x.metadata.id === id ||
      (typeof x.address === `string` ? x.address : x.address?.email) === email
  );

export const isExistingUser = ({ list, id, email }: args): result => {
  const user = findUser({ list, id, email });

  if (!user) {
    return { user: null, msg: `NOT_FOUND` };
  }

  if (user?.metadata?.confirmed) {
    return {
      user,
      msg: `ALREADY_CONFIRMED`,
    };
  }

  return {
    user,
    msg: `NOT_CONFIRMED`,
  };
};
