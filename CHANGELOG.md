# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2023-11-27
### Changed
- Fixed type event arguments of onProcessingEnd method and Improved event handling. 

## [1.0.4] - 2023-11-24
### Changed
- Switched from `node:events` to `events` module to enhance compatibility with React and other front-end frameworks. This change enables the code to work seamlessly not just in Node.js environments but also in various front-end scenarios, offering a more versatile and robust solution for event handling.

## [1.0.3] - 2023-11-23
### Changed
- Updated the `package.json` file to include the `types` field, which specifies the location of the TypeScript type definitions file.

## [1.0.2] - 2023-10-18
### Changed
- Better Export Default Declaration for TypeScript Support, which enables the library to be imported as a default export in TypeScript projects.

## [1.0.1] - 2023-06-15
### Added
- Initial release of the library.
