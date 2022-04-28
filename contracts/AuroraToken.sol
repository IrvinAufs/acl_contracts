// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC223/IERC223.sol";
import "./ERC223/IERC223Recipient.sol";
import "./utils/Address.sol";

contract AuroraToken is IERC223, Ownable {
    constructor(uint256 amount) IERC223("AuroraFS Token", "AUFS") {
        _mint(_msgSender(), amount);
    }

    function transfer(address to, uint amount, bytes calldata data) external override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount, data);
        return true;
    }

    function decimals() public view override returns (uint8) {
        return 9;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount, bytes memory data) internal override {
        if (Address.isContract(to))
            IERC223Recipient(to).tokenReceived(from, amount, data);
    }
}
