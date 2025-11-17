import { ethers } from 'hardhat';

async function main() {
  const address = process.env.EVT;
  if (!address) throw new Error('EVT env var required');
  const [a, b] = await ethers.getSigners();
  const abi = [
    'function mint(uint256)',
    'function transfer(address,uint256)',
    'event TransferLogged(address indexed,address indexed,uint256)'
  ];
  const contract = new ethers.Contract(address, abi, a);
  await (await contract.mint(1000n)).wait();
  await (await contract.transfer(b.address, 123n)).wait();
  console.log('transfer complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
