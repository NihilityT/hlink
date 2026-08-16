import { describe, test, beforeEach, expect, vi, beforeAll } from 'vitest'
import path from 'node:path'
import fs from 'fs-extra'
import { getMockDir } from '../_utils'
import { copy } from '../../main/link'
import { checkPathExist } from '../../utils'
import HLinkError, { ErrorCode } from '../../core/HlinkError'

const { mockDir } = getMockDir(import.meta.url, 'copy_mock_dir')

const sourceDir = path.join(mockDir, 'source')
const destDir = path.join(mockDir, 'dest')
const sourceFile = path.join(sourceDir, 'data.nfo')
const destFile = path.join(destDir, 'data.nfo')

describe('copy test', () => {
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
      await fs.rm(mockDir, {
        recursive: true,
      })
    }
  })

  test('should be passed', async () => {
    await copy(sourceFile, destDir, sourceDir, destDir)
    expect(await checkPathExist(destFile)).toEqual(true)
  })

  test('should throw a hlink error when file exists', async () => {
    await fs.writeJSON(destFile, {})
    const promise = copy(sourceFile, destDir, sourceDir, destDir)
    await expect(promise).rejects.toBeInstanceOf(HLinkError)
    await expect(promise).rejects.toMatchObject({
      isHlinkError: true,
      ignore: true,
      code: ErrorCode.FileExists,
    })
  })
})
