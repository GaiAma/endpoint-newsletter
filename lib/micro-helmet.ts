import { NowResponse } from '@now/node'
import { HandlerInterface } from '../types/handler'
import helmet from 'helmet'

const noop = (): void => {}

const microHelmet = (handler: HandlerInterface) => (
  // TODO: using <any> instead of proper NowRequest/NowResponse for now as helmet expects Request<ParamsDictionary, any, any>
  req: any,
  res: any
): Promise<NowResponse | void> => {
  helmet({
    expectCt: {
      enforce: true,
      maxAge: 30,
    },
    // hpkp: {
    //   maxAge: 31536000,
    //   sha256s: [`YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=`, `ZyXwVu456=`],
    // },
    noCache: true,
    referrerPolicy: {
      policy: `no-referrer`,
    },
  })(req, res, noop)

  return handler(req, res)
}

export default microHelmet
