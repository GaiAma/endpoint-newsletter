import { compose, trim } from 'ramda'
import sanitizeHtml from 'sanitize-html'

const sanitizeText = compose(
  str =>
    sanitizeHtml(str, {
      allowedTags: [],
      allowedAttributes: [],
    }),
  str => trim(`${str}`)
)

export default sanitizeText
