import micromatch from 'micromatch'
import { IHlink } from '../IHlink.js'

function supported(
  path: string,
  include: IHlink.RuleMatcher,
  exclude?: IHlink.RuleMatcher
) {
  const lowered = path.toLowerCase()
  const includeMatch =
    micromatch.isMatch(lowered, include.globs, { nocase: true }) ||
    include.regexps.some((re) => new RegExp(re, 'i').test(lowered))
  if (!includeMatch) return false
  if (!exclude) return true
  const excludeMatch =
    micromatch.isMatch(lowered, exclude.globs, { nocase: true }) ||
    exclude.regexps.some((re) => new RegExp(re, 'i').test(lowered))
  return !excludeMatch
}

export default supported
