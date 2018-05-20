import {
  compose,
  trim,
} from 'ramda'
import sanitizeHtml from 'sanitize-html'

const sanitizeText = compose(
  str =>
  sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: [],
  }),
  trim
)

export default sanitizeText