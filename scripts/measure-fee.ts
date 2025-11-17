import { ethers } from 'hardhat';

async function main() {
  const network = await ethers.provider.getNetwork();
  const [sender, receiver] = await ethers.getSigners();
  const start = Date.now();
  const tx = await sender.sendTransaction({ to: receiver.address, value: ethers.parseEther('0.0001') });
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
