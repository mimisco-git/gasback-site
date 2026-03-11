const PORTFOLIO_NETWORKS = [
  { id: 'eth-mainnet', label: 'Ethereum', nativeSymbol: 'ETH' },
  { id: 'base-mainnet', label: 'Base', nativeSymbol: 'ETH' },
  { id: 'arb-mainnet', label: 'Arbitrum', nativeSymbol: 'ETH' },
  { id: 'opt-mainnet', label: 'OP Mainnet', nativeSymbol: 'ETH' },
  { id: 'polygon-mainnet', label: 'Polygon', nativeSymbol: 'POL' },
  { id: 'bnb-mainnet', label: 'BNB Chain', nativeSymbol: 'BNB' },
  { id: 'avax-mainnet', label: 'Avalanche', nativeSymbol: 'AVAX' },
  { id: 'scroll-mainnet', label: 'Scroll', nativeSymbol: 'ETH' },
  { id: 'linea-mainnet', label: 'Linea', nativeSymbol: 'ETH' },
  { id: 'blast-mainnet', label: 'Blast', nativeSymbol: 'ETH' },
  { id: 'zksync-mainnet', label: 'zkSync', nativeSymbol: 'ETH' },
  { id: 'worldchain-mainnet', label: 'World Chain', nativeSymbol: 'ETH' },
  { id: 'unichain-mainnet', label: 'Unichain', nativeSymbol: 'ETH' },
  { id: 'gnosis-mainnet', label: 'Gnosis', nativeSymbol: 'xDAI' },
  { id: 'celo-mainnet', label: 'Celo', nativeSymbol: 'CELO' },
  { id: 'mantle-mainnet', label: 'Mantle', nativeSymbol: 'MNT' },
  { id: 'metis-mainnet', label: 'Metis', nativeSymbol: 'METIS' },
];

const TRANSFER_NETWORKS = [
  { id: 'eth-mainnet', label: 'Ethereum', rpc: 'https://eth-mainnet.g.alchemy.com/v2/' },
  { id: 'base-mainnet', label: 'Base', rpc: 'https://base-mainnet.g.alchemy.com/v2/' },
  { id: 'arb-mainnet', label: 'Arbitrum', rpc: 'https://arb-mainnet.g.alchemy.com/v2/' },
  { id: 'opt-mainnet', label: 'OP Mainnet', rpc: 'https://opt-mainnet.g.alchemy.com/v2/' },
  { id: 'polygon-mainnet', label: 'Polygon', rpc: 'https://polygon-mainnet.g.alchemy.com/v2/' },
  { id: 'bnb-mainnet', label: 'BNB Chain', rpc: 'https://bnb-mainnet.g.alchemy.com/v2/' },
  { id: 'avax-mainnet', label: 'Avalanche', rpc: 'https://avax-mainnet.g.alchemy.com/v2/' },
];

const NFT_NETWORKS = PORTFOLIO_NETWORKS.slice(0, 8);

function badRequest(res, message, code = 400) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: message }));
}

function ok(res, payload) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function addressOk(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || '');
}

function parseNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toBigIntMaybe(value) {
  if (value === undefined || value === null || value === '') return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function hexToBigInt(value) {
  if (!value) return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function formatUnits(value, decimals = 18) {
  const raw = toBigIntMaybe(value);
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;
  const fractionText = fraction.toString().padStart(decimals, '0').slice(0, 6).replace(/0+$/, '');
  return parseFloat(fractionText ? `${whole}.${fractionText}` : `${whole}`);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = json?.error?.message || json?.message || `Request failed with status ${response.status}`;
    throw new Error(error);
  }
  return json;
}

async function fetchTokens(apiKey, address, network) {
  const url = `https://api.g.alchemy.com/data/v1/${apiKey}/assets/tokens/by-address`;
  const body = {
    addresses: [{ address, networks: [network.id] }],
    withMetadata: true,
    withPrices: true,
    includeNativeTokens: true,
    includeErc20Tokens: true,
  };

  try {
    const json = await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const tokens = json?.data?.tokens || [];
    return tokens.map((token) => {
      const decimals = token?.tokenMetadata?.decimals ?? 18;
      const balance = formatUnits(token?.tokenBalance || '0', decimals);
      const price = parseNumber(token?.tokenPrices?.[0]?.value);
      return {
        network: token?.network || network.id,
        chainLabel: network.label,
        tokenAddress: token?.tokenAddress || '',
        symbol: token?.tokenMetadata?.symbol || '',
        name: token?.tokenMetadata?.name || '',
        logo: token?.tokenMetadata?.logo || '',
        balance,
        usdPrice: price,
        usdValue: balance * price,
      };
    }).filter((item) => item.balance > 0);
  } catch {
    return [];
  }
}

async function fetchNfts(apiKey, address, network) {
  const url = `https://api.g.alchemy.com/data/v1/${apiKey}/assets/nfts/by-address`;
  const body = {
    addresses: [{ address, networks: [network.id], excludeFilters: ['SPAM'] }],
    withMetadata: true,
    pageSize: 12,
    orderBy: 'transferTime',
    sortOrder: 'desc',
  };

  try {
    const json = await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const items = json?.data?.ownedNfts || [];
    return items.map((nft) => ({
      chainLabel: network.label,
      name: nft?.name || nft?.raw?.metadata?.name || '',
      collection: nft?.collection?.name || nft?.contract?.name || '',
      image: nft?.image?.thumbnailUrl || nft?.image?.cachedUrl || nft?.image?.pngUrl || '',
    }));
  } catch {
    return [];
  }
}

async function rpcCall(rpcBase, apiKey, payload) {
  return fetchJson(`${rpcBase}${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function normalizeTransfer(transfer, direction, network) {
  const counterparty = direction === 'out' ? transfer?.to : transfer?.from;
  return {
    hash: transfer?.hash,
    chain: network.id,
    chainLabel: network.label,
    direction: direction === 'out' ? 'Outgoing' : 'Incoming',
    asset: transfer?.asset || transfer?.category || 'Asset',
    value: transfer?.value ?? null,
    counterparty,
    time: transfer?.metadata?.blockTimestamp || '',
  };
}

async function fetchTransfers(apiKey, wallet, network) {
  const baseParams = {
    fromBlock: '0x0',
    category: ['external', 'erc20', 'erc721', 'erc1155'],
    withMetadata: true,
    excludeZeroValue: false,
    maxCount: '0x1e',
    order: 'desc',
  };

  try {
    const outgoing = await rpcCall(network.rpc, apiKey, {
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getAssetTransfers',
      params: [{ ...baseParams, fromAddress: wallet }],
    });

    const incoming = await rpcCall(network.rpc, apiKey, {
      jsonrpc: '2.0',
      id: 2,
      method: 'alchemy_getAssetTransfers',
      params: [{ ...baseParams, toAddress: wallet }],
    });

    const outItems = (outgoing?.result?.transfers || []).map((item) => normalizeTransfer(item, 'out', network));
    const inItems = (incoming?.result?.transfers || []).map((item) => normalizeTransfer(item, 'in', network));
    return { outgoing: outItems, incoming: inItems };
  } catch {
    return { outgoing: [], incoming: [] };
  }
}

async function fetchReceipt(rpcBase, apiKey, hash) {
  try {
    const json = await rpcCall(rpcBase, apiKey, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionReceipt',
      params: [hash],
    });
    return json?.result || null;
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const address = typeof req.query.address === 'string' ? req.query.address.trim() : '';

  if (!apiKey) return badRequest(res, 'Missing ALCHEMY_API_KEY environment variable.', 500);
  if (!addressOk(address)) return badRequest(res, 'Invalid wallet address.');

  try {
    const tokenResults = await Promise.all(PORTFOLIO_NETWORKS.map((network) => fetchTokens(apiKey, address, network)));
    const nftResults = await Promise.all(NFT_NETWORKS.map((network) => fetchNfts(apiKey, address, network)));
    const transferResults = await Promise.all(
      TRANSFER_NETWORKS.map((network) => fetchTransfers(apiKey, address, network).then((result) => ({ network, ...result })))
    );

    const tokens = tokenResults.flat().sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
    const nfts = nftResults.flat().slice(0, 6);

    const chainNativePrices = new Map();
    for (const network of PORTFOLIO_NETWORKS) {
      const nativeMatch = tokens.find((token) => token.network === network.id && token.symbol === network.nativeSymbol);
      if (nativeMatch?.usdPrice) chainNativePrices.set(network.id, nativeMatch.usdPrice);
    }

    const allTransfers = [];
    const counterpartyMap = new Map();
    const chains = [];
    let totalGasUsd = 0;

    for (const result of transferResults) {
      const combined = [...result.outgoing, ...result.incoming].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
      allTransfers.push(...combined);

      const localMap = new Map();
      for (const item of combined) {
        if (!item.counterparty || item.counterparty.toLowerCase() === address.toLowerCase()) continue;
        const key = item.counterparty.toLowerCase();
        const existing = counterpartyMap.get(key) || { address: item.counterparty, count: 0, chainLabel: result.network.label };
        existing.count += 1;
        counterpartyMap.set(key, existing);

        const local = localMap.get(key) || { count: 0 };
        local.count += 1;
        localMap.set(key, local);
      }

      let gasWei = 0n;
      const receiptHashes = [...new Set(result.outgoing.map((tx) => tx.hash).filter(Boolean))].slice(0, 12);
      for (const hash of receiptHashes) {
        const receipt = await fetchReceipt(result.network.rpc, apiKey, hash);
        const gasUsed = hexToBigInt(receipt?.gasUsed);
        const price = hexToBigInt(receipt?.effectiveGasPrice || receipt?.gasPrice);
        gasWei += gasUsed * price;
      }

      const gasNative = Number(gasWei) / 1e18;
      const gasUsd = gasNative * (chainNativePrices.get(result.network.id) || 0);
      totalGasUsd += gasUsd;

      chains.push({
        id: result.network.id,
        label: result.network.label,
        transferCount: combined.length,
        gasNative,
        gasUsd,
        counterpartyCount: localMap.size,
      });
    }

    const counterparties = [...counterpartyMap.values()].sort((a, b) => b.count - a.count).slice(0, 16);
    const activeNetworks = new Set(tokens.map((t) => t.chainLabel)).size || chains.filter((c) => c.transferCount > 0).length;
    const portfolioUsd = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);

    return ok(res, {
      address,
      summary: {
        portfolioUsd,
        tokenCount: tokens.length,
        activeNetworks,
        transferCount: allTransfers.length,
        counterpartyCount: counterparties.length,
        gasSpendUsd: totalGasUsd,
      },
      chains: chains.sort((a, b) => (b.gasUsd || 0) - (a.gasUsd || 0)),
      tokens: tokens.slice(0, 40),
      counterparties,
      transfers: allTransfers.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 30),
      nfts,
      notes: {
        privacy: 'Public onchain data only.',
        gasWindow: 'Gas analysis is based on recent outgoing transactions scanned per supported chain.',
      },
    });
  } catch (error) {
    return badRequest(res, error?.message || 'Unexpected server error.', 500);
  }
};
