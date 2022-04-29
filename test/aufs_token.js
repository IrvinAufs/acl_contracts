const AuroraToken = artifacts.require('AuroraToken');
const truffleAssert = require('truffle-assertions');

contract("Aurora Token Test", (accounts) => {
    const coinValue = web3.utils.toBN('100');
    const defaultAmount = coinValue * 1000;

    it("always has default amounts", async () => {
        const token = await AuroraToken.deployed();

        let balance0 = await token.balanceOf(accounts[0]);
        assert.ok(defaultAmount.toString() === balance0.toString(), "deployer balance not equal to " + defaultAmount.toString());

        let balance1 = await token.balanceOf(accounts[1]);
        assert.ok(balance1.toString() === defaultAmount.toString(), "account1 balance not equal to " + defaultAmount.toString());

        let result = await token.transfer.sendTransaction(accounts[1], coinValue * 10);
        truffleAssert.eventEmitted(result, "Transfer");
        assert.ok(result.receipt.logs.length == 2);
        assert.ok(result.receipt.logs.some((l) => {
            return l.args.from == '0x0000000000000000000000000000000000000000' && l.args.to == accounts[1];
        }));

        balance0 = await token.balanceOf(accounts[0]);
        assert.ok(balance0.toString() === (coinValue * 990).toString(), "deployer balance not equal to right value: 990");

        balance1 = await token.balanceOf(accounts[1]);
        assert.ok(balance1.toString() === (coinValue * 1010).toString(), "account1 balance not equal to right value: 1010");

        await truffleAssert.reverts(token.transfer.sendTransaction(accounts[1], defaultAmount), "ERC20: transfer amount exceeds balance");

        await truffleAssert.passes(token.transfer.sendTransaction(accounts[1], coinValue * 990));

        balance0 = await token.balanceOf(accounts[0]);
        assert.ok(balance0.toString() === defaultAmount.toString(), "deployer balance not equal to " + defaultAmount.toString());

        balance1 = await token.balanceOf(accounts[1]);
        assert.ok(balance1.toString() === (2 * defaultAmount).toString(), "accounts1 must have double defaultAmounts balance");

        await truffleAssert.passes(token.transfer.sendTransaction(accounts[1], coinValue));
    });
});