import { ethers } from 'hardhat';

async function main() {
  const network = await ethers.provider.getNetwork();
  const signers = await ethers.getSigners();
  const sender = signers[0];
  if (!sender) throw new Error('no signer available');
  const to = process.env.TO || signers[1]?.address || sender.address;
  const value = ethers.parseEther(process.env.VALUE_ETH || '0.0001');
  const start = Date.now();
  const tx = await sender.sendTransaction({ to, value });
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
        valueWei: value.toString(),
        gasUsed: gasUsed.toString(),
        effGasPriceWei: effectivePrice.toString(),
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
