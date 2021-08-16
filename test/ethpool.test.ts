import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { BigNumber } from "bignumber.js";

import { ETHPool__factory, ETHPool } from "../build/types";

const { getContractFactory, getSigners } = ethers;

describe("ETHPool", () => {
  let ethPool: ETHPool;
  let signers;

  beforeEach(async () => {
    // 1
    signers = await getSigners();
    // 2
    const ethPoolFactory = (await getContractFactory(
      "ETHPool",
      signers[0]
    )) as ETHPool__factory;
    ethPool = await ethPoolFactory.deploy();
    await ethPool.deployed();
    const initialBalance = await ethPool.getMyEthBalance();

    // 3
    expect(initialBalance).to.eq(0);
  });

  describe("deposit", async () => {
    it("should be deposited", async () => {
      await ethPool
        .connect(signers[0])
        .depositEth({ value: new BigNumber(100).toFixed() });
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

      let error: any;
      try {
        await ethPool.withdrawEth(110);
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(Error);

      const currentUser0Balance = await ethPool.getMyEthBalance();
      expect(currentUser0Balance).to.eq(100);
    });
  });
});
