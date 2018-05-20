import helmet from 'helmet'

const noop = () => {}

const microHelmet = handler => (req, res, ...rest) => {
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
  return handler(req, res, ...rest)
}

export default microHelmet