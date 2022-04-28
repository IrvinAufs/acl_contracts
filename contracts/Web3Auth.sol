// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./utils/strings.sol";

abstract contract Web3Auth {

    using strings for *;

    enum PathAttribute { Noop, Read, Write }

    string _schema;

    string _directory;

    constructor(string memory schema, string memory directory) {
        require(!strings.endsWith(schema.toSlice(), "://".toSlice()), "invalid schema");
        _schema = schema;

        require(strings.startsWith(directory.toSlice(), "/".toSlice()), "directory must start with forward slash");
        _directory = directory;
    }

    modifier forwardSlash(string memory path) {
        require(strings.startsWith(path.toSlice(), "/".toSlice()), "path must start with forward slash");
        _;
    }

    event $SetDelegate(string domain, string path, PathAttribute pathAttr, bool remove, address trustee);

    event $SetAuthorization(string domain, string path, PathAttribute pathAttr, address licensee, uint32 expireUntil);

    event $SetURI(string domain, string path, bytes32 hash);

    function setDelegate(string calldata path, PathAttribute pathAttr, bool remove) external virtual;

    function setAuthorization(string calldata path, uint32 expire) external virtual;

    function setURI(address owner, string calldata path, bytes32 hash) external virtual;

    function hasDirectory(string memory path) internal view returns (bool) {
        strings.slice memory pathSlice = path.toSlice();

        return strings.startsWith(pathSlice, _directory.toSlice());
    }

    function concatDomain(string memory domain) internal view virtual returns (string memory) {
        return string.concat(_schema, "://", domain);
    }

    function concatPath(string memory path) internal view virtual returns (string memory) {
        if (hasDirectory(path))
            return path;

        return string.concat(_directory, path);
    }

    function _setDelegate(string memory domain, string memory path, PathAttribute pathAttr, bool remove, address trustee) internal virtual {
        emit $SetDelegate(domain, path, pathAttr, remove, trustee);
    }

    function _setAuthorization(string memory domain, string memory path, PathAttribute pathAttr, address licensee, uint32 expireUntil) internal virtual {
        emit $SetAuthorization(domain, path, pathAttr, licensee, expireUntil);
    }

    function _setURI(string memory domain, string memory path, bytes32 hash) internal virtual {
        emit $SetURI(domain, path, hash);
    }
}
