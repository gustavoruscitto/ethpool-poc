// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;
//import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract ETHPool is Ownable {
  event rewardDistributed(uint256 number);

  constructor() Ownable() {}

  struct balance {
    uint256 eth;
    bool exists;
  }

  mapping(address => balance) public balancesOf;
  address[] accounts;

  function deposit() public payable {
    require(msg.value > 0, "must deposit some eth");
    if (!balancesOf[msg.sender].exists) {
      accounts.push(msg.sender);
      balancesOf[msg.sender].exists = true;
    }
    balancesOf[msg.sender].eth += msg.value;
  }

  function withdraw(uint256 amount) public {
    require(
      amount <= balancesOf[msg.sender].eth,
      "cannot withdraw more than you have!"
    );
    balancesOf[msg.sender].eth -= amount;
    payable(msg.sender).transfer(amount);
  }

  function getMyBalance() public view returns (uint256) {
    return balancesOf[msg.sender].eth;
  }

  function getTotalEthBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function distributeReward() public payable onlyOwner {
    require(msg.value > 0, "must deposit some eth");
    uint256 total = address(this).balance - msg.value;
    for (uint256 i = 0; i < accounts.length; i++) {
      address account = accounts[i];
      balancesOf[account].eth += (msg.value * balancesOf[account].eth) / total;
      emit rewardDistributed(msg.value);
    }
  }
}
