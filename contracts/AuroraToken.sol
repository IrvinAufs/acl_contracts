// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC223/IERC223.sol";
import "./ERC223/IERC223Recipient.sol";
import "./utils/Address.sol";

contract AuroraToken is IERC223, Ownable {

    uint256 private _defaultAmount;

    constructor(uint256 amount) IERC223("AuroraFS Token", "AUFS") {
        setDefaultAmount(amount);
        mint(_msgSender(), _defaultAmount);
    }

    function transfer(address to, uint amount, bytes calldata data) external override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount, data);
        return true;
    }

    function decimals() public view override returns (uint8) {
        return 9;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balanceOf(account, true);
    }

    function defaultAmount() public view returns (uint256) {
        return _defaultAmount;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function setDefaultAmount(uint256 amount) public onlyOwner {
        _defaultAmount = amount;
    }

    function _balanceOf(address account, bool check) internal view returns (uint256 balances) {
        if (!check)
           return super.balanceOf(account);

        balances = super.balanceOf(account);
        if (balances == 0) {
            return _defaultAmount;
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        // skip _mint to call
        if (from == address(0))
            return;

        // skip _burn to call
        if (to == address(0))
            return;

        uint256 balances = _balanceOf(from, false);
        if (balances == 0) {
            _mint(from, _defaultAmount);
        }
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override {
        // skip _mint to call
        if (from == address(0))
            return;

        // skip _burn to call
        if (to == address(0))
            return;

        uint256 balances = _balanceOf(to, false);
        if (balances == amount) {
            _mint(to, _defaultAmount);
        }
    }

    function _afterTokenTransfer(address from, address to, uint256 amount, bytes memory data) internal override {
        if (Address.isContract(to))
            IERC223Recipient(to).tokenReceived(from, amount, data);
    }
}
