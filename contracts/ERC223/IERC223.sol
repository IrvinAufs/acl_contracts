// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../utils/Address.sol";
import "./IERC223Recipient.sol";

/**
 * @dev Interface of the ERC223 standard token as defined in the EIP.
 */

abstract contract IERC223 is ERC20 {

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    /**
      * @dev Transfers `value` tokens from `msg.sender` to `to` address with `data` parameter
     * and returns `true` on success.
     */
    function transfer(address to, uint amount, bytes calldata data) external virtual returns (bool success);

    /**
     * @dev See {ERC20-_transfer}. Allow pass some custom data to function.
     */
    function _transfer(address from, address to, uint256 amount, bytes memory data) internal virtual {
        _beforeTokenTransfer(from, to, amount, data);

        super._transfer(from, to, amount);

        _afterTokenTransfer(from, to, amount, data);
    }

    /**
     * @dev See {ERC20-_beforeTokenTransfer}. Allow pass some custom data to function.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) internal virtual {}

    /**
     * @dev See {ERC20-_afterTokenTransfer}. Allow pass some custom data to function.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) internal virtual {}
}
