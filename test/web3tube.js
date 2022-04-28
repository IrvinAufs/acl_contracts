const Web3Tube = artifacts.require("Web3Tube");
const AuroraToken = artifacts.require('AuroraToken');
const truffleAssert = require('truffle-assertions');

contract("Web3Tube Events Test", (accounts) => {
    const path = "/dir1";
    const fullPath = "/Web3Tube" + path;
    const filePath = fullPath + "/movie1.mp4";
    const cid = "0x6b18e70d5beb530a13e867a82444ac6b064697ab59818a868d32c3dea33d507c";

    it("should emit SetDelegate event", async () => {
        const web3tube = await Web3Tube.deployed();

        let result = await web3tube.setDelegate.sendTransaction(path, 1, false, {from: accounts[1]});
        truffleAssert.eventEmitted(result, "$SetDelegate", (ev) => {
            return ev.domain.startsWith("aufs://") &&
                ev.domain.substring("aufs://".length) === accounts[1].toLowerCase() &&
                ev.path === fullPath &&
                ev.pathAttr == 1 &&
                ev.remove === false &&
                ev.trustee == web3tube.address;
        });
    });

    it("should emit SetURI event", async () => {
        const web3tube = await Web3Tube.deployed();

        await web3tube.setDelegate.sendTransaction(path, 2, false, {from: accounts[1]});

        await web3tube.setAuthorization.sendTransaction(path, 4294967295, {from: accounts[1]});

        let result = await web3tube.methods['setURI(address,string,bytes32)'].sendTransaction(accounts[1], filePath, cid);
        truffleAssert.eventEmitted(result, "$SetURI", (ev) => {
            return ev.domain.startsWith("aufs://") &&
                ev.domain.substring("aufs://".length) === accounts[1].toLowerCase() &&
                ev.path === filePath &&
                ev.hash === cid;
        });
    });

    it("test transfer", async () => {
        const web3tube = await Web3Tube.deployed();
        const token = await AuroraToken.deployed();

        let balance1, balance2, taxes;

        await token.methods['transfer(address,uint256)'].sendTransaction(accounts[2], web3.utils.toBN('1000000000') * 10, {from: accounts[0]});

        await web3tube.setDelegate.sendTransaction(path, 1, false, {from: accounts[1]});
        await web3tube.setDelegate.sendTransaction(path, 2, false, {from: accounts[1]});

        await web3tube.setAuthorization.sendTransaction(path, 4294967295, {from: accounts[1]});

        await web3tube.methods['setURI(address,string,bytes32)'].sendTransaction(accounts[1], filePath, cid);

        balance1 = await token.balanceOf(accounts[1]);
        console.log("before transfer account1 balance:" + (balance1/1e9).toString());

        balance2 = await token.balanceOf(accounts[2]);
        console.log("before transfer account2 balance:" + (balance2/1e9).toString());

        taxes = await web3tube.totalTaxes();
        console.log("web3tube total taxes:" + (taxes/1e9));

        let data = web3.eth.abi.encodeParameters(['string', 'address', 'uint32'], [filePath, accounts[1], '300']);
        let value = web3.utils.toBN('1000000000') * 10;
        let result = await token.methods['transfer(address,uint256,bytes)'].sendTransaction(web3tube.address, value, web3.utils.hexToBytes(data), {from: accounts[2]});

        web3.eth.getBlockNumber().then((n) => {
            console.log("current block number: " + n);
        });

        let check = result.receipt.rawLogs.some((log) => {
            return log.topics[0] === web3.utils.sha3('$SetAuthorization(string,string,uint8,address,uint32)');
        });
        assert.ok(check, "Event of type $SetAuthorization was not emitted")

        balance1 = await token.balanceOf(accounts[1]);
        console.log("after transfer account1 balance:" + (balance1/1e9).toString());

        balance2 = await token.balanceOf(accounts[2]);
        console.log("after transfer account2 balance:" + (balance2/1e9).toString());

        taxes = await web3tube.totalTaxes();
        console.log("web3tube total taxes:" + (taxes/1e9));

        if (taxes > 0) {
            await web3tube.withdrawTax.sendTransaction(accounts[3], taxes, {from: accounts[0]});

            taxes = await web3tube.totalTaxes();
            console.log("after withdraw, web3tube total taxes:" + (taxes/1e9));

            let balance3 = await token.balanceOf(accounts[3]);
            console.log("after transfer account3 balance:" + (balance3/1e9).toString());
        }
    });
});
