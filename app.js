const state = {
  wallet: null,
  mode: 'demo',
  data: null,
  claimCount: parseInt(localStorage.getItem('gasback_claim_count') || '14203', 10),
};
const chains = ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'];
const protocols = ['Uniswap', 'Aave', 'BaseSwap', 'OpenSea', '1inch', 'Sushi', 'Balancer', 'Aerodrome'];
const counterparties = ['0x7a91...4f1c', '0x8cc1...2d44', '0xf091...e541', '0xbc41...19d0', '0x1138...c702'];
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
function seededNumber(seed, min, max) {
  const value = (Math.sin(seed) + 1) / 2;
  return min + (max - min) * value;
}
function shortWallet(address) {
  if (!address) return 'Demo Mode';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
function buildWalletData(wallet) {
  const seed = hashString(wallet || 'gasback-demo-wallet');
  const gasSpent = seededNumber(seed + 1, 320, 2480);
  const claimable = gasSpent * seededNumber(seed + 2, 0.05, 0.17);
  const score = Math.round(seededNumber(seed + 3, 61, 94));
  const interactions = Math.round(seededNumber(seed + 4, 84, 920));
  const chainCount = Math.round(seededNumber(seed + 5, 2, 5));
  const progress = Math.round(seededNumber(seed + 6, 38, 93));
  const chainData = chains.map((chain, index) => ({ name: chain, amount: seededNumber(seed + (index * 7), 40, 540) })).sort((a, b) => b.amount - a.amount);
  const protocolData = protocols.slice(0, 5).map((name, index) => ({ name, share: `${Math.round(seededNumber(seed + index + 15, 8, 34))}% activity` }));
  const counterpartyData = counterparties.map((name, index) => ({ name, detail: `${Math.round(seededNumber(seed + index + 30, 2, 18))} tx links` }));
  return { gasSpent, claimable, score, interactions, chainCount, progress, chainData, protocolData, counterpartyData };
}
function money(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount);
}
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function renderBarChart(chainData) {
  const chart = document.getElementById('barChart');
  if (!chart) return;
  const max = Math.max(...chainData.map(item => item.amount));
  chart.innerHTML = chainData.map(item => `
    <div class="bar-col">
      <div class="bar-value">${money(item.amount)}</div>
      <div class="bar" style="height:${Math.max(28, (item.amount / max) * 180)}px"></div>
      <div class="bar-label">${item.name}</div>
    </div>
  `).join('');
}
function renderList(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(item => `
    <li>
      <div><strong>${item.name}</strong></div>
      <small>${item.share || item.detail}</small>
    </li>
  `).join('');
}
function render() {
  const data = state.data || buildWalletData(state.wallet);
  state.data = data;
  setText('walletDisplay', shortWallet(state.wallet));
  setText('panelWallet', state.wallet ? `${shortWallet(state.wallet)} overview` : 'Demo Wallet overview');
  setText('heroGasSpent', money(data.gasSpent));
  setText('heroClaimable', money(data.claimable));
  setText('heroChains', data.chainCount);
  setText('heroScore', data.score);
  setText('dashClaimable', money(data.claimable));
  setText('dashGasSpent', money(data.gasSpent));
  setText('dashInteractions', data.interactions.toLocaleString());
  setText('dashScore', data.score);
  setText('progressText', `${data.progress}%`);
  setText('claimCount', state.claimCount.toLocaleString());
  setText('modeBadge', state.mode === 'wallet' ? 'Injected Wallet' : 'Browser Demo');
  setText('footerStatus', state.mode === 'wallet' ? 'Wallet connected' : 'Demo wallet active');
  const fill = document.getElementById('progressFill');
  if (fill) fill.style.width = `${data.progress}%`;
  renderBarChart(data.chainData);
  renderList('protocolList', data.protocolData);
  renderList('counterpartyList', data.counterpartyData);
}
async function connectWallet() {
  if (!window.ethereum) {
    state.wallet = '0xDEMO000000000000000000000000000000BEEF';
    state.mode = 'demo';
    state.data = buildWalletData(state.wallet);
    render();
    showToast('No injected wallet found, running in demo mode.');
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts && accounts.length) {
      state.wallet = accounts[0];
      state.mode = 'wallet';
      state.data = buildWalletData(state.wallet);
      render();
      showToast('Wallet connected successfully.');
    }
  } catch (error) {
    console.error(error);
    showToast('Wallet connection was cancelled.');
  }
}
function activateDemo() {
  state.wallet = '0xDEMO000000000000000000000000000000BEEF';
  state.mode = 'demo';
  state.data = buildWalletData(state.wallet);
  render();
  showToast('Demo mode activated.');
}
function claimNow() {
  if (!state.data) return;
  const nextClaim = { at: new Date().toISOString(), wallet: state.wallet || 'demo-wallet', amount: state.data.claimable };
  localStorage.setItem('gasback_last_claim', JSON.stringify(nextClaim));
  state.claimCount += 1;
  localStorage.setItem('gasback_claim_count', String(state.claimCount));
  render();
  showToast(`Claim submitted: ${money(state.data.claimable)}`);
}
function bindEvents() {
  document.getElementById('connectButton')?.addEventListener('click', connectWallet);
  document.getElementById('demoButton')?.addEventListener('click', activateDemo);
  document.getElementById('claimButtonTop')?.addEventListener('click', claimNow);
  document.querySelectorAll('[data-connect]').forEach(btn => btn.addEventListener('click', connectWallet));
  if (window.ethereum) {
    window.ethereum.on?.('accountsChanged', (accounts) => {
      if (accounts && accounts.length) {
        state.wallet = accounts[0];
        state.mode = 'wallet';
        state.data = buildWalletData(state.wallet);
        render();
      } else {
        activateDemo();
      }
    });
  }
}
bindEvents();
activateDemo();
