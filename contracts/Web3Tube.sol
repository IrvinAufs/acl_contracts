// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC223/IERC223.sol";
import "./ERC223/IERC223Recipient.sol";
import "./TokenTax.sol";
import "./Web3Auth.sol";
import "./utils/Address.sol";

contract Web3Tube is Web3Auth, IERC223Recipient, TokenTax, Ownable {

    address private _token;

    uint256 private _defaultPrice;

    constructor(uint8 taxRate, uint256 price, string memory schema, string memory directory, address ERC223Token) Web3Auth(schema, directory) TokenTax(taxRate) {
        require(Address.isContract(ERC223Token));
        _token = ERC223Token;

        _defaultPrice = price;
    }

    function setDelegate(string calldata path, PathAttribute pathAttr, bool remove) external override forwardSlash(path) {
        string memory fullPath = concatPath(path);
        string memory domain = concatDomain(addressToHex(_msgSender()));

        _setDelegate(domain, fullPath, pathAttr, remove, address(this));
    }

    function setAuthorization(string calldata path, uint32 expire) external override forwardSlash(path) {
        address owner = _msgSender();
        uint32 expireUntil = computeExpire(expire);

        setAuthorization(path, PathAttribute.Write, owner, address(this), expireUntil);
    }

    function removeAuthorization(string calldata path, address licensee, PathAttribute pathAttr) external forwardSlash(path) {
        address owner = _msgSender();

        setAuthorization(path, pathAttr, owner, licensee, 0);
    }

    function setURI(string calldata path, bytes32 hash) external forwardSlash(path) {
        string memory fullPath = concatPath(path);
        string memory domain = concatDomain(addressToHex(_msgSender()));

        _setURI(domain, fullPath, hash);
    }

    function setURI(address owner, string calldata path, bytes32 hash) external override onlyOwner forwardSlash(path) {
        string memory fullPath = concatPath(path);
        string memory domain = concatDomain(addressToHex(owner));

        _setURI(domain, fullPath, hash);
    }

    function defaultPrice() public view returns (uint256) {
        return _defaultPrice;
    }

    function tokenReceived(address _from, uint _value, bytes memory _data) public override {
        if (_value < _defaultPrice)
            revert("paid price is too low");

        string memory path;
        address owner;
        uint32 expire;

        (path, owner, expire) = decodeCallbackData(_data);

        uint32 expireUntil = computeExpire(expire);

        uint remainValue = payTax(_value);
        if (!IERC223(_token).transfer(owner, remainValue))
            revert("purchase failed");

        setAuthorization(path, PathAttribute.Read, owner, _from, expireUntil);
    }

    function setTaxRate(uint8 newRate) public override onlyOwner returns (bool success) {
        return super.setTaxRate(newRate);
    }

    function withdrawTax(address account, uint value) public override onlyOwner returns (bool success) {
        require (_totalTaxes >= value);

        _totalTaxes -= value;

        return IERC223(_token).transfer(account, value);
    }

    function setDefaultPrice(uint256 price) public onlyOwner {
        _defaultPrice = price;
    }

    function computeExpire(uint32 value) internal view returns (uint32) {
        uint result = uint(value) + block.number;
        if (result >= uint(type(uint32).max)) {
            return type(uint32).max;
        }

        return uint32(result);
    }

    function addressToHex(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint(uint8(value[i + 12] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(value[i + 12] & 0x0f))];
        }
        return string(str);
    }

    function decodeCallbackData(bytes memory data) internal pure returns (
        string memory _path,
        address _owner,
        uint32 _blocks
    ) {
        return abi.decode(data, (string, address, uint32));
    }

    function setAuthorization(string memory path, PathAttribute pathAttr, address owner, address licensee, uint32 expireUntil) internal forwardSlash(path) {
        string memory fullPath = concatPath(path);
        string memory domain = concatDomain(addressToHex(owner));

        _setAuthorization(domain, fullPath, pathAttr, licensee, expireUntil);
    }

    function payTax(uint value) internal override returns (uint taxed) {
        uint taxes = (_taxRate * value) / 100;
        uint remain = (value * (100 - _taxRate)) / 100;

        require(remain > 0, "value less then zero after taxed");

        _totalTaxes += taxes;

        return remain;
    }
}
