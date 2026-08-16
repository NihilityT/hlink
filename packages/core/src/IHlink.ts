export namespace IHlink {
  export type Rule = {
    exts?: Array<string>
    globs?: Array<string>
    regexps?: Array<string>
  }
  /**
   * @description 格式化后的匹配规则（glob 与正则）
   */
  export type RuleMatcher = {
    globs: string[]
    regexps: string[]
  }
  /**
   * @description 数组形式的映射项，保持键值对象形式，source 为键、dest 为值
   */
  export type PathsMappingItem = Record<string, string | string[]>
  /**
   * @description 原路径和目标路径的映射关系，支持键值对象或数组两种形态
   */
  export type PathsMapping =
    | Record<string, string | string[]>
    | PathsMappingItem[]
  /**
   * @description 归一化后的源目标对
   */
  export type PathsMappingPair = {
    source: string
    dest: string
  }
  export interface Options {
    /**
     * @description 原路径和目标路径的映射关系
     */
    pathsMapping: PathsMapping
    /**
     * @description 包含
     */
    include?: Rule | string[] | string
    /**
     * @description 排除
     */
    exclude?: Rule | string[] | string
    /**
     * @description 需要复制而非硬链接的文件规则
     */
    copy?: Rule | string[] | string
  }
}
