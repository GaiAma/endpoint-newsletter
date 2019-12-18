import { compose, trim } from 'ramda'
import sanitizeHtml from 'sanitize-html'

export const sanitizeText = compose(
  (str: string): string =>
    sanitizeHtml(str, {
      allowedTags: [],
      allowedAttributes: {},
    }),
  (str: string): string => trim(`${str}`)
)
