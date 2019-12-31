import { NowRequest, NowResponse } from '@now/node';
import { send } from 'micro';
import Sparkpost from 'sparkpost';
import { sanitizeText } from '../lib/sanitize-text';
import { addUpdateSubscriber } from '../lib/add-update-subscriber';
import { middlewares } from '../lib/middlewares';

const spark = new Sparkpost();
const listPrefix = `gaiama-newsletter`;

export default middlewares(
  async (req: NowRequest, res: NowResponse): Promise<NowResponse | void> => {
    try {
      const _id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
      const _lang = Array.isArray(req.query.lang)
        ? req.query.lang[0]
        : req.query.lang;

      const id = sanitizeText(_id);

      if (!id) {
        return send(res, 500, { code: 500, msg: `MISSING_ID` });
      }

      const lang = sanitizeText(decodeURIComponent(_lang));
      if (![`de`, `en`].includes(lang)) {
        return send(res, 400, { msg: `UNSUPPORTED_LANGUAGE` });
      }

      const listId = `${listPrefix}-${lang}`;

      const { msg, code } = await addUpdateSubscriber({
        spark,
        id,
        lang,
        listId,
        confirmed: true,
      });

      if (code !== 200) {
        return send(res, code, { msg });
      }

      const Location = `https://www.gaiama.org/${lang}/?ref=subscribed`;
      res.writeHead(302, { Location });
      return res.end();
    } catch (error) {
      return send(res, error.statusCode || 500, {
        msg: `ERROR`,
        error: error.msg,
      });
    }
  }
);
