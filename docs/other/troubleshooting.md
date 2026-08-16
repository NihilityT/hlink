# 常见问题

## 1. 如何在 Windows 上使用 hlink

请下载[gitforwindows](https://gitforwindows.org/) 安装时记得带上`git bash`，即可以正常使用`hlink`。Windows 自带的 powershell 和 cmd 不支持

## 2. 可以跨盘和跨共享文件夹使用吗

> 报错关键字`Invalid cross-device link`

不行，这是文件系统的限制：硬链接不能跨文件系统（跨盘、跨共享文件夹）创建。`hlink` 底层通过系统调用直接创建硬链接，与系统 `ln` 命令受同样的限制。最简单就是自己使用 `ln 源文件 目标文件` 来尝试(ln 注意必须是文件)，如果系统命令都出错了，那 hlink 也就不行了。

## 3. hlink 支持的 nodejs 版本？

> 报错关键字`supported by the default ESM loader`

`14.14` 或者 `>=16`，建议直接装最新的 lts 版本。[如何管理 nodejs 版本?](../install/nodejs.md)

## 4. 没有执行权限

> 报错关键字`Permission denied`

可以尝试使用`sudo hlink`来执行

## 5. 操作不被允许

> 报错关键字`Operation not permitted`

硬链接操作被系统拒绝，通常是源路径是目录、或文件系统不支持硬链接（如 FAT/exFAT、部分网络挂载）。这类情况 `sudo` 也无法解决。

## 6. 目标地址存在同名文件

> 报错关键字`File exists`

尝试删除目标地址同名文件，重试
