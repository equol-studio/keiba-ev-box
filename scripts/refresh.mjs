// 対象週末の全場・全レースを netkeiba から取得し、ルールベースで参戦/見送りを判定して
// auto.js (window.KEIBA_AUTO v2) を生成する。失敗時は既存を壊さない(fail-safe)。
// 使い方: DATES=20260711,20260712 node scripts/refresh.mjs  (未指定なら直近の土日)
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
// JRA 場コード（race_id の 5〜6桁目）
const VENUES = {
  '01': '札幌', '02': '函館', '03': '福島', '04': '新潟', '05': '東京',
  '06': '中山', '07': '中京', '08': '京都', '09': '阪神', '10': '小倉'
};

const pad = (n, l = 2) => String(n).padStart(l, '0');
const jst = () => new Date(Date.now() + 9 * 3600 * 1000);
const ymd = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
function upcomingWeekend() {
  const n = jst();
  const d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
  const toSat = (6 - d.getUTCDay() + 7) % 7;
  const sat = new Date(d); sat.setUTCDate(d.getUTCDate() + toSat);
  const sun = new Date(sat); sun.setUTCDate(sat.getUTCDate() + 1);
  return [ymd(sat), ymd(sun)];
}

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://race.netkeiba.com/', 'Accept-Language': 'ja' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  let t = buf.toString('utf-8'); // netkeibaはUTF-8
  if (!/出馬表|競走|未勝利|新馬|レース情報|status/.test(t)) {
    try { const e = new TextDecoder('euc-jp').decode(buf); if (/出馬表|競走|未勝利|新馬/.test(e)) t = e; } catch (_) {}
  }
  return t;
}

function allRaceIds(html) {
  const s = new Set(); const re = /race_id=(\d{12})/g; let m;
  while ((m = re.exec(html))) s.add(m[1]);
  return [...s].sort();
}

function parseShutuba(html, id) {
  const R = parseInt(id.slice(10, 12), 10);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const name = (title.split(/出馬表|\||｜/)[0] || '').trim();
  const body = html.replace(/\s+/g, ' ');
  // クラスはタイトル(レース名)から判定（body全体は新馬等がナビに常駐し誤検知するため）
  const cls = /新馬/.test(name) ? '新馬'
    : /未勝利/.test(name) ? '未勝利'
    : /(3勝|３勝)/.test(name) ? '3勝'
    : /(2勝|２勝)/.test(name) ? '2勝'
    : /(1勝|１勝)/.test(name) ? '1勝'
    : /[（(]G[ⅠⅡⅢ123]/.test(name) ? 'OP/重賞'
    : /特別|ステークス|記念|杯|賞|カップ|Ｓ/.test(name) ? '条件/特別' : '?';
  const dm = body.match(/([芝ダ])\s?(\d{3,4})/);
  const dist = dm ? `${dm[1]}${dm[2]}` : '';
  const pm = body.match(/(\d{1,2}:\d{2})発走/);
  const post = pm ? pm[1] : '';
  const horses = new Set(); const hre = /\/horse\/(\d{6,12})/g; let h;
  while ((h = hre.exec(html))) horses.add(h[1]);
  return { R, name, cls, dist, field: horses.size, post };
}

function judge(r) {
  if (r.cls === '新馬' || r.cls === '未勝利') return { call: '見送り', conf: 1, note: `${r.cls}は読みづらく見送り` };
  if (!r.field || r.field <= 7) return { call: '見送り', conf: 1, note: '少頭数で配当妙味薄' };
  if (r.field <= 9) return { call: '様子見', conf: 1, note: 'やや少頭数、買うなら絞る' };
  if (r.cls === '?') return { call: '様子見', conf: 1, note: 'クラス判定不可、現地で確認' };
  if (r.cls === 'OP/重賞') return { call: '参戦', conf: 3, note: 'オープン/重賞の多頭数戦。ワイド/3連複' };
  if (r.cls === '1勝') return { call: '参戦', conf: 2, note: '1勝の多頭数戦。ワイド/3連複' };
  return { call: '参戦', conf: 2, note: '条件/特別の多頭数戦。ワイド/3連複' };
}

// 予想/前売オッズ取得（単勝・複勝）。netkeiba の公開APIを使用（非ログイン）。
// status: "yoso"=予想オッズ, "middle"=発売中(前売実オッズ), "result"=確定後
async function getOdds(raceId) {
  const url = `https://race.netkeiba.com/api/api_get_jra_odds.html?pid=api_get_jra_odds&input=UTF-8&output=json&race_id=${raceId}&type=1&action=init&compress=0`;
  const t = await getText(url);
  let j;
  try { j = JSON.parse(t); } catch { throw new Error('odds JSON parse failed'); }
  const o = j && j.data && j.data.odds;
  if (!o || !o['1']) throw new Error(`odds empty (status=${j && j.status})`);
  const win = {}, place = {};
  for (const [k, v] of Object.entries(o['1'])) {
    const n = String(parseInt(k, 10)); const w = parseFloat(v && v[0]);
    if (Number.isFinite(w) && w > 0) win[n] = w;
  }
  for (const [k, v] of Object.entries(o['2'] || {})) {
    const n = String(parseInt(k, 10));
    const lo = parseFloat(v && v[0]), hi = parseFloat(v && v[1]);
    if (Number.isFinite(lo) && lo > 0) place[n] = [lo, Number.isFinite(hi) && hi > 0 ? hi : lo];
  }
  if (!Object.keys(win).length) throw new Error('no win odds');
  return { win, place, src: j.status };
}

const dowJ = ['日', '月', '火', '水', '木', '金', '土'];
function label(date) {
  const y = +date.slice(0, 4), mo = +date.slice(4, 6), da = +date.slice(6, 8);
  const w = new Date(Date.UTC(y, mo - 1, da)).getUTCDay();
  return `${mo}/${da}(${dowJ[w]})`;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const arg = (process.env.DATES || '').trim();
  const dates = arg ? arg.split(',').map((s) => s.trim()).filter(Boolean) : upcomingWeekend();
  console.log('target dates:', dates.join(', '));
  const days = [];
  const oddsRaces = {};
  let oddsOk = 0, oddsNg = 0;
  for (const date of dates) {
    let ids = [];
    try {
      const list = await getText(`https://race.netkeiba.com/top/race_list_sub.html?kaisai_date=${date}`);
      ids = allRaceIds(list);
    } catch (e) { console.error(`list ${date}: ${e.message}`); }
    if (!ids.length) { console.error(`no race_ids for ${date}`); continue; }
    console.log(`${date}: ${ids.length} races (all venues)`);
    const races = [];
    for (const id of ids) {
      try {
        const sh = await getText(`https://race.netkeiba.com/race/shutuba.html?race_id=${id}`);
        const p = parseShutuba(sh, id);
        const j = judge(p);
        const venue = VENUES[id.slice(4, 6)] || id.slice(4, 6);
        const special = /特別|ステークス|記念|杯|賞|カップ|Ｓ/.test(p.name) ? p.name.replace(/[(（].*$/, '').trim() : '';
        const cond = [special, p.cls, p.dist, p.field ? `${p.field}頭` : ''].filter(Boolean).join('・');
        races.push({
          raceId: id, venue,
          no: `${p.R}R`,
          cond: cond || p.name || `${p.R}R`,
          cls: p.cls, dist: p.dist, field: p.field, post: p.post,
          call: j.call, conf: j.conf, note: j.note
        });
      } catch (e) { console.error(`shutuba ${id}: ${e.message}`); }
      await sleep(350);
      // 予想オッズ（失敗しても出馬表部分は生かす: odds のみ欠落）
      try {
        oddsRaces[id] = await getOdds(id);
        oddsOk++;
      } catch (e) { oddsNg++; console.error(`odds ${id}: ${e.message}`); }
      await sleep(350);
    }
    // 場コード順 → レース番号順
    races.sort((a, b) => (a.raceId < b.raceId ? -1 : a.raceId > b.raceId ? 1 : 0));
    if (races.length) days.push({ day: label(date), races });
  }
  const total = days.reduce((n, d) => n + d.races.length, 0);
  if (total < 3) { console.error(`only ${total} races parsed — fail-safe, auto.js not overwritten`); process.exit(0); }
  const now = jst().toISOString().slice(0, 16).replace('T', ' ') + ' JST';
  const out = {
    version: 2,
    updated: now,
    scan: {
      title: '全レース判定（全場・自動更新）',
      intro: 'GitHub Actionsが出馬表から自動生成（ルール：新馬/未勝利・少頭数=見送り、多頭数の条件戦/OP=参戦）。妙味スコア・EVの精査(data.js)が上位。',
      days
    },
    // 予想オッズ（win: 馬番→単勝, place: 馬番→[複勝下限,上限], src: yoso|middle）
    // 全滅時は null（出馬表部分のみ更新。requirements §4-3 fail-safe）
    odds: oddsOk > 0 ? { asOf: now, source: 'netkeiba-odds-api', races: oddsRaces } : null
  };
  writeFileSync('auto.js', 'window.KEIBA_AUTO = ' + JSON.stringify(out, null, 2) + ';\n');
  console.log(`auto.js written: ${total} races / ${days.length} day(s), odds ok=${oddsOk} ng=${oddsNg}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
