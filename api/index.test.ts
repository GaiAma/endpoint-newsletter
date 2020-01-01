import { IncomingMessage } from 'http';
import { NowRequest, NowResponse } from '@now/node';
import test, { ExecutionContext } from 'ava';
import micro, { json, text } from 'micro';
import got, { Got, Response } from 'got';
import nock from 'nock';
import listen from 'test-listen';
import handler from './index';

let client: Got;

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: any, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

let url: string;

const handleBody = async (req: IncomingMessage) => {
  try {
    return await json(req);
  } catch (error) {
    return await text(req);
  }
};

test.before(async () => {
  nock.disableNetConnect();
  nock.enableNetConnect(/localhost/);

  try {
    // copied from https://github.com/screendriver/cibulb/blob/master/test/integration/color.test.ts#L46
    url = await listen(
      micro(async (rawReq, res) => {
        if (rawReq.method === 'OPTIONS') {
          console.log(rawReq.headers);
          rawReq.on('data', data => console.log('on Data', data));
        }
        const req = {
          ...rawReq,
          body: await handleBody(rawReq),
        };
        await handler(req as NowRequest, res as NowResponse);
        res.end();
      })
    );

    client = got.extend({
      prefixUrl: url,
      responseType: 'json',
      throwHttpErrors: false,
      retry: 0,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
  } catch (error) {
    console.error(error);
  }

  nock(/api.sparkpost.com/)
    .log(console.log)
    .persist()
    .put(/recipient-lists/)
    .reply(200, 'intercepted put');

  nock(/api.sparkpost.com/)
    .log(console.log)
    .persist()
    .post(/transmissions/)
    .reply(200, {
      results: {
        total_rejected_recipients: 0,
        total_accepted_recipients: 1,
        id: '11668787484950529',
      },
    });

  nock(/api.sparkpost.com/)
    .log(console.log)
    .persist()
    .get(/recipient-lists/)
    .reply(200, {
      results: {
        id: 'unique_id_4_graduate_students_list',
        name: 'graduate_students',
        description: 'An email list of graduate students at UMBC',
        attributes: {
          internal_id: 112,
          list_group_id: 12321,
        },
        total_accepted_recipients: 3,
        recipients: [
          {
            address: {
              email: 'wilmaflin@yahoo.com',
              name: 'Wilma',
            },
            tags: ['greeting', 'prehistoric', 'fred', 'flintstone'],
            metadata: {
              age: '24',
              place: 'Bedrock',
            },
            substitution_data: {
              favorite_color: 'SparkPost Orange',
              job: 'Software Engineer',
            },
          },
          {
            address: {
              email: 'abc@flintstone.com',
              name: 'ABC',
            },
            tags: ['driver', 'flintstone'],
            metadata: {
              age: '52',
              place: 'MD',
            },
            substitution_data: {
              favorite_color: 'Sky Blue',
              job: 'Driver',
            },
          },
          {
            address: {
              email: 'fred.jones@flintstone.com',
              name: 'Grad Student Office',
              header_to: 'grad-student-office@flintstone.com',
            },
            tags: ['driver', 'fred', 'flintstone'],
            metadata: {
              age: '33',
              place: 'NY',
            },
            substitution_data: {
              favorite_color: 'Bright Green',
              job: 'Firefighter',
            },
          },
        ],
      },
    });
});

type JsonBody = {
  msg: string;
};

test('missing email', async (t: ExecutionContext) => {
  const res: Response<JsonBody> = await client.post(`/api`, {
    json: { lang: `en`, email: `` },
  });
  t.is(res.body?.msg, 'MISSING_EMAIL');
});

test('malformed email', async (t: ExecutionContext) => {
  const res: Response<JsonBody> = await client.post(`/api`, {
    json: { lang: `en`, email: `malformed@email` },
  });
  t.is(res.body?.msg, 'MALFORMED_EMAIL');
});

test.skip('CORS', async (t: ExecutionContext) => {
  const res: Response = await client(`${url}/api`, {
    method: `OPTIONS`,
    responseType: `text`,
    json: { lang: `en`, email: `avatest@avatest.com` },
    headers: {
      Connection: 'keep-alive',
      Origin: 'gaiama.org',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers':
        'Accept,Accept-Language,User-Agent,Connection,Origin',
    },
  });
  console.log('res.headers', res.headers);
  console.log('res.body', res.body);
  t.true(true);
});
