const Web3Tube = artifacts.require('Web3Tube');
const AuroraToken = artifacts.require('AuroraToken');

module.exports = function(deployer, _, accounts) {
    deployer.deploy(AuroraToken, web3.utils.toBN('1000000000') * 1000, {from: accounts[0]}).then(function (instance) {
        return deployer.deploy(Web3Tube, 30, "aufs", "/Web3Tube", instance.address, {from: accounts[0]});
    });
};
