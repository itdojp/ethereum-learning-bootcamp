import { ethers } from 'hardhat';

async function main() {
  const tokenAddress = process.env.TOKEN;
  if (!tokenAddress) throw new Error('TOKEN env var required');
  const network = await ethers.provider.getNetwork();
  const signers = await ethers.getSigners();
  const owner = signers[0];
  if (!owner) throw new Error('no signer available');
  const to = process.env.TO || signers[1]?.address || owner.address;
  const abi = [
    'function transfer(address,uint256) returns (bool)',
    'function balanceOf(address) view returns (uint256)'
  ];
  const contract = new ethers.Contract(tokenAddress, abi, owner);
  const amount = ethers.parseEther(process.env.AMOUNT_ETH || '0.01');
  const start = Date.now();
  const tx = await contract.transfer(to, amount);
  const receipt = await tx.wait();
  if (!receipt) throw new Error('receipt missing');
  const end = Date.now();
  const gasUsed = receipt.gasUsed ?? 0n;
  const effectivePrice = receipt.effectiveGasPrice ?? 0n;
  const feeWei = gasUsed * effectivePrice;
  console.log(
    JSON.stringify(
        {
          network: network.name,
          chainId: Number(network.chainId),
          txHash: tx.hash,
          to,
          amount: amount.toString(),
          gasUsed: gasUsed.toString(),
          feeEth: ethers.formatEther(feeWei),
          latencyMs: end - start
        },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
