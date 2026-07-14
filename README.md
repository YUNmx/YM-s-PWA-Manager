# YM's PWA Manager / YM的PWA管理器

## Introduction / 介绍

Used to extend the recognition domain of PWA applications in Chrome. When clicking on the redirect links of these domains, new PWA windows and Chrome tabs will not be created, but will be opened within the original PWA window, making PWA applications closer to the experience of native desktop applications.

用于扩展Chrome中PWA应用的识别域名，当点击这些域名的跳转链接时，不会创建新的PWA窗口和Chrome标签页，而是在原本PWA窗口内打开，使PWA应用更接近原生桌面应用的体验。

## Warning / 注意

**The following are known bugs**
**以下是已知bug**

- ~~This mechanism will also be applied in non PWA applications~~ **Fixed**
- ~~Always match according to the domain name matching rules of the currently opened URL, rather than matching based on the starting domain name of the PWA application~~ **Fixed**
- The redirected window will display an address bar

- ~~在非PWA应用内也会应用该机制~~ **已修复**
- ~~始终按照当前打开网址的域名匹配规则，而不是根据PWA应用的起始域名匹配~~ **已修复**
- 跳转的窗口会显示地址栏（Chromium 层面安全限制，暂无扩展侧解决方案）
