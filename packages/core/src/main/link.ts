import path from 'path'
import { chalk, getDirBasePath } from '../utils/index.js'
import fs from 'fs-extra'
import HLinkError, { ErrorCode } from '../core/HlinkError.js'

const errorSuggestion: Record<string, ErrorCode> = {
  EXDEV: ErrorCode.CrossDeviceLink,
  EPERM: ErrorCode.NotPermitted,
  EACCES: ErrorCode.PermissionDenied,
  EEXIST: ErrorCode.FileExists,
}
const knownError = Object.keys(errorSuggestion) as Array<
  keyof typeof errorSuggestion
>

function buildErrorFilepath(
  sourceFile: string,
  originalDestPath: string,
  source: string,
  dest: string
) {
  return `${chalk.gray(getDirBasePath(source, sourceFile))} ${chalk.cyan(
    '>'
  )} ${getDirBasePath(
    dest,
    path.join(originalDestPath, path.basename(sourceFile))
  )}`
}

function handleError(
  e: unknown,
  sourceFile: string,
  originalDestPath: string,
  source: string,
  dest: string
) {
  if (typeof e === 'object' && e instanceof Error) {
    const findError = knownError.find(
      (err: string) => (e as { code?: string }).code === err
    )
    if (findError) {
      throw new HLinkError(
        errorSuggestion[findError],
        buildErrorFilepath(sourceFile, originalDestPath, source, dest)
      )
    }
  }
  throw e
}

/**
 *
 * @param sourceFile 源文件的绝对路径
 * @param originalDestPath 硬链文件实际存放的目录(绝对路径)
 */
async function link(
  sourceFile: string,
  originalDestPath: string,
  source: string,
  dest: string
) {
  // 做硬链接
  try {
    await fs.ensureDir(originalDestPath)
    await fs.link(
      sourceFile,
      path.join(originalDestPath, path.basename(sourceFile))
    )
  } catch (e) {
    handleError(e, sourceFile, originalDestPath, source, dest)
  }
}

/**
 * 复制文件而非硬链接，目标已存在则跳过（避免覆盖）
 *
 * @param sourceFile 源文件的绝对路径
 * @param originalDestPath 复制文件实际存放的目录(绝对路径)
 */
async function copy(
  sourceFile: string,
  originalDestPath: string,
  source: string,
  dest: string
) {
  const destFile = path.join(originalDestPath, path.basename(sourceFile))
  await fs.ensureDir(originalDestPath)
  if (fs.existsSync(destFile)) {
    throw new HLinkError(
      ErrorCode.FileExists,
      buildErrorFilepath(sourceFile, originalDestPath, source, dest)
    )
  }
  try {
    await fs.copyFile(sourceFile, destFile)
    // fs.copyFile 不保留源文件的权限位，这里手动补上
    const srcStat = await fs.stat(sourceFile)
    await fs.chmod(destFile, srcStat.mode)
  } catch (e) {
    handleError(e, sourceFile, originalDestPath, source, dest)
  }
}

export { copy }
export default link
