import { NowRequest, NowResponse } from '@now/node';

export interface HandlerInterface {
  (req: NowRequest, res: NowResponse): Promise<NowResponse | void>;
}
