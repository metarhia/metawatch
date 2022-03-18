# Changelog

## [Unreleased][unreleased]

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

[unreleased]: https://github.com/metarhia/metawatch/compare/v1.0.5...HEAD
[1.0.5]: https://github.com/metarhia/metawatch/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/metarhia/metawatch/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/metarhia/metawatch/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/metarhia/metawatch/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/metarhia/metawatch/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metarhia/metawatch/releases/tag/v1.0.0
