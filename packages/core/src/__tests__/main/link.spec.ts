import { describe, test, beforeEach, expect, vi, beforeAll } from 'vitest'
import path from 'node:path'
import os from 'node:os'
import fs from 'fs-extra'
import { getMockDir } from '../_utils'
import link from '../../main/link'
import { checkPathExist } from '../../utils'
import HLinkError, { ErrorCode } from '../../core/HlinkError'

const { mockDir } = getMockDir(import.meta.url, 'mock_dir')

const sourceDir = path.join(mockDir, 'source')
const destDir = path.join(mockDir, 'dest')
const sourceFile = path.join(sourceDir, 'data.json')
const destFile = path.join(destDir, 'data.json')

// 找一个与 mockDir 不同设备的可写目录，用于真实触发 EXDEV 跨设备硬链错误
function findCrossDeviceDir(): string | null {
  const baseDev = fs.statSync(path.dirname(mockDir)).dev
  const candidates = [os.tmpdir(), '/dev/shm', '/run/shm', '/tmp', '/var/tmp']
  for (const c of candidates) {
    if (!c) continue
    try {
      const st = fs.statSync(c)
      if (st.isDirectory() && st.dev !== baseDev) {
        return c
      }
    } catch {
      // 候选目录不存在或无权限，忽略
    }
  }
  return null
}
const crossDeviceDir = findCrossDeviceDir()

describe('link test', () => {
  beforeAll(() => {
    console.log = vi.fn()
    return () => {
      vi.restoreAllMocks()
    }
  })

  beforeEach(async () => {
    await Promise.all([fs.ensureDir(sourceDir), fs.ensureDir(destDir)])
    await fs.writeJSON(sourceFile, {})
    return async () => {
      await fs.rm(mockDir, { recursive: true, force: true })
    }
  })

  test('should be passed', async () => {
    await link(sourceFile, destDir, sourceDir, destDir)
    expect(await checkPathExist(destFile)).toEqual(true)
    // 硬链接：源与目标应指向同一 inode
    expect((await fs.stat(destFile)).ino).toEqual(
      (await fs.stat(sourceFile)).ino
    )
  })

  test('should throw a hlink error when file exists', async () => {
    await fs.writeJSON(destFile, {})
    const promise = link(sourceFile, destDir, sourceDir, destDir)
    await expect(promise).rejects.toBeInstanceOf(HLinkError)
    await expect(promise).rejects.toMatchObject({
      isHlinkError: true,
      ignore: true,
      code: ErrorCode.FileExists,
    })
  })

  const crossLinkTest = crossDeviceDir ? test : test.skip
  crossLinkTest('should throw a hlink error when cross link', async () => {
    const crossDest = path.join(crossDeviceDir!, 'hlink_test_cross_device')
    await fs.ensureDir(crossDest)
    try {
      const promise = link(sourceFile, crossDest, sourceDir, crossDest)
      await expect(promise).rejects.toBeInstanceOf(HLinkError)
      await expect(promise).rejects.toMatchObject({
        isHlinkError: true,
        ignore: false,
        code: ErrorCode.CrossDeviceLink,
      })
    } finally {
      await fs.rm(crossDest, { recursive: true, force: true })
    }
  })

  test('should throw a hlink error when not permitted', async () => {
    // 对目录做硬链接：POSIX 与 Windows 均返回 EPERM
    const dirAsSource = path.join(sourceDir, 'a_directory')
    await fs.ensureDir(dirAsSource)
    const promise = link(dirAsSource, destDir, sourceDir, destDir)
    await expect(promise).rejects.toBeInstanceOf(HLinkError)
    await expect(promise).rejects.toMatchObject({
      isHlinkError: true,
      ignore: false,
      code: ErrorCode.NotPermitted,
    })
  })

  // 权限不足（EACCES）：目标目录不可写。POSIX 上非 root 才能真实触发
  const canTestPermissionDenied =
    process.platform !== 'win32' &&
    (typeof process.getuid !== 'function' || process.getuid() !== 0)
  const permissionDeniedTest = canTestPermissionDenied ? test : test.skip
  permissionDeniedTest(
    'should throw a hlink error when permission denied',
    async () => {
      await fs.chmod(destDir, 0o555)
      try {
        const promise = link(sourceFile, destDir, sourceDir, destDir)
        await expect(promise).rejects.toBeInstanceOf(HLinkError)
        await expect(promise).rejects.toMatchObject({
          isHlinkError: true,
          ignore: false,
          code: ErrorCode.PermissionDenied,
        })
      } finally {
        await fs.chmod(destDir, 0o755)
      }
    }
  )
})
