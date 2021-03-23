# Changelog

## [Unreleased][unreleased]

## [1.0.1][] - 2021-03-23

- Fixed bug: access to Map interface
- Typing .d.ts added

## [1.0.0][] - 2021-03-21

- Watch directories recursive
- Rebuild recursive when new directories found or old directories remove
- Deduplicate events with configurable timeout
- New 'delete' event ('rename' event if ENOENT)
- Prevent duplicate path concatination

[unreleased]: https://github.com/metarhia/metawatch/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/metarhia/metawatch/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metarhia/metawatch/releases/tag/v1.0.0
