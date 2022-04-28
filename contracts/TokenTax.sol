// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract TokenTax {

    uint8 _taxRate;

    uint256 _totalTaxes;

    constructor(uint8 taxRate_) {
        require(taxRate_ > 0 && taxRate_ < 100, "invalid tax rate");
        _taxRate = taxRate_;
    }

    function setTaxRate(uint8 newRate) public virtual returns (bool success) {
        require(newRate > 0, "tax rate must larger than zero");
        require(newRate < 100, "tax rate must less than 100");

        _taxRate = newRate;

        return true;
    }

    function taxRate() public virtual view returns (uint8 rate) {
        return _taxRate;
    }

    function totalTaxes() public virtual view returns (uint256 total) {
        return _totalTaxes;
    }

    function withdrawTax(address account, uint value) public virtual returns (bool success);

    function payTax(uint value) internal virtual returns (uint taxed);
}
