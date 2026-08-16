import { describe, test, expect, vi } from 'vitest'
import path from 'node:path'
import getRmFiles from '../../prune/getRmFiles'
import { cacheRecord } from '../../utils/cacheHelp'

const source1 = 's1'
const source2 = 's2'
const dest1 = 'd1'

const baseOptions = {
  sourceArr: [source1, source2],
  destArr: [dest1],
  include: [],
  exclude: [],
}

import { strMapping } from '../_utils'

vi.mock('../../core/lsirfl.js', () => ({
  default: (p: keyof typeof strMapping) => strMapping[p] || strMapping.s1,
}))

describe('getRmFiles test', () => {
  test('should be passed baseConfig', async () => {
    expect(await getRmFiles(baseOptions)).toEqual([
      path.join('d1', 'd1.mkv'),
      path.join('d1', 'd2.mp4'),
      path.join('d1', 'b.iso'),
    ])
  })
  test('should not filter cache without reverse', async () => {
    const spyCacheRed = vi
      .spyOn(cacheRecord, 'read')
      .mockImplementationOnce(() => {
        return ['d1/d1.mkv']
      })
    expect(await getRmFiles(baseOptions)).toEqual([
      path.join('d1', 'd1.mkv'),
      path.join('d1', 'd2.mp4'),
      path.join('d1', 'b.iso'),
    ])
    spyCacheRed.mockRestore()
  })
  test('should be passed with reverse', async () => {
    expect(
      await getRmFiles({
        ...baseOptions,
        reverse: true,
        sourceArr: [source2],
        destArr: [dest1],
      })
    ).toEqual([
      path.join('s2', 's2a.mkv'),
      path.join('s2', 's2b.mp4'),
      path.join('s2', 's2c.m3'),
    ])
  })
  test('should filter cache with reverse', async () => {
    const spyCacheRed = vi
      .spyOn(cacheRecord, 'read')
      .mockImplementationOnce(() => {
        return [path.join('s2', 's2a.mkv'), path.join('s2', 's2b.mp4')]
      })
    expect(
      await getRmFiles({
        ...baseOptions,
        reverse: true,
        sourceArr: [source2],
        destArr: [dest1],
      })
    ).toEqual([path.join('s2', 's2c.m3')])
    spyCacheRed.mockRestore()
  })
  test('should be passed with deleteDir', async () => {
    expect(
      await getRmFiles({
        ...baseOptions,
        deleteDir: true,
      })
    ).toEqual([path.join('d1', path.sep)])
  })
  test('should be passed with include', async () => {
    expect(
      await getRmFiles({
        ...baseOptions,
        include: ['**.mkv'],
      })
    ).toEqual([path.join('d1', 'd1.mkv')])
  })
  test('should be passed with exclude', async () => {
    expect(
      await getRmFiles({
        ...baseOptions,
        exclude: ['**.mkv'],
      })
    ).toEqual([path.join('d1', 'd2.mp4'), path.join('d1', 'b.iso')])
  })
  test('should be passed with exclude and include', async () => {
    expect(
      await getRmFiles({
        ...baseOptions,
        exclude: ['**.mkv'],
        include: ['**.mkv', '**.mp4'],
      })
    ).toEqual([path.join('d1', 'd2.mp4')])
  })
  test('should filter copy files', async () => {
    expect(
      await getRmFiles({
        ...baseOptions,
        copy: ['**.mkv'],
      })
    ).toEqual([path.join('d1', 'd2.mp4'), path.join('d1', 'b.iso')])
  })
})
