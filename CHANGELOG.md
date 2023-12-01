# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.5] - 2023-12-01
### Changed
removed publish script from package.json to avoid confusion with npm publish command, which is the recommended way to publish a package to npm.
adding building script to prepublishOnly script to ensure that the package is built before publishing it to npm.

## [1.1.4] - 2023-12-01
### Changed
publish script to be included in package.json

## [1.1.3] - 2023-12-01
### Changed
Documentation improvements and minor bug fixes.

## [1.1.2] - 2023-11-29
### Changed
Generators are now supported as data types, and their use within the engine enhances memory efficiency and minimizes data duplication.

## [1.1.1] - 2023-11-28
### Changed
- AsyncBatch can be instantiated with new promise run method simplifying the usage for a simple use case. 
- New promised events
- Documentation improvements
- New example file 

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
