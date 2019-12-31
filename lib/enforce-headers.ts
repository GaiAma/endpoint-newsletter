import { NowRequest, NowResponse } from '@now/node';
import { HandlerInterface } from '../types/handler';
import { send } from 'micro';

const enforceHeaders = (handler: HandlerInterface) => (
  req: NowRequest,
  res: NowResponse
): Promise<NowResponse | void> => {
  if (
    !req.headers[`user-agent`] ||
    !req.headers[`accept`] ||
    !req.headers[`accept-language`]
  ) {
    return send(res, 403, { msq: `MISSING_HEADERS` });
  }

  return handler(req, res);
};

export default enforceHeaders;
