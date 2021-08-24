import "@nomiclabs/hardhat-ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ETHPool2, ETHPool2__factory } from "../build/types";
import { itShouldThrow } from "./utils";

const { getContractFactory, getSigners } = ethers;

describe("ETHPool2", () => {
  let ethPool: ETHPool2;
  let signers;

  beforeEach(async () => {
    // 1
    signers = await getSigners();
    // 2
    const ethPoolFactory = (await getContractFactory(
      "ETHPool2",
      signers[0]
    )) as ETHPool2__factory;
    ethPool = await ethPoolFactory.deploy();
    const contract = await ethPool.deployed();
    const initialBalance = await ethPool.getMyEthBalance();

    // 3
    expect(initialBalance).to.eq(0);
  });

  describe("deposit", async () => {
    it("should be deposited", async () => {
      await ethPool
        .connect(signers[0])
        .depositEth({ value: ethers.BigNumber.from(100) });
      const currentUser0Balance = await ethPool
        .connect(signers[0])
        .getMyEthBalance();
      expect(currentUser0Balance).to.eq(100);
      let currentTotalBalance = await ethPool.getTotalEthBalance();
      expect(currentTotalBalance).to.eq(100);

      await ethPool.connect(signers[1]).depositEth({ value: 50 });
      const currentUser1Balance = await ethPool
        .connect(signers[1])
        .getMyEthBalance();
      expect(currentUser1Balance).to.eq(50);

      currentTotalBalance = await ethPool.getTotalEthBalance();
      expect(currentTotalBalance).to.eq(150);
    });
  });

  describe("withdraw", async () => {
    it("can withdraw", async () => {
      await ethPool.depositEth({ value: 100 });
      let currentUser0Balance = await ethPool.getMyEthBalance();
      expect(currentUser0Balance).to.eq(100);
      await ethPool.withdrawEth(70);
      currentUser0Balance = await ethPool.getMyEthBalance();
      expect(currentUser0Balance).to.eq(30);
      //console.log(ethers.utils.formatEther(currentUser0Balance))
    });
    it("cannot withdraw", async () => {
      await ethPool.depositEth({ value: 100 });

      itShouldThrow(
        "insufficient funds",
        async () => {
          await ethPool.withdrawEth(110);
        },
        "revert"
      );

      const currentUser0Balance = await ethPool.getMyEthBalance();
      expect(currentUser0Balance).to.eq(100);
    });
  });

  describe("reward", async () => {
    it("obtains reward", async () => {
      await ethPool
        .connect(signers[0])
        .depositEth({ value: ethers.BigNumber.from(80) });

      await ethPool.connect(signers[1]).depositEth({ value: 20 });

      await ethPool.distributeReward(500);

      let balance = await ethPool.getMyRewardBalance();
      expect(balance).to.eq(400);
      await ethPool.withdrawReward(400);

      let myRewardTokens = await ethPool.balanceOf(signers[0].getAddress());
      //console.log(myRewardTokens.toNumber());
      expect(myRewardTokens).to.eq(400);
      balance = await ethPool.getMyRewardBalance();
      expect(balance).to.eq(0);
    });
    it("doesn't obtain reward", async () => {
      await ethPool
        .connect(signers[0])
        .depositEth({ value: ethers.BigNumber.from(80) });

      await ethPool.connect(signers[1]).depositEth({ value: 20 });

      await ethPool.distributeReward(500);

      let balance = await ethPool.getMyRewardBalance();
      expect(balance).to.eq(400);

      let error: any;
      try {
        await ethPool.withdrawReward(500);
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(Error);

      let myRewardTokens = await ethPool.balanceOf(signers[0].getAddress());
      //console.log(myRewardTokens.toNumber());
      expect(myRewardTokens).to.eq(0);
      balance = await ethPool.getMyRewardBalance();
      expect(balance).to.eq(400);
    });
  });
});
