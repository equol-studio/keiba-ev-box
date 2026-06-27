// 函館の対象週末カードを netkeiba から取得し、ルールベースで参戦/見送りを判定して
// auto.js (window.KEIBA_AUTO) を生成する。失敗時は既存を壊さない(fail-safe)。
// 使い方: DATES=20260627,20260628 node scripts/refresh.mjs  (未指定なら直近の土日)
import { writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TRACK = '02'; // 函館

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
  let t = new TextDecoder('euc-jp').decode(buf);
  if (!/函館|レース|netkeiba/i.test(t)) t = buf.toString('utf-8'); // フォールバック
  return t;
}

function hakodateIds(html) {
  const s = new Set(); const re = /race_id=(\d{12})/g; let m;
  while ((m = re.exec(html))) if (m[1].slice(4, 6) === TRACK) s.add(m[1]);
  return [...s].sort();
}

function parseShutuba(html, id) {
  const R = parseInt(id.slice(10, 12), 10);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const name = (title.split(/出馬表|\||｜/)[0] || '').trim();
  const body = html.replace(/\s+/g, ' ');
  const cls = /新馬/.test(body) ? '新馬'
    : /未勝利/.test(body) ? '未勝利'
    : /(3勝|３勝)/.test(body) ? '3勝'
    : /(2勝|２勝)/.test(body) ? '2勝'
    : /(1勝|１勝)/.test(body) ? '1勝'
    : /(G[ⅠⅡⅢ]|（G|\(G|オープン|ＯＰ)/.test(body) ? 'OP/重賞' : '?';
  const dm = body.match(/([芝ダ])\s?(\d{3,4})/);
  const dist = dm ? `${dm[1]}${dm[2]}` : '';
  const horses = new Set(); const hre = /\/horse\/(\d{6,12})/g; let h;
  while ((h = hre.exec(html))) horses.add(h[1]);
  return { R, name, cls, dist, field: horses.size };
}

function judge(r) {
  if (r.cls === '新馬' || r.cls === '未勝利') return { call: '見送り', conf: 1, note: `${r.cls}は読みづらく見送り` };
  if (!r.field || r.field <= 7) return { call: '見送り', conf: 1, note: '少頭数で配当妙味薄' };
  if (r.field <= 9) return { call: '様子見', conf: 1, note: 'やや少頭数、買うなら絞る' };
  if (r.cls === 'OP/重賞') return { call: '参戦', conf: 3, note: 'オープン/重賞の多頭数戦。ワイド/3連複' };
  if (r.cls === '2勝' || r.cls === '3勝') return { call: '参戦', conf: 3, note: '条件特別の多頭数戦。ワイド/3連複' };
  if (r.cls === '1勝') return { call: '参戦', conf: 2, note: '1勝の多頭数戦。ワイド/3連複' };
  return { call: '様子見', conf: 1, note: '判定保留' };
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
  for (const date of dates) {
    let ids = [];
    try {
      const list = await getText(`https://race.netkeiba.com/top/race_list_sub.html?kaisai_date=${date}`);
      ids = hakodateIds(list);
    } catch (e) { console.error(`list ${date}: ${e.message}`); }
    if (!ids.length) { console.error(`no 函館 race_ids for ${date}`); continue; }
    console.log(`${date}: ${ids.length} 函館 races`);
    const races = [];
    for (const id of ids) {
      try {
        const sh = await getText(`https://race.netkeiba.com/race/shutuba.html?race_id=${id}`);
        const p = parseShutuba(sh, id);
        const j = judge(p);
        const cond = [p.cls, p.dist, p.field ? `${p.field}頭` : ''].filter(Boolean).join('・');
        races.push({ no: `${p.R}R`, cond: cond || p.name || `${p.R}R`, call: j.call, conf: j.conf, note: j.note });
      } catch (e) { console.error(`shutuba ${id}: ${e.message}`); }
      await sleep(350);
    }
    races.sort((a, b) => parseInt(a.no) - parseInt(b.no));
    if (races.length) days.push({ day: label(date), races });
  }
  const total = days.reduce((n, d) => n + d.races.length, 0);
  if (total < 3) { console.error(`only ${total} races parsed — fail-safe, auto.js not overwritten`); process.exit(0); }
  const out = {
    updated: jst().toISOString().slice(0, 16).replace('T', ' ') + ' JST',
    scan: {
      title: '全レース判定（函館・自動更新）',
      intro: 'GitHub Actionsが出馬表から自動生成（ルール：新馬/未勝利・少頭数=見送り、多頭数の条件戦/OP=参戦）。妙味の軸選定は手動分析が上位。オッズ非使用。',
      days
    }
  };
  writeFileSync('auto.js', 'window.KEIBA_AUTO = ' + JSON.stringify(out, null, 2) + ';\n');
  console.log(`auto.js written: ${total} races / ${days.length} day(s)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
