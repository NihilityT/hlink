import path from 'node:path'
import { IHlink } from '../IHlink.js'
import getGlobs from '../utils/getGlobs.js'
import {
  chalk,
  checkPathExist,
  findParentRelative,
  log,
  warning,
} from '../utils/index.js'

function join(arr: string[]) {
  return chalk.gray(arr.join(` ${chalk.cyan('>')} `))
}

function isEmpty(pathsMapping: IHlink.PathsMapping): boolean {
  return Array.isArray(pathsMapping)
    ? pathsMapping.length === 0
    : Object.keys(pathsMapping).length === 0
}

/**
 * 将 pathsMapping 归一化为 { source, dest: string[] } 列表，
 * 统一处理「键值对象 / 数组」两种形态，以及「字符串 / 字符串数组」两种值。
 * 数组形态的元素仍为键值对象（source 为键、dest 为值），无需改写字段名。
 */
function normalizePathsMapping(
  pathsMapping: IHlink.PathsMapping
): Array<{ source: string; dest: string[] }> {
  const entries: Array<[string, string | string[]]> = Array.isArray(
    pathsMapping
  )
    ? pathsMapping.flatMap((item) => Object.entries(item))
    : Object.entries(pathsMapping)
  return entries.map(([source, dest]) => ({
    source,
    dest: Array.isArray(dest) ? dest : [dest],
  }))
}

async function formatConfig<T extends IHlink.Options>(config: T) {
  warning(
    !config || !config.pathsMapping || isEmpty(config.pathsMapping),
    '至少配置一个路径'
  )

  const normalized = normalizePathsMapping(config.pathsMapping)

  const exists = await Promise.all(
    normalized.map(async ({ source }) => await checkPathExist(source))
  )

  const pathsMapping: IHlink.PathsMappingPair[] = []
  normalized.forEach(({ source, dest: dests }, i) => {
    dests.forEach((dest) => {
      const paths = findParentRelative([source, dest])
      if (!path.isAbsolute(source) || !path.isAbsolute(dest)) {
        log.warn(join(paths), '路径都必须为绝对路径，已过滤')
        return
      }
      if (source === dest) {
        log.warn(join(paths), '源路径和目标路径不能相同，已过滤')
        return
      }
      if (!exists[i]) {
        log.warn(join(paths), '源路径不存在，已过滤')
        return
      }
      pathsMapping.push({ source, dest })
    })
  })

  warning(!pathsMapping.length, '过滤后，没有一个路径满足要求')

  const includeGlobs = getGlobs(config.include, ['**'])
  const excludeGlobs = getGlobs(config.exclude)
  return {
    ...config,
    include: includeGlobs,
    exclude: excludeGlobs,
    pathsMapping,
  }
}

export default formatConfig
