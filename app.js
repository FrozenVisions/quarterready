// QuarterReady demo: parses UK bank CSVs (Monzo, Starling, Barclays, HSBC, Lloyds) in the browser.
(function(g){
const R=[["Bank charges",/\b(fee|fees|charge|charges|interest|overdraft)\b/],["Travel",/\b(train|trainline|rail|uber|bolt|fuel|petrol|shell|bp|esso|texaco|parking|tfl|bus|taxi)\b/],["Phone, internet",/\b(vodafone|ee|o2|three|bt|sky|virgin|plusnet|talktalk)\b/],["Office costs",/\b(amazon|staples|ryman|adobe|microsoft|google|canva|apple)\b/],["Advertising",/\b(facebook|meta|linkedin|google ads)\b/],["Insurance",/\b(insurance|insur|simply business|hiscox)\b/],["Premises",/\b(rent|council tax|electric|electricity|octopus|british gas|water|edf|eon)\b/],["Professional fees",/\b(accountant|solicitor|legal)\b/]];
function cat(d){d=(d||'').toLowerCase();for(const[c,p]of R)if(p.test(d))return c;return"Other / check"}
function parse(t){const rows=[];let row=[],f='',q=false;t=t.replace(/^\uFEFF/,'');for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}else if(c=='"')q=true;else if(c==','){row.push(f);f=''}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);f='';if(row.some(x=>x.trim()))rows.push(row);row=[]}else f+=c}row.push(f);if(row.some(x=>x.trim()))rows.push(row);return rows}
function num(s){if(s==null)return NaN;s=String(s).replace(/[£,"\s]/g,'');if(/^\(.*\)$/.test(s))s='-'+s.slice(1,-1);return s===''?NaN:parseFloat(s)}
function analyse(text){const L=parse(text);if(!L.length)return{error:'Empty file'};const h=L[0].map(x=>x.trim().toLowerCase());
const hasHeader=h.some(x=>/date|amount|desc|memo|name/.test(x))&&isNaN(num(L[0][L[0].length-1]));
let di,ai,dbi=-1,cri=-1,body=L.slice(1);
if(!hasHeader){body=L;di=1;ai=L[0].length-1}else{
di=h.findIndex(x=>/^(name|counter party|memo|description|transaction description|details|payee)$/.test(x));if(di<0)di=h.findIndex(x=>/desc|detail|memo|name|reference/.test(x));
ai=h.findIndex(x=>/^amount( \(gbp\))?$|^value$/.test(x));dbi=h.findIndex(x=>/debit amount|paid out|money out/.test(x));cri=h.findIndex(x=>/credit amount|paid in|money in/.test(x));
if(ai<0&&(dbi<0||cri<0))return{error:'Could not find an amount column'}}
let inc=0,n=0,t={};for(const r of body){let a=ai>=0?num(r[ai]):(num(r[cri])||0)-(num(r[dbi])||0);if(isNaN(a)||a===0)continue;n++;if(a>0)inc+=a;else{const c=cat(r[di]);t[c]=(t[c]||0)-a}}
const ex=Object.values(t).reduce((a,b)=>a+b,0);const r2=x=>Math.round(x*100)/100;Object.keys(t).forEach(k=>t[k]=r2(t[k]));return{income:r2(inc),expenses:r2(ex),byCategory:t,count:n}}
g.QR={analyse,cat,parse};
if(typeof document!=='undefined'){const f=document.getElementById('f');if(f)f.onchange=e=>{const fr=new FileReader();fr.onload=()=>{const o=analyse(fr.result),out=document.getElementById('out');if(o.error){out.textContent=o.error;return}
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));out.innerHTML='<table><tr><th>Category</th><th>£</th></tr>'+Object.entries(o.byCategory).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${v.toFixed(2)}</td></tr>`).join('')+`<tr><th>Total expenses</th><th>${o.expenses.toFixed(2)}</th></tr><tr><th>Total income</th><th>${o.income.toFixed(2)}</th></tr></table><p><small>${o.count} transactions read. Check "Other" items by hand.</small></p>`};fr.readAsText(e.target.files[0])}}
})(typeof window!=='undefined'?window:globalThis);
