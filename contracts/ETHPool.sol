// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
import "hardhat/console.sol";
import "./HappyToken.sol";

//references
//https://programtheblockchain.com/posts/2018/01/05/writing-a-banking-contract/
//https://medium.com/@robhitchens/solidity-crud-epilogue-e563e794fde
//https://uploads-ssl.webflow.com/5ad71ffeb79acc67c8bcdaba/5ad8d1193a40977462982470_scalable-reward-distribution-paper.pdf


contract ETHPool is Ownable {

  constructor() Ownable() {
  }

  struct balance {
    uint eth;
    uint reward;
    bool exists;
  }

  mapping(address => balance) public balancesOf;
  address[] accounts;
  uint totalReward;
  
  function depositEth() public payable {
    require(msg.value > 0,"must deposit some eth");
    if (!balancesOf[msg.sender].exists){
      accounts.push(msg.sender);
      balancesOf[msg.sender].exists = true;
    }
    balancesOf[msg.sender].eth += msg.value;
  }

  function withdrawEth(uint256 amount) public {
    require(amount <= balancesOf[msg.sender].eth,"cannot withdraw more than you have!");
    balancesOf[msg.sender].eth -= amount;
    payable(msg.sender).transfer(amount);
  }
 
  function getMyEthBalance() public view returns (uint256) {
    return balancesOf[msg.sender].eth;
  }

  function getTotalEthBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function distributeReward() public onlyOwner {
    for (uint i=0; i < accounts.length; i++) {
      address account = accounts[i];
      //TODO: fix possible overflows
      uint stake = balancesOf[account].eth / address(this).balance;
      balancesOf[account].reward = totalReward * stake;
    }
  }

  function withdrawReward(uint256 amount) public {
    require(amount <= balancesOf[msg.sender].reward,"cannot withdraw more than you have!");
    balancesOf[msg.sender].reward -= amount;
    //TODO
    //payable(msg.sender).transfer(amount);
  }

}
