import { describe, test, expect, vi, beforeEach } from 'vitest'
import path from 'node:path'
import analyse from '../../main/analyse'
import * as parse from '../../core/parseLsirfl'
import { cacheRecord } from '../../utils/cacheHelp'

function mockParse(s: { fullPath: string; inode: string }[], d: string[]) {
  vi.spyOn(parse, 'default').mockImplementation(async () => s)
  vi.spyOn(parse, 'getInodes').mockImplementation(async () => d)
}

const m = (globs: string[] = [], regexps: string[] = []) => ({ globs, regexps })

describe('analyse test', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => 0)
    return () => {
      vi.restoreAllMocks()
    }
  })
  test('should waitLink some files', async () => {
    mockParse(
      [
        { fullPath: '/a/b', inode: '444555' },
        { fullPath: '/c/d', inode: '333444' },
      ],
      ['123', '456']
    )
    const { excludeFiles, existFiles, waitLinkFiles, cacheFiles } =
      await analyse({
        source: '',
        dest: '',
        include: m(['**']),
        exclude: m(),
      })
    expect(excludeFiles.length).toEqual(0)
    expect(existFiles.length).toEqual(0)
    expect(cacheFiles.length).toEqual(0)
    expect(waitLinkFiles.length).toEqual(2)
    expect(waitLinkFiles).toEqual([
      {
        destDir: path.resolve('/a'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/a/b',
        copy: false,
      },
      {
        destDir: path.resolve('/c'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/c/d',
        copy: false,
      },
    ])
  })
  test('should exist some files', async () => {
    mockParse(
      [
        { fullPath: '/a/b', inode: '123' },
        { fullPath: '/c/d', inode: '333444' },
      ],
      ['123', '456']
    )
    const { excludeFiles, existFiles, waitLinkFiles, cacheFiles } =
      await analyse({
        source: '',
        dest: '',
        include: m(['**']),
        exclude: m(),
      })
    expect(excludeFiles.length).toEqual(0)
    expect(existFiles.length).toEqual(1)
    expect(cacheFiles.length).toEqual(0)
    expect(waitLinkFiles.length).toEqual(1)
    expect(waitLinkFiles).toEqual([
      {
        destDir: path.resolve('/c'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/c/d',
        copy: false,
      },
    ])
  })
  test('should exclude some files', async () => {
    mockParse(
      [
        { fullPath: '/a/b.mkv', inode: '1234' },
        { fullPath: '/c/d', inode: '333444' },
      ],
      ['123', '456']
    )
    const { excludeFiles, existFiles, waitLinkFiles, cacheFiles } =
      await analyse({
        source: '',
        dest: '',
        include: m(['**.mkv']),
        exclude: m(),
      })
    expect(excludeFiles.length).toEqual(1)
    expect(existFiles.length).toEqual(0)
    expect(cacheFiles.length).toEqual(0)
    expect(waitLinkFiles.length).toEqual(1)
    expect(waitLinkFiles).toEqual([
      {
        destDir: path.resolve('/a'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/a/b.mkv',
        copy: false,
      },
    ])
  })
  test('should exclude some files', async () => {
    mockParse(
      [
        { fullPath: '/a/b.mkv', inode: '1234' },
        { fullPath: '/c/d.mp4', inode: '333444' },
      ],
      ['123', '456']
    )
    const { excludeFiles, existFiles, waitLinkFiles, cacheFiles } =
      await analyse({
        source: '',
        dest: '',
        include: m(['**']),
        exclude: m(['**.mkv']),
      })
    expect(excludeFiles.length).toEqual(1)
    expect(existFiles.length).toEqual(0)
    expect(cacheFiles.length).toEqual(0)
    expect(waitLinkFiles.length).toEqual(1)
    expect(waitLinkFiles).toEqual([
      {
        destDir: path.resolve('/c'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/c/d.mp4',
        copy: false,
      },
    ])
  })
  test('should cache some files with openCache', async () => {
    vi.spyOn(cacheRecord, 'read').mockImplementationOnce(() => {
      return ['/c/d.mp4']
    })
    mockParse(
      [
        { fullPath: '/a/b.mkv', inode: '1234' },
        { fullPath: '/c/d.mp4', inode: '333444' },
      ],
      ['123', '456']
    )
    const { excludeFiles, existFiles, waitLinkFiles, cacheFiles } =
      await analyse({
        source: '',
        dest: '',
        include: m(['**']),
        exclude: m(),
        openCache: true,
      })
    expect(excludeFiles.length).toEqual(0)
    expect(existFiles.length).toEqual(0)
    expect(cacheFiles.length).toEqual(1)
    expect(waitLinkFiles.length).toEqual(1)
    expect(waitLinkFiles).toEqual([
      {
        destDir: path.resolve('/a'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/a/b.mkv',
        copy: false,
      },
    ])
  })
  test('should not cache file without openCache', async () => {
    vi.spyOn(cacheRecord, 'read').mockImplementationOnce(() => {
      return ['/c/d.mp4']
    })
    mockParse(
      [
        { fullPath: '/a/b.mkv', inode: '1234' },
        { fullPath: '/c/d.mp4', inode: '333444' },
      ],
      ['123', '456']
    )
    const { excludeFiles, existFiles, waitLinkFiles, cacheFiles } =
      await analyse({
        source: '',
        dest: '',
        include: m(['**']),
        exclude: m(),
      })
    expect(excludeFiles.length).toEqual(0)
    expect(existFiles.length).toEqual(0)
    expect(cacheFiles.length).toEqual(0)
    expect(waitLinkFiles.length).toEqual(2)
    expect(waitLinkFiles).toEqual([
      {
        destDir: path.resolve('/a'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/a/b.mkv',
        copy: false,
      },
      {
        destDir: path.resolve('/c'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/c/d.mp4',
        copy: false,
      },
    ])
  })
  test('should mark copy files', async () => {
    mockParse(
      [
        { fullPath: '/a/b.nfo', inode: '444555' },
        { fullPath: '/a/c.mkv', inode: '333444' },
      ],
      ['123', '456']
    )
    const { waitLinkFiles } = await analyse({
      source: '',
      dest: '',
      include: m(['**']),
      exclude: m(),
      copy: m(['**/*.nfo']),
    })
    expect(waitLinkFiles).toEqual([
      {
        destDir: path.resolve('/a'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/a/b.nfo',
        copy: true,
      },
      {
        destDir: path.resolve('/a'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/a/c.mkv',
        copy: false,
      },
    ])
  })
  test('should mark copy files by regexps', async () => {
    mockParse(
      [
        { fullPath: '/a/backdrop.jpg', inode: '444555' },
        { fullPath: '/a/xxx-backdrop.jpg', inode: '444556' },
        { fullPath: '/a/poster.jpg', inode: '333444' },
      ],
      ['123', '456']
    )
    const { waitLinkFiles } = await analyse({
      source: '',
      dest: '',
      include: m(['**']),
      exclude: m(),
      copy: m([], ['backdrop\\.jpg$']),
    })
    expect(waitLinkFiles).toEqual([
      {
        destDir: path.resolve('/a'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/a/backdrop.jpg',
        copy: true,
      },
      {
        destDir: path.resolve('/a'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/a/xxx-backdrop.jpg',
        copy: true,
      },
      {
        destDir: path.resolve('/a'),
        originalDest: '',
        originalSource: '',
        sourcePath: '/a/poster.jpg',
        copy: false,
      },
    ])
  })
})
