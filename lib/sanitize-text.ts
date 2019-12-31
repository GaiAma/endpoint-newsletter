import compose from 'ramda/src/compose'
import trim from 'ramda/src/trim'
import sanitizeHtml from 'sanitize-html'

export const sanitizeText = compose(
  (str: string): string =>
    sanitizeHtml(str, {
      allowedTags: [],
      allowedAttributes: {},
    }),
  (str: string): string => trim(`${str}`)
)
