const Web3Tube = artifacts.require("Web3Tube");
const AuroraToken = artifacts.require('AuroraToken');
const truffleAssert = require('truffle-assertions');

contract("Web3Tube Events Test", (accounts) => {
    const path = "/dir1";
    const fullPath = "/Web3Tube" + path;
    const filePath = fullPath + "/movie1.mp4";
    const cid = "0x6b18e70d5beb530a13e867a82444ac6b064697ab59818a868d32c3dea33d507c";

    it("only owner can change", async () => {
        const web3tube = await Web3Tube.deployed();

        let defaultPrice = await web3tube.defaultPrice();
        let updatedPrice = defaultPrice * 2;

        await truffleAssert.fails(web3tube.setDefaultPrice.sendTransaction(updatedPrice, {from: accounts[1]}));
        let currentPrice = await web3tube.defaultPrice();
        assert.ok(currentPrice.toString() === defaultPrice.toString(), "price update");

        await truffleAssert.passes(web3tube.setDefaultPrice.sendTransaction(updatedPrice, {from: accounts[0]}));
        currentPrice = await web3tube.defaultPrice();
        assert.ok(currentPrice.toString() === updatedPrice.toString(), "price not update");
    })

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

    it("update price", async () => {
        const web3tube = await Web3Tube.deployed();

        let defaultPrice = await web3tube.defaultPrice();
        let userPrice = await web3tube.defaultPrice.call({from: accounts[1]});
        assert.ok(defaultPrice.toString() === userPrice.toString(), "user price not equal to default price");

        let updatedPrice = web3.utils.toBN('100') * 10;
        assert(updatedPrice.toString() !== defaultPrice.toString());
        await truffleAssert.passes(web3tube.setUserPrice.sendTransaction(updatedPrice, {from: accounts[1]}));
        userPrice = await web3tube.defaultPrice.call({from: accounts[1]});
        assert.ok(userPrice.toString() === updatedPrice.toString(), "user price not update");

        let currentDefaultPrice = await web3tube.defaultPrice();
        assert.ok(currentDefaultPrice.toString() === defaultPrice.toString(), "default price updated");

        let updatedDefaultPrice = web3.utils.toBN('100') * 7;
        assert.ok(updatedDefaultPrice.toString() !== defaultPrice.toString());
        await truffleAssert.passes(web3tube.setDefaultPrice.sendTransaction(updatedDefaultPrice));
        userPrice = await web3tube.defaultPrice.call({from: accounts[1]});
        let userPrice1 = await web3tube.defaultPrice.call({from: accounts[2]});
        assert.ok(userPrice.toString() === updatedPrice.toString() && userPrice.toString() !== updatedDefaultPrice.toString(), "user price not equal to updated value");
        assert.ok(userPrice1.toString() === updatedDefaultPrice.toString(), "user1 price not equal to updated default");
    });

    it("test transfer", async () => {
        const web3tube = await Web3Tube.deployed();
        const token = await AuroraToken.deployed();

        let defaultPrice = await web3tube.defaultPrice();

        let balance1, balance2, taxes;

        await token.methods['transfer(address,uint256)'].sendTransaction(accounts[2], web3.utils.toBN('100') * 30, {from: accounts[0]});

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

        let value = web3.utils.toBN('100') * 3;
        assert.ok(value < defaultPrice, "current paid price must lower than default");
        truffleAssert.reverts(token.methods['transfer(address,uint256,bytes)'].sendTransaction(web3tube.address, value, web3.utils.hexToBytes(data), {from: accounts[2]}), "paid price is too low");
        let currentBalance2 = await token.balanceOf(accounts[2]);
        assert.ok(currentBalance2.toString() === balance2.toString(), "account2 paid success");
        let currentBalance1 = await token.balanceOf(accounts[1]);
        assert.ok(currentBalance1.toString() === balance1.toString(), "account1 got money from account1");

        let result = await token.methods['transfer(address,uint256,bytes)'].sendTransaction(web3tube.address, defaultPrice, web3.utils.hexToBytes(data), {from: accounts[2]});

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
