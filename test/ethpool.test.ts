import "@nomiclabs/hardhat-ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ETHPool, ETHPool__factory } from "../build/types";
import { itShouldThrow } from "./utils";

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
    const contract = await ethPool.deployed();
    const initialBalance = await ethPool.getMyBalance();

    // 3
    expect(initialBalance).to.eq(0);
  });

  describe("deposit", async () => {
    it("should be deposited", async () => {
      await ethPool
        .connect(signers[0])
        .deposit({ value: ethers.BigNumber.from(100) });
      const currentUser0Balance = await ethPool
        .connect(signers[0])
        .getMyBalance();
      expect(currentUser0Balance).to.eq(100);
      let currentTotalBalance = await ethPool.getTotalEthBalance();
      expect(currentTotalBalance).to.eq(100);

      await ethPool.connect(signers[1]).deposit({ value: 50 });
      const currentUser1Balance = await ethPool
        .connect(signers[1])
        .getMyBalance();
      expect(currentUser1Balance).to.eq(50);

      currentTotalBalance = await ethPool.getTotalEthBalance();
      expect(currentTotalBalance).to.eq(150);
    });
  });

  describe("withdraw", async () => {
    it("can withdraw", async () => {
      await ethPool.deposit({ value: 100 });
      let currentUser0Balance = await ethPool.getMyBalance();
      expect(currentUser0Balance).to.eq(100);
      await ethPool.withdraw(70);
      currentUser0Balance = await ethPool.getMyBalance();
      expect(currentUser0Balance).to.eq(30);
      //console.log(ethers.utils.formatEther(currentUser0Balance))
    });
    it("cannot withdraw", async () => {
      await ethPool.deposit({ value: 100 });

      itShouldThrow(
        "insufficient funds",
        async () => {
          await ethPool.withdraw(110);
        },
        "revert"
      );

      const currentUser0Balance = await ethPool.getMyBalance();
      expect(currentUser0Balance).to.eq(100);
    });
  });

  describe("reward", async () => {
    it("obtains reward", async () => {
      await ethPool
        .connect(signers[0])
        .deposit({ value: ethers.BigNumber.from(80) });

      await ethPool.connect(signers[1]).deposit({ value: 20 });

      await ethPool.distributeReward({ value: 500 });

      await ethPool.withdraw(480);
      const currentUser0Balance = await ethPool.getMyBalance();
      expect(currentUser0Balance).to.eq(0);
      //console.log(ethers.utils.formatEther(currentUser0Balance))
    });
    it("doesn't obtain reward", async () => {
      await ethPool
        .connect(signers[0])
        .deposit({ value: ethers.BigNumber.from(80) });

      await ethPool.connect(signers[1]).deposit({ value: 20 });

      await ethPool.distributeReward({ value: 500 });

      let error: any;
      try {
        await ethPool.withdraw(500);
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(Error);
      const currentUser0Balance = await ethPool.getMyBalance();
      expect(currentUser0Balance).to.eq(480);
    });
  });

  describe("reward for small stakes", async () => {
    it("obtains reward", async () => {
      //1000 ethers
      await ethPool
        .connect(signers[0])
        .deposit({ value: ethers.BigNumber.from("1000000000000000000000") });

      //0.1 ether
      await ethPool
        .connect(signers[1])
        .deposit({ value: ethers.BigNumber.from("100000000000000000") });

      //0.5 ether
      await ethPool.distributeReward({
        value: ethers.BigNumber.from("500000000000000000"),
      });

      const currentUser1Balance = await ethPool
        .connect(signers[1])
        .getMyBalance();

      expect(currentUser1Balance).to.eq(
        ethers.BigNumber.from("100049995000499950")
      );
    });
  });
});
