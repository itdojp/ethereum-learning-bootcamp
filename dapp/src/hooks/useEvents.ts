import { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';

const EVENT_ABI = ['event TransferLogged(address indexed from, address indexed to, uint256 amount)'];

type TransferLog = {
  blockNumber: number;
  from: string;
  to: string;
  amount: string;
  txHash: string;
};

export function useTransferEvents(address: string | undefined) {
  const [logs, setLogs] = useState<TransferLog[]>([]);
  const unsub = useRef<() => void>();

  useEffect(() => {
    if (!address) return;
    if (!(window as any).ethereum) return;
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const iface = new ethers.Interface(EVENT_ABI);
    const topic = iface.getEvent('TransferLogged')?.topicHash;
    if (!topic) return;
    const filter = { address, topics: [topic] };
    const handler = (log: any) => {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (!parsed) return;
      setLogs((prev) =>
        [
          {
            blockNumber: Number(log.blockNumber),
            from: String(parsed.args.from),
            to: String(parsed.args.to),
            amount: parsed.args.amount.toString(),
            txHash: String(log.transactionHash ?? '0x0')
          },
          ...prev
        ].slice(0, 30)
      );
    };
    (provider as any).on(filter, handler);
    unsub.current = () => (provider as any).off(filter, handler);
    return () => {
      unsub.current?.();
    };
  }, [address]);

  return logs;
}
