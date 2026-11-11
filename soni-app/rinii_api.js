/* リニー銀行：画面共通のデータ層（ホーム assets.html / 円普通預金 deposit.html）
   画面はここから受け取った値だけで描く。本番 API ができたら RiniiApi.endpoint に
   ベース URL を入れれば、同じ形の JSON を fetch して使う（{endpoint}/home, {endpoint}/transactions）。 */

/**
 * 入出金明細 1 件
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} date          取引日 'YYYY-MM-DD'
 * @property {string} description   取引内容（例「振込 ヤマダ　ハナコ」）
 * @property {number} amount        金額（正の数）
 * @property {'in'|'out'} type      入出金区分
 * @property {number} balanceAfter  取引後残高
 */

/**
 * ホーム（資産）画面の表示データ
 * @typedef {Object} HomeData
 * @property {string} stage
 * @property {string} branchName
 * @property {string} branchCode
 * @property {string} accountNumber
 * @property {number} balance
 * @property {number} prevMonthDiff
 * @property {number} freeTransferLeft
 * @property {number} freeAtmLeft
 * @property {string} updatedAt     ISO 8601
 * @property {string} noticeUrl
 */

(function (global) {
  /** @type {Transaction[]} 新しい順。balanceAfter は取引後の残高 */
  const MOCK_TRANSACTIONS = [
    // 振込手数料は実際の銀行アプリと同じく、対応する振込のすぐ上（＝振込の直後に引き落とし）に置く
    { id: 't9', date: '2026-11-11', description: '振込手数料（税込）',        amount: 110,   type: 'out', balanceAfter: 12370 },
    { id: 't8', date: '2026-11-11', description: '振込 タナカ　イチロウ',     amount: 50000, type: 'out', balanceAfter: 12480 },
    { id: 't7', date: '2026-11-10', description: 'カード ローソンATM',        amount: 30000, type: 'out', balanceAfter: 62480 },
    { id: 't6', date: '2026-11-10', description: '振込 ヤマダ　ハナコ',       amount: 8000,  type: 'out', balanceAfter: 92480 },
    { id: 't5', date: '2026-11-10', description: '振込 サトウ　タロウ',       amount: 20000, type: 'in',  balanceAfter: 100480 },
    { id: 't4', date: '2026-11-10', description: 'QRコード決済',              amount: 5000,  type: 'out', balanceAfter: 80480 },
    { id: 't3', date: '2026-11-10', description: '給与 カ）サンプルショウジ', amount: 85000, type: 'in',  balanceAfter: 85480 },
    { id: 't2', date: '2026-11-06', description: '口座振替 デンキダイ',       amount: 6200,  type: 'out', balanceAfter: 480 },
    { id: 't1', date: '2026-11-06', description: 'カード ATM入金',            amount: 5000,  type: 'in',  balanceAfter: 6680 },
  ];

  /** @type {HomeData} 残高は明細の最新の取引後残高から取る（両画面で必ず一致させるため） */
  const MOCK_HOME = {
    stage: 'ステージなし',
    branchName: '本店営業部',
    branchCode: '001',
    accountNumber: '1234567',           // ダミー
    balance: MOCK_TRANSACTIONS[0].balanceAfter,
    prevMonthDiff: -667,
    freeTransferLeft: 1,
    freeAtmLeft: 1,
    updatedAt: '2026-11-11T23:33:00+09:00',
    noticeUrl: 'https://example.com/rinii/notice',
  };

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));   // 通信のふり

  async function getJSON(path, params) {
    const u = new URL(RiniiApi.endpoint.replace(/\/$/, '') + path);
    Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== '') u.searchParams.set(k, v); });
    const r = await fetch(u, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  const RiniiApi = {
    endpoint: null,   // 例: 'https://api.example.com'

    /** @returns {Promise<HomeData>} */
    async fetchHome() {
      if (this.endpoint) return getJSON('/home');
      await wait(500);
      return { ...MOCK_HOME };
    },

    /**
     * 入出金明細をページ単位で取得する（新しい順）
     * @param {{cursor?: number|null, limit?: number, type?: 'all'|'in'|'out', from?: string|null}} [opts]
     *   cursor: 前回の nextCursor（最初は null） / from: この日付以降（'YYYY-MM-DD'）
     * @returns {Promise<{balance: number, updatedAt: string, items: Transaction[], nextCursor: number|null}>}
     */
    async fetchTransactions(opts = {}) {
      const { cursor = null, limit = 5, type = 'all', from = null } = opts;
      if (this.endpoint) return getJSON('/transactions', { cursor, limit, type, from });
      await wait(450);
      const all = MOCK_TRANSACTIONS.filter((t) => (type === 'all' || t.type === type) && (!from || t.date >= from));
      const start = cursor || 0;
      const items = all.slice(start, start + limit).map((t) => ({ ...t }));
      const next = start + limit < all.length ? start + limit : null;
      return { balance: MOCK_TRANSACTIONS[0].balanceAfter, updatedAt: '2026-11-11T23:39:00+09:00', items, nextCursor: next };
    },
  };

  global.RiniiApi = RiniiApi;
  global.RINII_MOCK = { home: MOCK_HOME, transactions: MOCK_TRANSACTIONS };
})(window);
