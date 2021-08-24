// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "hardhat/console.sol";

//references
//https://programtheblockchain.com/posts/2018/01/05/writing-a-banking-contract/
//https://medium.com/@robhitchens/solidity-crud-epilogue-e563e794fde
//https://uploads-ssl.webflow.com/5ad71ffeb79acc67c8bcdaba/5ad8d1193a40977462982470_scalable-reward-distribution-paper.pdf

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ETHPool2 is ERC20, Ownable {
  event rewardDistributed(uint256 number);

  constructor() ERC20("HappyToken", "HTK") Ownable() {}

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }

  struct balance {
    uint256 eth;
    uint256 reward;
    bool exists;
  }

  mapping(address => balance) public balancesOf;
  address[] accounts;

  function depositEth() public payable {
    require(msg.value > 0, "must deposit some eth");
    if (!balancesOf[msg.sender].exists) {
      accounts.push(msg.sender);
      balancesOf[msg.sender].exists = true;
    }
    balancesOf[msg.sender].eth += msg.value;
  }

  function withdrawEth(uint256 amount) public {
    require(
      amount <= balancesOf[msg.sender].eth,
      "cannot withdraw more than you have!"
    );
    balancesOf[msg.sender].eth -= amount;
    payable(msg.sender).transfer(amount);
  }

  function getMyEthBalance() public view returns (uint256) {
    return balancesOf[msg.sender].eth;
  }

  function getMyRewardBalance() public view returns (uint256) {
    return balancesOf[msg.sender].reward;
  }

  function getTotalEthBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function distributeReward(uint256 totalReward) public onlyOwner {
    for (uint256 i = 0; i < accounts.length; i++) {
      address account = accounts[i];
      //TODO: fix this hack
      uint256 stake =
        (balancesOf[account].eth * 1000000) / address(this).balance;
      balancesOf[account].reward = (totalReward * stake) / 1000000;
      emit rewardDistributed(totalReward);
    }
  }

  function withdrawReward(uint256 amount) public {
    require(
      amount <= balancesOf[msg.sender].reward,
      "cannot withdraw more than you have!"
    );
    balancesOf[msg.sender].reward -= amount;
    _mint(msg.sender, amount);
  }
}
