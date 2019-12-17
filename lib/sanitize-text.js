import { compose, trim } from 'ramda'
import sanitizeHtml from 'sanitize-html'

export const sanitizeText = compose(
  str =>
    sanitizeHtml(str, {
      allowedTags: [],
      allowedAttributes: [],
    }),
  str => trim(`${str}`)
)
