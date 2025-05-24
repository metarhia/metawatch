# Changelog

## [Unreleased][unreleased]

## [1.2.3][] - 2025-05-21

- Add node.js 24 to CI
- Update dependencies

## [1.2.2][] - 2024-08-30

- Update eslint to 9.x and prettier with configs
- Add node.js 22 to CI

## [1.2.1][] - 2023-12-11

- Update dependencies and package maintenance

## [1.2.0][] - 2023-10-27

- Update dependencies and package maintenance
- Drop node 16 and 19 support, add node 21

## [1.1.1][] - 2023-06-04

- Fix options.timeout and don't use setTimeout for zero

## [1.1.0][] - 2023-06-03

- Add events `before` and `after` receiving `changes[]`
- Clone queue iteration to avoid infinite loop
- Improve tests

## [1.0.8][] - 2023-03-29

- Drop node.js 14 support, add node.js 20
- Convert package_lock.json to lockfileVersion 2
- Update dependencies

## [1.0.7][] - 2022-11-17

- Package maintenance

## [1.0.6][] - 2022-07-07

- Package maintenance

## [1.0.5][] - 2022-03-18

- Refresh package and update dependencieas

## [1.0.4][] - 2021-07-17

- Fix zero timeout
- Move types to package root

## [1.0.3][] - 2021-04-07

- Remove watcher on delete directory
- Update readme: badges and example

## [1.0.2][] - 2021-03-24

- Optimize queue, use Set instead of two arrays
- Change event names: 'rename' to 'change'
- Do not ignore events, use deduplication ginstead

## [1.0.1][] - 2021-03-23

- Fixed bug: access to Map interface
- Typing .d.ts added

## [1.0.0][] - 2021-03-21

- Watch directories recursive
- Rebuild recursive when new directories found or old directories remove
- Deduplicate events with configurable timeout
- New 'delete' event ('rename' event if ENOENT)
- Prevent duplicate path concatination

[unreleased]: https://github.com/metarhia/metawatch/compare/v1.2.3...HEAD
[1.2.3]: https://github.com/metarhia/metawatch/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/metarhia/metawatch/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/metarhia/metawatch/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/metarhia/metawatch/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/metarhia/metawatch/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/metarhia/metawatch/compare/v1.0.8...v1.1.0
[1.0.8]: https://github.com/metarhia/metawatch/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/metarhia/metawatch/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/metarhia/metawatch/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/metarhia/metawatch/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/metarhia/metawatch/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/metarhia/metawatch/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/metarhia/metawatch/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/metarhia/metawatch/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metarhia/metawatch/releases/tag/v1.0.0
