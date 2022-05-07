const Web3Tube = artifacts.require('Web3Tube');
const AuroraToken = artifacts.require('AuroraToken');

module.exports = function (deployer, _, accounts) {
    deployer.deploy(AuroraToken, web3.utils.toBN('1000') * 100, {from: accounts[0]})
        .then(function (instance) {
            return deployer.deploy(Web3Tube, 30, web3.utils.toBN('100') * 1, "aufs", "/Web3Tube", instance.address, {
                from: accounts[0]
            });
        });
};
