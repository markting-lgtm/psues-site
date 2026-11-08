/* Currency switcher: every world currency, IDR stays the official price. Rates from open.er-api.com, cached 12 h. */

(function(){
"use strict";
var KEY='psu_currency',RKEY='psu_rates',TTL=12*36e5,
PIN=['USD','EUR','AUD','GBP','SGD','IDR','EGP','AED','SAR','RUB','CNY','INR'],
SYM={USD:'US$',AUD:'A$',SGD:'S$',CAD:'C$',NZD:'NZ$',HKD:'HK$',TWD:'NT$',MXN:'MX$'},
HIGH=/^(IDR|VND|IRR|EGP|LAK|UZS|KRW|COP|MMK|LBP|SYP|GNF|UGX|TZS|MGA|PYG|KHR|IQD|SLE|SLL|NGN|PKR)$/,
CC='AED:AE|AFN:AF|ALL:AL|AMD:AM|AOA:AO|ARS:AR|AUD:AUCCCXHMKINFNRTV|AWG:AW|AZN:AZ|BAM:BA|BBD:BB|BDT:BD|BGN:BG|BHD:BH|BIF:BI|BMD:BM|BND:BN|BOB:BO|BRL:BR|BSD:BS|BWP:BW|BYN:BY|BZD:BZ|CAD:CA|CDF:CD|CHF:CHLI|CLP:CL|CNY:CN|COP:CO|CRC:CR|CUP:CU|CVE:CV|CZK:CZ|DJF:DJ|DKK:DKFOGL|DOP:DO|DZD:DZ|EGP:EG|ERN:ER|ETB:ET|EUR:ADATAXBEBLCYDEEAEEESEUFIFRGFGPGRHRICIEITLTLULVMCMEMFMQMTNLPMPTRESISKSMTFVAXKYT|FJD:FJ|FKP:FK|GBP:GBGGGSIMJETA|GEL:GE|GHS:GH|GIP:GI|GMD:GM|GNF:GN|GTQ:GT|GYD:GY|HKD:HK|HNL:HN|HTG:HT|HUF:HU|IDR:ID|ILS:ILPS|INR:BTIN|IQD:IQ|IRR:IR|ISK:IS|JMD:JM|JOD:JO|JPY:JP|KES:KE|KGS:KG|KHR:KH|KMF:KM|KPW:KP|KRW:KR|KWD:KW|KYD:KY|KZT:KZ|LAK:LA|LBP:LB|LKR:LK|LRD:LR|LYD:LY|MAD:EHMA|MDL:MD|MGA:MG|MKD:MK|MMK:MM|MNT:MN|MOP:MO|MRU:MR|MUR:MU|MVR:MV|MWK:MW|MXN:MX|MYR:MY|MZN:MZ|NGN:NG|NIO:NI|NOK:BVNOSJ|NPR:NP|NZD:CKNUNZPNTK|OMR:OM|PAB:PA|PEN:PE|PGK:PG|PHP:PH|PKR:PK|PLN:PL|PYG:PY|QAR:QA|RON:RO|RSD:RS|RUB:RU|RWF:RW|SAR:SA|SBD:SB|SCR:SC|SDG:SD|SEK:SE|SGD:SG|SHP:ACSH|SLE:SL|SOS:SO|SRD:SR|SSP:SS|STN:ST|SYP:SY|SZL:SZ|THB:TH|TJS:TJ|TMT:TM|TND:TN|TOP:TO|TRY:TR|TTD:TT|TWD:TW|TZS:TZ|UAH:UA|UGX:UG|USD:ASBQDGECFMGUIOMHMPPRPWSVTCTLUMUSVGVIZW|UYU:UY|UZS:UZ|VES:VE|VND:VN|VUV:VU|WST:WS|XAF:CFCGCMGAGQTD|XCD:AGAIDMGDKNLCMSVC|XCG:CWSX|XOF:BFBJCIGWMLNESNTG|XPF:NCPFWF|YER:YE|ZAR:LSNAZA|ZMW:ZM',REG={};
CC.split('|').forEach(function(g){var p=g.split(':');for(var i=0;i<p[1].length;i+=2)REG[p[1].substr(i,2)]=p[0]});
function getSaved(){var m=document.cookie.match(/(?:^|; )psu_currency=([A-Z]{3})/);if(m)return m[1];try{var o=JSON.parse(localStorage.getItem(KEY)||'null');if(o&&o.t>Date.now()-31536e6)return o.c}catch(e){}return null}
function save(c){document.cookie=KEY+'='+c+';max-age=31536000;path=/;SameSite=Lax';try{localStorage.setItem(KEY,JSON.stringify({c:c,t:Date.now()}))}catch(e){}}
function fromLocale(){var l=(navigator.languages&&navigator.languages[0])||navigator.language||'',r=null;
try{r=new Intl.Locale(l).region}catch(e){var m=l.match(/[-_]([A-Za-z]{2})\b/);r=m&&m[1]}return r?REG[r.toUpperCase()]||null:null}
function get(url,ms){var c=window.AbortController?new AbortController():null,t=setTimeout(function(){c&&c.abort()},ms);
return fetch(url,c?{signal:c.signal}:{}).then(function(r){clearTimeout(t);if(!r.ok)throw 0;return r.json()})}
function fromIP(){return get('https://ipapi.co/json/',1500).then(function(d){return d&&/^[A-Z]{3}$/.test(d.currency)?d.currency:null}).catch(function(){return null})}
function rates(){try{var c=JSON.parse(localStorage.getItem(RKEY)||'null');if(c&&c.t>Date.now()-TTL)return Promise.resolve(c.r)}catch(e){}
return get('https://open.er-api.com/v6/latest/IDR',5000).then(function(d){if(!d||d.result!=='success'||!d.rates)throw 0;try{localStorage.setItem(RKEY,JSON.stringify({t:Date.now(),r:d.rates}))}catch(e){}return d.rates}).catch(function(){return null})}
/* the site is in English: format as English for the visitor's region (e.g. en-EG, en-DE), Latin digits */
var LOC='en',DN=null,DL=null;try{var rg=new Intl.Locale(navigator.language||'en').region;if(rg){new Intl.NumberFormat('en-'+rg);LOC='en-'+rg}}catch(e){LOC='en'}
try{DN=new Intl.DisplayNames(['en'],{type:'currency'});DL=new Intl.DisplayNames([navigator.language||'en'],{type:'currency'})}catch(e){}
function name(c){try{return DN?DN.of(c):c}catch(e){return c}}
function local(c){try{return DL?DL.of(c):''}catch(e){return ''}}
/* official IDR stays primary; the conversion is rounded: thousands for most, compact M/B for large values and high-value currencies */
function fmt(v,c){var big=v>=1e6||HIGH.test(c),o={style:'currency',currency:c,maximumFractionDigits:big?1:0,minimumFractionDigits:0};if(big)o.notation='compact';else v=Math.round(v/1000)*1000;
try{return new Intl.NumberFormat(LOC,o).formatToParts(v).map(function(p){return p.type==='currency'&&SYM[c]?SYM[c]:p.value}).join('')}catch(e){return c+' '+Math.round(v).toLocaleString()}}
var RX=/IDR\s?(\d[\d.,]*)\s?(B|M)?\b/g,SKIP={A:1,BUTTON:1,SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,SELECT:1,TITLE:1,NOSCRIPT:1};
function parse(n,s){if(s)return Math.round(parseFloat(n.replace(/,/g,'.'))*(s==='B'?1e9:1e6));return parseInt(n.replace(/[.,]/g,''),10)}
function mark(root){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(t){RX.lastIndex=0;if(!RX.test(t.nodeValue))return 2;
for(var p=t.parentNode;p&&p!==root;p=p.parentNode){if(SKIP[p.tagName]||(p.hasAttribute&&p.hasAttribute('data-price-idr'))||(p.classList&&(p.classList.contains('ps-fx')||p.classList.contains('ps-cur'))))return 2}return 1}}),list=[],t;
while((t=w.nextNode()))list.push(t);list.forEach(function(t){RX.lastIndex=0;var s=t.nodeValue,f=document.createDocumentFragment(),i=0,m;
while((m=RX.exec(s))){f.appendChild(document.createTextNode(s.slice(i,m.index)));var sp=document.createElement('span');sp.setAttribute('data-price-idr',parse(m[1],m[2]));sp.textContent=m[0];f.appendChild(sp);i=RX.lastIndex}
f.appendChild(document.createTextNode(s.slice(i)));t.parentNode.replaceChild(f,t)})}
var R=null,CUR='USD',NOTE='Approximate conversion. Official price in IDR.';
function paintFx(){document.querySelectorAll('.ps-fx,.ps-fx-note').forEach(function(e){e.remove()});var b=document.querySelector('.ps-cur-btn');if(b)b.textContent=CUR;
if(!R||CUR==='IDR'||!R[CUR])return;var last=new Map();
document.querySelectorAll('[data-price-idr]').forEach(function(el){var idr=+el.getAttribute('data-price-idr');if(!idr)return;
var s=document.createElement('span');s.className='ps-fx';s.textContent='≈ '+fmt(idr*R[CUR],CUR);s.title=NOTE;el.appendChild(s);
var blk=el.closest('p,h1,h2,h3,h4,li,.amount')||el.parentNode;last.set(blk.closest('section,.choice,.hero-band,.page-band,.ta-band,footer')||blk.parentNode,blk)});
last.forEach(function(blk){var n=document.createElement('small');n.className='ps-fx-note';n.textContent=NOTE;blk.parentNode.insertBefore(n,blk.nextSibling)})}
/* searchable currency picker: popular ones pinned, then every currency A to Z */
function picker(){var h=document.querySelector('.header-wrap');if(!h)return;var wrap=document.querySelector('.ps-cur');
if(!wrap){wrap=document.createElement('div');wrap.className='ps-cur';h.insertBefore(wrap,h.querySelector('.menu-btn'))}
wrap.innerHTML='<button type="button" class="ps-cur-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="Currency: '+CUR+'">'+CUR+'</button><div class="ps-cur-pop"><input type="search" placeholder="Search currency" aria-label="Search currency" role="combobox" aria-controls="psCurList" aria-autocomplete="list"><ul id="psCurList" role="listbox" aria-label="Currencies"></ul></div>';
var btn=wrap.querySelector('button'),inp=wrap.querySelector('input'),ul=wrap.querySelector('ul'),act=-1;
var all=Object.keys(R||{IDR:1}).filter(function(c){return /^[A-Z]{3}$/.test(c)}).sort();
var top=PIN.filter(function(c){return all.indexOf(c)>=0});if(all.indexOf(CUR)>=0&&top.indexOf(CUR)<0)top.unshift(CUR);
var rest=all.filter(function(c){return top.indexOf(c)<0});
function draw(q){q=(q||'').trim().toLowerCase();ul.innerHTML='';act=-1;var items=(q?top.concat(rest):top.concat(rest));
items.forEach(function(c,i){var nm=name(c);if(q&&(c.toLowerCase()+' '+nm+' '+local(c)).toLowerCase().indexOf(q)<0)return;
var li=document.createElement('li');li.setAttribute('role','option');li.id='psc-'+c;li.dataset.c=c;li.setAttribute('aria-selected',c===CUR);if(!q&&i===top.length)li.className='sep';
li.innerHTML='<b></b><span></span>';li.firstChild.textContent=c;li.lastChild.textContent=nm;li.addEventListener('click',function(){choose(c)});ul.appendChild(li)})}
function open(o){wrap.classList.toggle('open',o);btn.setAttribute('aria-expanded',o);if(o){draw('');inp.value='';setTimeout(function(){inp.focus()},30)}else btn.focus()}
function choose(c){CUR=c;save(c);open(false);btn.setAttribute('aria-label','Currency: '+c);paintFx()}
function move(d){var li=ul.querySelectorAll('li');if(!li.length)return;if(act>=0)li[act].classList.remove('act');act=(act+d+li.length)%li.length;li[act].classList.add('act');li[act].scrollIntoView({block:'nearest'});inp.setAttribute('aria-activedescendant',li[act].id)}
btn.addEventListener('click',function(e){e.stopPropagation();open(!wrap.classList.contains('open'))});
inp.addEventListener('input',function(){draw(inp.value)});
inp.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();move(1)}else if(e.key==='ArrowUp'){e.preventDefault();move(-1)}
else if(e.key==='Enter'){e.preventDefault();var li=ul.querySelectorAll('li');var t=li[act>=0?act:0];if(t)choose(t.dataset.c)}else if(e.key==='Escape')open(false)});
wrap.addEventListener('click',function(e){e.stopPropagation()});document.addEventListener('click',function(){if(wrap.classList.contains('open'))wrap.classList.remove('open'),btn.setAttribute('aria-expanded',false)})}
function start(){mark(document.body);var saved=getSaved(),loc=saved?null:fromLocale();
(saved?Promise.resolve(saved):loc?Promise.resolve(loc):fromIP().then(function(c){return c||'USD'}))
.then(function(c){CUR=c;return rates()}).then(function(r){R=r;if(R&&!R[CUR])CUR='USD';picker();paintFx()})}
window.psuPrices={refresh:function(){mark(document.body);paintFx()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
