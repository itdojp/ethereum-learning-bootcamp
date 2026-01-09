import { ethers } from 'hardhat';

async function main() {
  const address = process.env.EVT;
  if (!address) throw new Error('EVT env var required');
  const signers = await ethers.getSigners();
  const sender = signers[0];
  if (!sender) throw new Error('no signer available');
  const to = process.env.TO || signers[1]?.address || sender.address;
  const abi = [
    'function mint(uint256)',
    'function transfer(address,uint256)',
    'event TransferLogged(address indexed,address indexed,uint256)'
  ];
  const contract = new ethers.Contract(address, abi, sender);
  await (await contract.mint(1000n)).wait();
  await (await contract.transfer(to, 123n)).wait();
  console.log('transfer complete', { to });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
