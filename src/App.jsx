import React, { useState, useRef, useCallback, useEffect, Component } from "react";

/* ─── ERROR BOUNDARY ─── */
class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div style={{padding:32,background:"#fff3f3",color:"#c62828",fontFamily:"monospace",fontSize:13,borderRadius:8,margin:16}}>
        <strong>⚠ Render Error:</strong><br/>{this.state.err.message}
        <br/><button onClick={()=>this.setState({err:null})} style={{marginTop:12,padding:"6px 14px",background:"#c62828",color:"#fff",border:"none",borderRadius:4,cursor:"pointer"}}>Retry</button>
      </div>
    );
    return this.props.children;
  }
}

/* ─── GLOBAL CSS ─── */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Condensed:wght@700&family=Playfair+Display:wght@700;900&family=Noto+Serif+Bengali:wght@400;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Roboto',sans-serif;background:#1a1f1a;color:#e0e0e0}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:#1a1f1a}
    ::-webkit-scrollbar-thumb{background:#3a5a3a;border-radius:3px}
    textarea,input[type=text],input[type=number],select{font-family:'Roboto',sans-serif;color:#e0e0e0}
    textarea:focus,input[type=text]:focus,input[type=number]:focus{outline:none;border-color:#4caf50!important;box-shadow:0 0 0 2px rgba(76,175,80,.2)!important}
    input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:#2a3a2a;cursor:pointer;width:100%}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#4caf50;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.4)}
    input[type=color]{-webkit-appearance:none;border:none;cursor:pointer;padding:0;border-radius:4px;overflow:hidden}
    input[type=color]::-webkit-color-swatch-wrapper{padding:0}
    input[type=color]::-webkit-color-swatch{border:none;border-radius:3px}
    .btn-tab:hover{background:#2a3a2a!important}
    .btn-tab.active-tab{border-bottom:2px solid #4caf50!important;color:#4caf50!important}
    .card-tpl:hover{border-color:#4caf50!important}
    .card-ad:hover{border-color:#4caf50!important}
    .layer-row:hover{background:#2a3a2a!important}
    .layer-row.sel{background:#1a3a1a!important;border-left:3px solid #4caf50!important}
    .dtool:hover{background:#2a3a2a!important;border-color:#4caf50!important}
    .dtool.active-tool{background:#1b5e20!important;border-color:#4caf50!important}
    .toast-in{animation:toastIn .25s ease}
    .mo{animation:fadeIn .18s ease}
    @keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .sh-el:hover{filter:drop-shadow(0 0 4px rgba(76,175,80,.7))}
    .res-handle{cursor:pointer;transition:r .1s}
    .res-handle:hover{r:7}
    .srch-img:hover{border-color:#4caf50!important;transform:scale(1.04);cursor:pointer}
    .setting-row:hover{background:#1a2a1a!important}
    .icon-btn:hover{background:#2a3a2a!important}
  `}</style>
);

/* ─── PALETTE ─── */
const C = {
  bg:"#141a14", panel:"#1a201a", panel2:"#1e261e", panelBorder:"#2a3a2a",
  primary:"#4caf50", primaryDk:"#2e7d32", primaryBg:"rgba(76,175,80,.12)", primaryBorder:"#2e7d32",
  accent:"#69f0ae", accentDim:"rgba(105,240,174,.15)",
  red:"#ef5350", redBg:"rgba(239,83,80,.12)",
  yellow:"#ffb300", yellowBg:"rgba(255,179,0,.12)",
  blue:"#42a5f5", blueBg:"rgba(66,165,245,.12)", blueBorder:"#1565c0",
  purple:"#ab47bc", purpleBg:"rgba(171,71,188,.12)", purpleBorder:"#7b1fa2",
  orange:"#ff7043", orangeBg:"rgba(255,112,67,.12)",
  white:"#ffffff", text:"#e8f5e9", textSec:"#90a4ae", textMuted:"#546e7a",
  border:"#2d3d2d", div:"#1e2e1e",
};

const CARD_W = 540;
const AD_MAX_H = 90;

/* ─── CARD LANGUAGE ─── */
const CARD_LANG = {
  en:{defTag:"BREAKING NEWS",defHeadline:"Breaking: Major Development Shakes Global Markets",defSubtext:"Analysts warn of significant volatility ahead as key indicators signal a major shift in economic conditions worldwide.",defWatermark:"thedaily.com",defLogoText:"THE DAILY",headlineFont:"'Playfair Display',Georgia,serif",bodyFont:"'Roboto',sans-serif",tagFont:"'Roboto Condensed',sans-serif",tagTransform:"uppercase",tagSpacing:"1.5px",logoTransform:"uppercase",logoSpacing:"1px",lineHeight:1.2,dateLocale:"en-US"},
  bn:{defTag:"ব্রেকিং নিউজ",defHeadline:"জরুরি: বৈশ্বিক বাজারে বড় পরিবর্তনের আভাস",defSubtext:"বিশ্লেষকরা সতর্ক করেছেন যে মূল সূচকগুলো বৈশ্বিক অর্থনীতিতে বড় ধরনের পরিবর্তনের ইঙ্গিত দিচ্ছে।",defWatermark:"thedaily.com.bd",defLogoText:"দ্য ডেইলি",headlineFont:"'Noto Serif Bengali',serif",bodyFont:"'Noto Serif Bengali',serif",tagFont:"'Noto Serif Bengali',serif",tagTransform:"none",tagSpacing:"0",logoTransform:"none",logoSpacing:"0",lineHeight:1.55,dateLocale:"bn-BD"},
};

const DEFAULT_TEMPLATES = [
  {id:"breaking",name:"Breaking News",sub:"Bold red urgent",    custom:false,style:{bg:"#0d0d0d",accent:"#c62828",acc2:"#f9a825",tc:"#ffffff",tagBg:"#c62828",dark:true}},
  {id:"editorial",name:"Editorial",   sub:"Classic print",       custom:false,style:{bg:"#F5F0E8",accent:"#1a1a2e",acc2:"#8b6914",tc:"#1a1a1a",tagBg:"#1a1a2e",dark:false}},
  {id:"sport",    name:"Sports Flash",sub:"High energy",         custom:false,style:{bg:"#0d1b2a",accent:"#f9a825",acc2:"#4caf50",tc:"#ffffff",tagBg:"#f9a825",dark:true}},
  {id:"politics", name:"Politics",    sub:"Authoritative",       custom:false,style:{bg:"#1c2b1c",accent:"#4caf50",acc2:"#f9a825",tc:"#ffffff",tagBg:"#4caf50",dark:true}},
  {id:"tech",     name:"Tech Report", sub:"Modern digital",      custom:false,style:{bg:"#f5f5f5",accent:"#2e7d32",acc2:"#c62828",tc:"#212121",tagBg:"#2e7d32",dark:false}},
  {id:"minimal",  name:"Minimal",     sub:"Clean and clear",     custom:false,style:{bg:"#ffffff",accent:"#111111",acc2:"#757575",tc:"#111111",tagBg:"#111111",dark:false}},
];

const ADS=[
  {id:"none",      label:"No Ad",            icon:"block"},
  {id:"subscribe", label:"Subscribe Banner", icon:"notifications_active", text:"Subscribe for exclusive coverage",     cta:"Subscribe Now"},
  {id:"app",       label:"App Download",     icon:"phone_iphone",          text:"Get our mobile app for breaking alerts",cta:"Download Free"},
  {id:"newsletter",label:"Newsletter",       icon:"mail_outline",           text:"Join 500K+ readers. Daily newsletter.", cta:"Sign Up Free"},
  {id:"image",     label:"Banner Image",     icon:"add_photo_alternate"},
  {id:"custom",    label:"Custom Ad",        icon:"tune"},
];

const TABS=[
  {id:"content", label:"Content", icon:"edit_note"},
  {id:"template",label:"Style",   icon:"palette"},
  {id:"media",   label:"Media",   icon:"image"},
  {id:"design",  label:"Design",  icon:"architecture"},
  {id:"ad",      label:"Ad",      icon:"campaign"},
];

const TOOLS = [
  {id:"select",  icon:"near_me",               label:"Select"},
  {id:"rect",    icon:"crop_square",           label:"Rect"},
  {id:"ellipse", icon:"radio_button_unchecked",label:"Ellipse"},
  {id:"triangle",icon:"change_history",        label:"Triangle"},
  {id:"star",    icon:"star_border",           label:"Star"},
  {id:"line",    icon:"remove",                label:"Line"},
  {id:"textbox", icon:"text_fields",           label:"Text"},
  {id:"imgover", icon:"add_photo_alternate",   label:"Image"},
  {id:"pen",     icon:"edit",                  label:"Pen"},
  {id:"draw",    icon:"brush",                 label:"Draw"},
];

const TYPE_ICON={rect:"crop_square",ellipse:"radio_button_unchecked",triangle:"change_history",star:"star_border",line:"remove",textbox:"text_fields",imgover:"add_photo_alternate",pen:"edit",draw:"brush"};

/* ─── HELPER FUNCTIONS ─── */
function cardinalSpline(pts,tension=0.4,closed=false){
  if(!pts||pts.length<2)return'';
  const n=pts.length,d=[];
  for(let i=0;i<n-(closed?0:1);i++){
    const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
    const cp1x=p1.x+(p2.x-p0.x)*tension/3,cp1y=p1.y+(p2.y-p0.y)*tension/3;
    const cp2x=p2.x-(p3.x-p1.x)*tension/3,cp2y=p2.y-(p3.y-p1.y)*tension/3;
    if(i===0)d.push(`M${p1.x.toFixed(1)},${p1.y.toFixed(1)}`);
    d.push(`C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`);
  }
  if(closed)d.push('Z');
  return d.join(' ');
}
function starPoints(cx,cy,R,r=R*0.4,n=5){
  return Array.from({length:n*2},(_,i)=>{const rad=i%2===0?R:r,a=(i*Math.PI/n)-Math.PI/2;return`${(cx+rad*Math.cos(a)).toFixed(1)},${(cy+rad*Math.sin(a)).toFixed(1)}`;}).join(' ');
}
function triPoints(x,y,w,h){return`${(x+w/2).toFixed(1)},${y.toFixed(1)} ${(x+w).toFixed(1)},${(y+h).toFixed(1)} ${x.toFixed(1)},${(y+h).toFixed(1)}`;}
function hexToRgb(hex){const h=(hex||'#000').replace('#','').padEnd(6,'0');return{r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255};}
function simplify(pts,tol=2){
  if(pts.length<=2)return pts;
  const out=[pts[0]];
  for(let i=1;i<pts.length-1;i++){const p=out[out.length-1],dx=pts[i].x-p.x,dy=pts[i].y-p.y;if(Math.hypot(dx,dy)>tol)out.push(pts[i]);}
  out.push(pts[pts.length-1]);return out;
}
function shapeBounds(sh){
  if(sh.type==='rect'||sh.type==='textbox'||sh.type==='imgover'||sh.type==='triangle')return{x:sh.x,y:sh.y,w:sh.w,h:sh.h};
  if(sh.type==='ellipse')return{x:sh.cx-sh.rx,y:sh.cy-sh.ry,w:sh.rx*2,h:sh.ry*2};
  if(sh.type==='star')return{x:sh.cx-sh.r,y:sh.cy-sh.r,w:sh.r*2,h:sh.r*2};
  if(sh.type==='line')return{x:Math.min(sh.x1,sh.x2),y:Math.min(sh.y1,sh.y2),w:Math.abs(sh.x2-sh.x1)||4,h:Math.abs(sh.y2-sh.y1)||4};
  if(sh.type==='pen'||sh.type==='draw'){const ps=sh.points||[];if(!ps.length)return{x:0,y:0,w:4,h:4};const xs=ps.map(p=>p.x),ys=ps.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs)||4,h:Math.max(...ys)-Math.min(...ys)||4};}
  return{x:0,y:0,w:10,h:10};
}
function resizeShape(orig,handle,dx,dy){
  const sh={...orig};
  if(['rect','textbox','imgover','triangle'].includes(sh.type)){
    let{x,y,w,h}=sh;
    if(handle.includes('n')){y+=dy;h-=dy;}
    if(handle.includes('s'))h+=dy;
    if(handle.includes('w')){x+=dx;w-=dx;}
    if(handle.includes('e'))w+=dx;
    if(w<12){if(handle.includes('w'))x=sh.x+sh.w-12;w=12;}
    if(h<12){if(handle.includes('n'))y=sh.y+sh.h-12;h=12;}
    return{...sh,x,y,w,h};
  }
  if(sh.type==='ellipse'){
    let bx=sh.cx-sh.rx,by=sh.cy-sh.ry,bw=sh.rx*2,bh=sh.ry*2;
    if(handle.includes('n')){by+=dy;bh-=dy;}
    if(handle.includes('s'))bh+=dy;
    if(handle.includes('w')){bx+=dx;bw-=dx;}
    if(handle.includes('e'))bw+=dx;
    bw=Math.max(12,bw);bh=Math.max(12,bh);
    return{...sh,cx:bx+bw/2,cy:by+bh/2,rx:bw/2,ry:bh/2};
  }
  if(sh.type==='star'){
    const d=Math.max(Math.abs(dx),Math.abs(dy));
    const sign=(handle.includes('e')||handle.includes('s'))?1:-1;
    return{...sh,r:Math.max(10,sh.r+sign*d)};
  }
  if(sh.type==='line'){
    if(handle==='p1')return{...sh,x1:sh.x1+dx,y1:sh.y1+dy};
    if(handle==='p2')return{...sh,x2:sh.x2+dx,y2:sh.y2+dy};
  }
  return sh;
}
function hitTest(sh,pt){
  const p=10;
  if(['rect','textbox','imgover','triangle'].includes(sh.type))return pt.x>=sh.x-p&&pt.x<=sh.x+sh.w+p&&pt.y>=sh.y-p&&pt.y<=sh.y+sh.h+p;
  if(sh.type==='ellipse')return((pt.x-sh.cx)**2/(sh.rx+p)**2+(pt.y-sh.cy)**2/(sh.ry+p)**2)<=1;
  if(sh.type==='star')return Math.hypot(pt.x-sh.cx,pt.y-sh.cy)<=sh.r+p;
  if(sh.type==='line'){const dx=sh.x2-sh.x1,dy=sh.y2-sh.y1,len=Math.hypot(dx,dy)||1,t=((pt.x-sh.x1)*dx+(pt.y-sh.y1)*dy)/(len*len);const nx=sh.x1+t*dx,ny=sh.y1+t*dy;return Math.hypot(pt.x-nx,pt.y-ny)<p*2;}
  if(sh.type==='pen'||sh.type==='draw')return(sh.points||[]).some(pp=>Math.hypot(pt.x-pp.x,pt.y-pp.y)<p*2);
  return false;
}
function moveShape(sh,dx,dy){
  if(['rect','textbox','imgover','triangle'].includes(sh.type))return{...sh,x:sh.x+dx,y:sh.y+dy};
  if(['ellipse','star'].includes(sh.type))return{...sh,cx:sh.cx+dx,cy:sh.cy+dy};
  if(sh.type==='line')return{...sh,x1:sh.x1+dx,y1:sh.y1+dy,x2:sh.x2+dx,y2:sh.y2+dy};
  if(sh.type==='pen'||sh.type==='draw')return{...sh,points:sh.points.map(p=>({x:p.x+dx,y:p.y+dy}))};
  return sh;
}

/* ─── EPS GENERATOR ─── */
function generateEPS({shapes,headline,subtext,tag,watermark,logoText,template,cardH}){
  const s=template.style,H=cardH,W=CARD_W,fy=y=>H-y;
  const rgb=hex=>{const c=hexToRgb(hex);return`${c.r.toFixed(3)} ${c.g.toFixed(3)} ${c.b.toFixed(3)}`;};
  const setC=hex=>`${rgb(hex)} setrgbcolor`;
  const ln=[`%!PS-Adobe-3.0 EPSF-3.0`,`%%BoundingBox: 0 0 ${W} ${Math.round(H)}`,
    `%%Title: PhotoCard Studio v1.6`,`%%Creator: Abdullah Al Fahim`,`%%EndComments`,``,
    `/rf{4 dict begin /h exch def /w exch def /y exch def /x exch def newpath x y moveto w 0 rlineto 0 h rlineto w neg 0 rlineto closepath fill end}def`,
    `${setC(s.bg)} 0 0 ${W} ${H} rf`,
    `${setC(s.accent)} 0 ${H-4} ${W} 4 rf`,
    `${setC(s.acc2)} 0 0 ${W} 3 rf`,
    `${setC(s.accent)} /Helvetica-Bold findfont 16 scalefont setfont 18 ${fy(44)} moveto (${(logoText||'MEDIA').replace(/[()\\]/g,'')}) show`,
  ];
  if(tag){ln.push(`${setC(s.tagBg)} 18 ${fy(82)} ${tag.length*7+14} 18 rf`);ln.push(`${setC('#ffffff')} /Helvetica-Bold findfont 9 scalefont setfont 25 ${fy(75)} moveto (${tag.replace(/[()\\]/g,'')}) show`);}
  if(headline){
    const fs=headline.length>80?14:headline.length>50?17:21;
    ln.push(`${setC(s.tc)} /Times-Bold findfont ${fs} scalefont setfont`);
    const words=headline.replace(/[()\\]/g,'').split(' ');let line='',y=105;
    for(const w of words){if((line+' '+w).trim().length>48){ln.push(`18 ${fy(y)} moveto (${line.trim()}) show`);line=w;y+=fs*1.3;}else line+=(line?' ':'')+w;}
    if(line)ln.push(`18 ${fy(y)} moveto (${line.trim()}) show`);
  }
  if(subtext){
    const baseY=headline?(headline.length>80?170:145):105;const sc=hexToRgb(s.tc);
    ln.push(`${(sc.r*.6).toFixed(3)} ${(sc.g*.6).toFixed(3)} ${(sc.b*.6).toFixed(3)} setrgbcolor /Helvetica findfont 11 scalefont setfont`);
    const words=subtext.replace(/[()\\]/g,'').split(' ');let l='',y=baseY;
    for(const w of words){if((l+' '+w).trim().length>58){ln.push(`18 ${fy(y)} moveto (${l.trim()}) show`);l=w;y+=14;}else l+=(l?' ':'')+w;}
    if(l)ln.push(`18 ${fy(y)} moveto (${l.trim()}) show`);
  }
  if(watermark){const wc=hexToRgb(s.tc);ln.push(`${(wc.r*.3).toFixed(3)} ${(wc.g*.3).toFixed(3)} ${(wc.b*.3).toFixed(3)} setrgbcolor /Helvetica findfont 9 scalefont setfont 18 ${fy(H-16)} moveto (${watermark.replace(/[()\\]/g,'')}) show`);}
  if(shapes.filter(s=>s.visible).length>0){
    ln.push(`\n% ══ DESIGN SHAPES ══`);
    for(const sh of shapes){
      if(!sh.visible)continue;
      ln.push(`\ngsave`);
      const op=(sh.opacity||100)/100;
      if(sh.type==='textbox'){
        const fc=hexToRgb(sh.textColor||'#fff');
        ln.push(`${fc.r.toFixed(3)} ${fc.g.toFixed(3)} ${fc.b.toFixed(3)} setrgbcolor /${sh.bold?'Helvetica-Bold':'Helvetica'} findfont ${sh.fontSize||16} scalefont setfont ${sh.x} ${fy(sh.y+sh.h*.7)} moveto (${(sh.text||'').replace(/[()\\]/g,'')}) show`);
      }else if(sh.type==='imgover'){
        const fr=hexToRgb('#808080');ln.push(`${fr.r.toFixed(3)} ${fr.g.toFixed(3)} ${fr.b.toFixed(3)} setrgbcolor ${sh.x} ${fy(sh.y+sh.h)} ${sh.w} ${sh.h} rf`);
      }else{
        const fr=hexToRgb(sh.fill||'#000'),sr=hexToRgb(sh.stroke||'#000');
        switch(sh.type){
          case'rect':{if(sh.fill!=='none'){ln.push(`${fr.r.toFixed(3)} ${fr.g.toFixed(3)} ${fr.b.toFixed(3)} setrgbcolor ${sh.x} ${fy(sh.y+sh.h)} ${sh.w} ${sh.h} rf`);}if(sh.stroke!=='none'){ln.push(`${sr.r.toFixed(3)} ${sr.g.toFixed(3)} ${sr.b.toFixed(3)} setrgbcolor ${sh.strokeWidth||1} setlinewidth newpath ${sh.x} ${fy(sh.y+sh.h)} moveto ${sh.w} 0 rlineto 0 ${sh.h} rlineto ${sh.w} neg 0 rlineto closepath stroke`);}break;}
          case'ellipse':{ln.push(`newpath gsave ${sh.cx} ${fy(sh.cy)} translate 1 ${(sh.ry/sh.rx).toFixed(4)} scale 0 0 ${sh.rx} 0 360 arc grestore`);if(sh.fill!=='none'){ln.push(`${fr.r.toFixed(3)} ${fr.g.toFixed(3)} ${fr.b.toFixed(3)} setrgbcolor fill`);}if(sh.stroke!=='none'){ln.push(`${sr.r.toFixed(3)} ${sr.g.toFixed(3)} ${sr.b.toFixed(3)} setrgbcolor ${sh.strokeWidth||1} setlinewidth stroke`);}break;}
          case'triangle':{const tp=[[sh.x+sh.w/2,sh.y],[sh.x+sh.w,sh.y+sh.h],[sh.x,sh.y+sh.h]];ln.push(`newpath ${tp[0][0]} ${fy(tp[0][1])} moveto ${tp[1][0]} ${fy(tp[1][1])} lineto ${tp[2][0]} ${fy(tp[2][1])} lineto closepath`);if(sh.fill!=='none')ln.push(`${fr.r.toFixed(3)} ${fr.g.toFixed(3)} ${fr.b.toFixed(3)} setrgbcolor fill`);if(sh.stroke!=='none')ln.push(`${sr.r.toFixed(3)} ${sr.g.toFixed(3)} ${sr.b.toFixed(3)} setrgbcolor ${sh.strokeWidth||1} setlinewidth stroke`);break;}
          case'star':{let fst=true;ln.push('newpath');for(let i=0;i<10;i++){const rad=i%2===0?sh.r:sh.r*.4,a=(i*Math.PI/5)-Math.PI/2;ln.push(fst?`${(sh.cx+rad*Math.cos(a)).toFixed(1)} ${fy(sh.cy+rad*Math.sin(a)).toFixed(1)} moveto`:`${(sh.cx+rad*Math.cos(a)).toFixed(1)} ${fy(sh.cy+rad*Math.sin(a)).toFixed(1)} lineto`);fst=false;}ln.push('closepath');if(sh.fill!=='none')ln.push(`${fr.r.toFixed(3)} ${fr.g.toFixed(3)} ${fr.b.toFixed(3)} setrgbcolor fill`);if(sh.stroke!=='none')ln.push(`${sr.r.toFixed(3)} ${sr.g.toFixed(3)} ${sr.b.toFixed(3)} setrgbcolor ${sh.strokeWidth||1} setlinewidth stroke`);break;}
          case'line':{ln.push(`${sr.r.toFixed(3)} ${sr.g.toFixed(3)} ${sr.b.toFixed(3)} setrgbcolor ${sh.strokeWidth||2} setlinewidth newpath ${sh.x1} ${fy(sh.y1)} moveto ${sh.x2} ${fy(sh.y2)} lineto stroke`);break;}
          case'pen':case'draw':{const ps=sh.points||[];if(ps.length<2)break;ln.push(`newpath ${ps[0].x.toFixed(1)} ${fy(ps[0].y).toFixed(1)} moveto`);for(let i=1;i<ps.length;i++)ln.push(`${ps[i].x.toFixed(1)} ${fy(ps[i].y).toFixed(1)} lineto`);if(sh.closed)ln.push('closepath');if(sh.fill!=='none')ln.push(`${fr.r.toFixed(3)} ${fr.g.toFixed(3)} ${fr.b.toFixed(3)} setrgbcolor fill`);if(sh.stroke!=='none')ln.push(`${sr.r.toFixed(3)} ${sr.g.toFixed(3)} ${sr.b.toFixed(3)} setrgbcolor ${sh.strokeWidth||2} setlinewidth stroke`);break;}
        }
      }
      ln.push('grestore');
    }
  }
  ln.push('','showpage','%%EOF');
  return ln.join('\n');
}

/* ─── EPS PARSER ─── */
function parseEPS(txt){
  const shapes=[];const lines=txt.split('\n');let cur=null;let r=0,g=0,b=0,sw=2;
  for(const ln of lines){
    const t=ln.trim();
    const m=t.match(/^%\s+([a-z]+)\s+\[(.+)\]/);
    if(m){cur={id:`sh_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,type:m[1],name:m[2],visible:true,opacity:100};}
    const cm=t.match(/^([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+setrgbcolor$/);
    if(cm){r=parseFloat(cm[1]);g=parseFloat(cm[2]);b=parseFloat(cm[3]);}
    const sm=t.match(/^([\d.]+)\s+setlinewidth$/);
    if(sm)sw=parseFloat(sm[1]);
    if(t==='fill'&&cur)cur.fill=`#${Math.round(r*255).toString(16).padStart(2,'0')}${Math.round(g*255).toString(16).padStart(2,'0')}${Math.round(b*255).toString(16).padStart(2,'0')}`;
    if(t==='stroke'&&cur){cur.stroke=`#${Math.round(r*255).toString(16).padStart(2,'0')}${Math.round(g*255).toString(16).padStart(2,'0')}${Math.round(b*255).toString(16).padStart(2,'0')}`;cur.strokeWidth=sw;}
    if(t==='grestore'&&cur?.type){shapes.push({...cur});cur=null;}
  }
  return shapes;
}

/* ─── UI PRIMITIVES ─── */
const MI=({n,sz=20,col,st})=>(<span className="material-icons-round" style={{fontSize:sz,color:col,lineHeight:1,display:"inline-flex",alignItems:"center",userSelect:"none",flexShrink:0,...st}}>{n}</span>);
const Divider=()=><div style={{height:1,background:C.div,margin:"8px 0"}}/>;
const SHead=({icon,label,col})=>(
  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
    <MI n={icon} sz={14} col={col||C.primary}/>
    <span style={{fontSize:10,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:"1px"}}>{label}</span>
  </div>
);

function Fld({label,value,onChange,placeholder,multi,rows=2,dark=true}){
  const base={width:"100%",border:`1.5px solid ${C.border}`,borderRadius:4,padding:"7px 9px",fontSize:13,color:C.text,background:dark?"#111a11":"#f8f8f8",resize:"vertical",fontFamily:"'Roboto',sans-serif"};
  return(<div style={{display:"flex",flexDirection:"column",gap:4}}>
    <label style={{fontSize:10,fontWeight:600,color:C.textSec,textTransform:"uppercase",letterSpacing:".5px"}}>{label}</label>
    {multi?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base}/>
           :<input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base}/>}
  </div>);
}

function Sldr({label,value,onChange,min,max,step=1,unit=""}){
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
      <label style={{fontSize:10,fontWeight:600,color:C.textSec,textTransform:"uppercase",letterSpacing:".5px"}}>{label}</label>
      <span style={{fontSize:10,fontWeight:700,color:C.accent,fontFamily:"monospace"}}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
  </div>);
}

function ColRow({label,value,onChange,allowNone,isNone,onNone}){
  return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
    <label style={{fontSize:10,fontWeight:600,color:C.textSec,textTransform:"uppercase",letterSpacing:".3px",flex:1,minWidth:36}}>{label}</label>
    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
      {allowNone&&<button onClick={onNone} style={{fontSize:9,fontWeight:700,background:isNone?C.primary:"#1a2a1a",color:isNone?"#fff":C.textMuted,border:`1px solid ${isNone?C.primary:C.border}`,borderRadius:3,padding:"2px 5px",cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>None</button>}
      {!isNone&&<><input type="color" value={value||'#000000'} onChange={e=>onChange(e.target.value)} style={{width:24,height:22,border:`1px solid ${C.border}`,borderRadius:3,cursor:"pointer",padding:1,background:"transparent"}}/>
      <input type="text" value={value||''} onChange={e=>onChange(e.target.value)} style={{width:64,border:`1px solid ${C.border}`,borderRadius:3,padding:"2px 5px",fontSize:10,fontFamily:"monospace",color:C.text,background:"#111a11"}}/></>}
    </div>
  </div>);
}

function UpBtn({onClick,icon,label}){
  return(<button onClick={onClick} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:"#111a11",border:`1.5px dashed ${C.border}`,borderRadius:6,padding:"10px",color:C.textSec,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
    <MI n={icon} sz={16} col={C.textMuted}/>{label}
  </button>);
}

function Toast({msg,type}){
  const bg=type==="success"?C.primaryDk:type==="info"?C.blue:C.red;
  return(<div className="toast-in" style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:bg,color:"#fff",padding:"10px 20px",borderRadius:6,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:8,boxShadow:"0 6px 24px rgba(0,0,0,.5)",zIndex:9999,whiteSpace:"nowrap"}}>
    <MI n={type==="success"?"check_circle":"info"} sz={16} col="#fff"/>{msg}
  </div>);
}

/* ─── SHAPE ELEMENT ─── */
function ShapeEl({sh,selected,onSelect,editing,onDblClick}){
  const op=(sh.opacity||100)/100;
  const base={opacity:op,onClick:onSelect,onDoubleClick:onDblClick,className:selected?'':'sh-el',style:{cursor:onSelect?'pointer':'default'}};
  switch(sh.type){
    case'rect':return<rect x={sh.x} y={sh.y} width={sh.w||1} height={sh.h||1} rx={sh.rx||0} fill={sh.fill||'none'} stroke={sh.stroke||'none'} strokeWidth={sh.strokeWidth||1} {...base}/>;
    case'ellipse':return<ellipse cx={sh.cx} cy={sh.cy} rx={sh.rx||1} ry={sh.ry||1} fill={sh.fill||'none'} stroke={sh.stroke||'none'} strokeWidth={sh.strokeWidth||1} {...base}/>;
    case'triangle':return<polygon points={triPoints(sh.x,sh.y,sh.w||1,sh.h||1)} fill={sh.fill||'none'} stroke={sh.stroke||'none'} strokeWidth={sh.strokeWidth||1} {...base}/>;
    case'star':return<polygon points={starPoints(sh.cx,sh.cy,sh.r||1)} fill={sh.fill||'none'} stroke={sh.stroke||'none'} strokeWidth={sh.strokeWidth||1} {...base}/>;
    case'line':return<line x1={sh.x1} y1={sh.y1} x2={sh.x2} y2={sh.y2} stroke={sh.stroke||'#fff'} strokeWidth={sh.strokeWidth||2} opacity={op} onClick={onSelect} className={selected?'':'sh-el'} style={{cursor:onSelect?'pointer':'default'}}/>;
    case'pen':return<path d={cardinalSpline(sh.points||[],0.4,sh.closed)} fill={sh.closed?(sh.fill||'none'):'none'} stroke={sh.stroke||'none'} strokeWidth={sh.strokeWidth||2} opacity={op} strokeLinecap="round" strokeLinejoin="round" onClick={onSelect} className={selected?'':'sh-el'} style={{cursor:onSelect?'pointer':'default'}}/>;
    case'draw':{const ps=sh.points||[];if(ps.length<2)return null;return<path d={`M${ps.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}`} fill="none" stroke={sh.stroke||'#fff'} strokeWidth={sh.strokeWidth||2} opacity={op} strokeLinecap="round" strokeLinejoin="round" onClick={onSelect} className={selected?'':'sh-el'} style={{cursor:onSelect?'pointer':'default'}}/>;}
    case'textbox':
      return(<text x={sh.x} y={sh.y+(sh.h||0)*.75} fontSize={sh.fontSize||16} fontFamily={sh.fontFamily||"'Roboto',sans-serif"} fontWeight={sh.bold?700:400} fontStyle={sh.italic?"italic":"normal"} fill={sh.textColor||'#ffffff'} opacity={op} onClick={onSelect} onDoubleClick={onDblClick} className={selected?'':'sh-el'} style={{cursor:onSelect?'pointer':'default',userSelect:'none'}}>
        {(sh.text||'Text').split('\n').map((line,i)=>(
          <tspan key={i} x={sh.x} dy={i===0?0:(sh.fontSize||16)*1.25}>{line}</tspan>
        ))}
      </text>);
    case'imgover':
      return(
        <g onClick={onSelect} className={selected?'':'sh-el'} style={{cursor:onSelect?'pointer':'default',opacity:op}} onDoubleClick={onDblClick}>
          {sh.src?<image href={sh.src} x={sh.x} y={sh.y} width={sh.w||100} height={sh.h||100} preserveAspectRatio={sh.preserveAR?"xMidYMid meet":"none"}/>
                 :<rect x={sh.x} y={sh.y} width={sh.w||100} height={sh.h||100} fill="#2a3a2a" stroke="#4caf50" strokeWidth={1.5} strokeDasharray="6,3"/>}
          {!sh.src&&<text x={(sh.x||0)+(sh.w||100)/2} y={(sh.y||0)+(sh.h||100)/2} textAnchor="middle" dominantBaseline="middle" fill="#4caf50" fontSize={12} fontFamily="'Roboto',sans-serif">Drop image</text>}
        </g>
      );
    default:return null;
  }
}

/* ─── RESIZE HANDLES ─── */
function ResizeHandles({sh,onHandleDown}){
  const b=shapeBounds(sh);
  if(!b)return null;
  const {x,y,w,h}=b;
  const cx=x+w/2,cy=y+h/2;
  const handles=sh.type==='line'?[{id:'p1',px:sh.x1,py:sh.y1},{id:'p2',px:sh.x2,py:sh.y2}]
    :sh.type==='pen'||sh.type==='draw'?[]
    :[{id:'nw',px:x,py:y},{id:'n',px:cx,py:y},{id:'ne',px:x+w,py:y},
      {id:'e',px:x+w,py:cy},{id:'se',px:x+w,py:y+h},{id:'s',px:cx,py:y+h},
      {id:'sw',px:x,py:y+h},{id:'w',px:x,py:cy}];
  const cursors={nw:'nw-resize',n:'n-resize',ne:'ne-resize',e:'e-resize',se:'se-resize',s:'s-resize',sw:'sw-resize',w:'w-resize',p1:'move',p2:'move'};
  return(<g>
    <rect x={x-4} y={y-4} width={w+8} height={h+8} fill="none" stroke="#4caf50" strokeWidth={1.5} strokeDasharray="5,3" rx={2} style={{pointerEvents:"none"}}/>
    {handles.map(hd=>(<circle key={hd.id} className="res-handle" cx={hd.px} cy={hd.py} r={5} fill="#1b5e20" stroke="#69f0ae" strokeWidth={1.5} style={{cursor:cursors[hd.id]||'move',pointerEvents:'all'}} onMouseDown={e=>{e.stopPropagation();onHandleDown(hd.id,e);}}/>))}
  </g>);
}

/* ─── INLINE TEXT EDIT OVERLAY ─── */
function TextEditOverlay({sh,cardScale,cardRect,onChange,onDone}){
  const[val,setVal]=useState(sh.text||'');
  return(<textarea autoFocus value={val} onChange={e=>setVal(e.target.value)}
    onBlur={()=>{onChange(val);onDone();}}
    onKeyDown={e=>{if(e.key==='Escape'){onChange(val);onDone();}}}
    style={{position:'fixed',left:(cardRect?.left||0)+(sh.x)*(cardScale||1),top:(cardRect?.top||0)+(sh.y)*(cardScale||1),width:Math.max(sh.w||100,80)*(cardScale||1),height:Math.max(sh.h||40,30)*(cardScale||1),fontSize:(sh.fontSize||16)*(cardScale||1),fontFamily:sh.fontFamily||"'Roboto',sans-serif",fontWeight:sh.bold?700:400,fontStyle:sh.italic?"italic":"normal",color:sh.textColor||'#fff',background:'rgba(30,60,30,.92)',border:'2px solid #4caf50',borderRadius:3,resize:'none',padding:4,zIndex:2000,outline:'none'}}
  />);
}

/* ─── DESIGN CANVAS ─── */
function DesignCanvas({shapes,selectedIdx,activeTool,fillColor,fillNone,strokeColor,strokeNone,strokeWidth,shapeOpacity,cornerRadius,textProps,imgOverSrc,onAdd,onUpdate,onSelect,onDblClick,cardH}){
  const svgRef=useRef(null);
  const [drawing,setDrawing]=useState(false);
  const [startPt,setStartPt]=useState(null);
  const [live,setLive]=useState(null);
  const [penPts,setPenPts]=useState([]);
  const [penPrev,setPenPrev]=useState(null);
  const [fpPts,setFpPts]=useState([]);
  const dragRef=useRef(null);
  const resizeRef=useRef(null);
  const lastFRef=useRef(null);

  const svgPt=useCallback((e)=>{
    const r=svgRef.current.getBoundingClientRect();
    return{x:(e.clientX-r.left)*(CARD_W/r.width),y:(e.clientY-r.top)*(cardH/r.height)};
  },[cardH]);

  const mkSh=(type,d)=>({id:`sh_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,type,name:`${type} ${Date.now()%1000}`,fill:fillNone?'none':fillColor,stroke:strokeNone?'none':strokeColor,strokeWidth,opacity:shapeOpacity,visible:true,...d});

  const onMD=useCallback((e)=>{
    if(e.target.closest('.res-handle'))return;
    const pt=svgPt(e);
    if(activeTool==='select'){
      let found=-1;for(let i=shapes.length-1;i>=0;i--){if(shapes[i].visible&&hitTest(shapes[i],pt)){found=i;break;}}
      if(found>=0){onSelect(found);dragRef.current={start:pt,orig:{...shapes[found]},idx:found};}
      else onSelect(null);
      return;
    }
    if(activeTool==='pen'){setPenPts(p=>[...p,pt]);return;}
    if(activeTool==='draw'){setDrawing(true);lastFRef.current=pt;setFpPts([pt]);return;}
    if(activeTool==='textbox'){onAdd(mkSh('textbox',{x:pt.x-80,y:pt.y-20,w:180,h:40,...textProps}));return;}
    if(activeTool==='imgover'){
      const w=200,h=150;onAdd(mkSh('imgover',{x:pt.x-w/2,y:pt.y-h/2,w,h,src:imgOverSrc||null,preserveAR:true}));return;
    }
    setDrawing(true);setStartPt(pt);setLive(null);
  },[activeTool,shapes,svgPt,fillColor,fillNone,strokeColor,strokeNone,strokeWidth,shapeOpacity,textProps,imgOverSrc,onAdd,onSelect]);

  const onMM=useCallback((e)=>{
    const pt=svgPt(e);
    if(resizeRef.current){
      const{handle,orig,idx,startPt:sp}=resizeRef.current;
      const dx=pt.x-sp.x,dy=pt.y-sp.y;
      onUpdate(idx,resizeShape(orig,handle,dx,dy));
      return;
    }
    if(activeTool==='select'&&dragRef.current){
      const{start,orig,idx}=dragRef.current;
      onUpdate(idx,moveShape(orig,pt.x-start.x,pt.y-start.y));
      return;
    }
    if(activeTool==='pen'){setPenPrev(pt);return;}
    if(activeTool==='draw'&&drawing){
      const l=lastFRef.current;if(Math.hypot(pt.x-l.x,pt.y-l.y)>3){setFpPts(p=>[...p,pt]);lastFRef.current=pt;}
      return;
    }
    if(!drawing||!startPt)return;
    const x=Math.min(startPt.x,pt.x),y=Math.min(startPt.y,pt.y),w=Math.abs(pt.x-startPt.x),h=Math.abs(pt.y-startPt.y);
    const cx=(startPt.x+pt.x)/2,cy=(startPt.y+pt.y)/2,r=Math.hypot(w,h)/2;
    const base={fill:fillNone?'none':fillColor,stroke:strokeNone?'none':strokeColor,strokeWidth,opacity:shapeOpacity};
    switch(activeTool){
      case'rect':setLive({type:'rect',x,y,w,h,rx:cornerRadius,...base});break;
      case'ellipse':setLive({type:'ellipse',cx,cy,rx:w/2,ry:h/2,...base});break;
      case'triangle':setLive({type:'triangle',x,y,w,h,...base});break;
      case'star':setLive({type:'star',cx,cy,r,...base});break;
      case'line':setLive({type:'line',x1:startPt.x,y1:startPt.y,x2:pt.x,y2:pt.y,fill:'none',stroke:strokeNone?'none':strokeColor,strokeWidth,opacity:shapeOpacity});break;
    }
  },[activeTool,drawing,startPt,svgPt,fillColor,fillNone,strokeColor,strokeNone,strokeWidth,shapeOpacity,cornerRadius,onUpdate]);

  const onMU=useCallback((e)=>{
    resizeRef.current=null;
    dragRef.current=null;
    if(activeTool==='draw'&&drawing){
      const s=simplify(fpPts,2);
      if(s.length>1)onAdd(mkSh('draw',{points:s,closed:false}));
      setDrawing(false);setFpPts([]);lastFRef.current=null;return;
    }
    if(!drawing||!live){setDrawing(false);return;}
    const ok=live.type==='line'?Math.hypot(live.x2-live.x1,live.y2-live.y1)>10:live.type==='ellipse'?live.rx>4&&live.ry>4:live.type==='star'?live.r>5:(live.w>6&&live.h>6);
    if(ok)onAdd(mkSh(live.type,live));
    setDrawing(false);setStartPt(null);setLive(null);
  },[activeTool,drawing,live,fpPts,onAdd]);

  const onDbl=useCallback((e)=>{
    if(activeTool==='pen'&&penPts.length>=2){onAdd(mkSh('pen',{points:penPts,closed:false,smooth:true}));setPenPts([]);setPenPrev(null);}
  },[activeTool,penPts,onAdd]);

  const handleResizeDown=useCallback((handle,e)=>{
    if(selectedIdx===null)return;
    const pt=svgPt(e);
    resizeRef.current={handle,orig:{...shapes[selectedIdx]},idx:selectedIdx,startPt:pt};
  },[selectedIdx,shapes,svgPt]);

  useEffect(()=>{
    const h=e=>{if(e.key==='Escape'){setPenPts([]);setPenPrev(null);setDrawing(false);setLive(null);setFpPts([]);}};
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[]);

  const cursor=activeTool==='select'?'default':'crosshair';
  return(
    <svg ref={svgRef} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'all',cursor,zIndex:5}} viewBox={`0 0 ${CARD_W} ${cardH}`}
      onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onDoubleClick={onDbl}>
      {shapes.map((sh,i)=>sh.visible&&(<ShapeEl key={sh.id} sh={sh} selected={i===selectedIdx} onSelect={()=>onSelect(i)} onDblClick={()=>onDblClick&&onDblClick(i)}/>))}
      {live&&<ShapeEl sh={live}/>}
      {fpPts.length>1&&<polyline points={fpPts.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={strokeNone?'#888':strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity={.8}/>}
      {penPts.length>0&&<>
        {penPts.length>1&&<path d={cardinalSpline(penPts)} fill="none" stroke={strokeNone?'#888':strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" opacity={.8}/>}
        {penPrev&&<line x1={penPts[penPts.length-1].x} y1={penPts[penPts.length-1].y} x2={penPrev.x} y2={penPrev.y} stroke={strokeNone?'#888':strokeColor} strokeWidth={1} strokeDasharray="4,3" opacity={.6}/>}
        {penPts.map((p,i)=>(<circle key={i} cx={p.x} cy={p.y} r={4} fill={i===0?"#ffb300":"#4caf50"} stroke="#fff" strokeWidth={1.5} style={{cursor:'pointer'}}/>))}
      </>}
      {activeTool==='select'&&selectedIdx!=null&&shapes[selectedIdx]&&(
        <ResizeHandles sh={shapes[selectedIdx]} onHandleDown={handleResizeDown}/>
      )}
    </svg>
  );
}

/* ─── STATIC SHAPE LAYER (for PNG export) ─── */
function StaticLayer({shapes,cardH}){
  return(<svg style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:4}} viewBox={`0 0 ${CARD_W} ${cardH}`} preserveAspectRatio="none">
    {(shapes||[]).map(sh=>sh.visible&&<ShapeEl key={sh.id} sh={sh}/>)}
  </svg>);
}

/* ─── TEMPLATE BUILDER ─── */
function TplBuilder({onSave,onClose,editing}){
  const[name,setName]=useState(editing?.name||"Custom Template");
  const[bg,setBg]=useState(editing?.style?.bg||"#0d0d0d");
  const[accent,setAccent]=useState(editing?.style?.accent||"#c62828");
  const[acc2,setAcc2]=useState(editing?.style?.acc2||"#f9a825");
  const[tc,setTc]=useState(editing?.style?.tc||"#ffffff");
  const[tagBg,setTagBg]=useState(editing?.style?.tagBg||"#c62828");
  const[dark,setDark]=useState(editing?.style?.dark??true);
  const PALETTES=[{n:"Midnight Red",bg:"#0d0d0d",a:"#e53935",a2:"#ff7043",tc:"#fff",tg:"#e53935",dk:true},{n:"Forest",bg:"#1b2e1b",a:"#66bb6a",a2:"#aed581",tc:"#fff",tg:"#388e3c",dk:true},{n:"Ocean",bg:"#0a1628",a:"#29b6f6",a2:"#00e5ff",tc:"#fff",tg:"#0288d1",dk:true},{n:"Warm Gold",bg:"#fdf6e3",a:"#bf8600",a2:"#6d4c41",tc:"#2d1b00",tg:"#bf8600",dk:false},{n:"Urban",bg:"#212121",a:"#90a4ae",a2:"#eceff1",tc:"#fff",tg:"#607d8b",dk:true},{n:"Crimson",bg:"#fff8f8",a:"#c62828",a2:"#1a237e",tc:"#1a1a1a",tg:"#c62828",dk:false},{n:"Neon",bg:"#0a001a",a:"#e040fb",a2:"#00e5ff",tc:"#fff",tg:"#7b1fa2",dk:true},{n:"Olive",bg:"#f4f1e0",a:"#5d6b00",a2:"#a17d00",tc:"#1a1a00",tg:"#5d6b00",dk:false}];
  const prev={id:"prev",name,sub:"Custom",custom:true,style:{bg,accent,acc2,tc,tagBg,dark}};
  return(<div className="mo" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:C.panel,border:`1px solid ${C.panelBorder}`,borderRadius:10,width:700,maxWidth:"96vw",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 80px rgba(0,0,0,.8)"}}>
      <div style={{background:`linear-gradient(135deg,#1b5e20,#2e7d32)`,padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"'Roboto Condensed',sans-serif"}}>{editing?"Edit":"Create"} Template</span>
        <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,255,255,.7)",fontSize:20,lineHeight:1}}>✕</button>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>
        <div style={{width:280,borderRight:`1px solid ${C.border}`,padding:14,overflow:"auto",display:"flex",flexDirection:"column",gap:12}}>
          <Fld label="Name" value={name} onChange={setName}/>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            <ColRow label="BG"       value={bg}     onChange={setBg}/>
            <ColRow label="Accent"   value={accent} onChange={v=>{setAccent(v);setTagBg(v);}}/>
            <ColRow label="Accent 2" value={acc2}   onChange={setAcc2}/>
            <ColRow label="Text"     value={tc}     onChange={setTc}/>
            <ColRow label="Tag BG"   value={tagBg}  onChange={setTagBg}/>
          </div>
          <div style={{display:"flex",gap:6}}>
            {[{v:true,l:"Dark"},{v:false,l:"Light"}].map(o=><button key={String(o.v)} onClick={()=>setDark(o.v)} style={{flex:1,padding:"7px",border:`1.5px solid ${dark===o.v?C.primary:C.border}`,borderRadius:5,cursor:"pointer",background:dark===o.v?C.primaryBg:"#111a11",color:dark===o.v?C.primary:C.textSec,fontSize:11,fontWeight:600,fontFamily:"'Roboto',sans-serif"}}>{o.l}</button>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {PALETTES.map(p=><button key={p.n} onClick={()=>{setBg(p.bg);setAccent(p.a);setAcc2(p.a2);setTc(p.tc);setTagBg(p.tg);setDark(p.dk);}} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 7px",border:`1px solid ${C.border}`,borderRadius:4,cursor:"pointer",background:"#111a11",fontSize:9,color:C.textSec,textAlign:"left",fontFamily:"'Roboto',sans-serif"}}>
              <div style={{width:18,height:18,borderRadius:3,background:p.bg,border:`2px solid ${p.a}`,flexShrink:0}}/>{p.n}
            </button>)}
          </div>
        </div>
        <div style={{flex:1,background:"#0f0f0f",display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflow:"auto"}}>
          <div style={{transform:"scale(.48)",transformOrigin:"center center"}}>
            <MiniCard template={prev}/>
          </div>
        </div>
      </div>
      <div style={{padding:"10px 16px",borderTop:`1px solid ${C.div}`,display:"flex",justifyContent:"flex-end",gap:8,background:C.panel2}}>
        <button onClick={onClose} style={{padding:"7px 16px",border:`1px solid ${C.border}`,borderRadius:4,background:"#111a11",color:C.textSec,fontSize:12,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>Cancel</button>
        <button onClick={()=>onSave({id:editing?.id||`custom_${Date.now()}`,name,sub:"Custom",custom:true,style:{bg,accent,acc2,tc,tagBg,dark}})} style={{padding:"7px 18px",border:"none",borderRadius:4,background:C.primaryDk,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>Save Template</button>
      </div>
    </div>
  </div>);
}

function MiniCard({template}){
  const s=template.style;
  return(<div style={{width:540,background:s.bg,borderRadius:3,overflow:"hidden"}}>
    <div style={{height:4,background:`linear-gradient(90deg,${s.accent},${s.acc2})`}}/>
    <div style={{padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${s.dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.1)"}`}}>
      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,fontWeight:700,color:s.accent,textTransform:"uppercase"}}>YOUR MEDIA</div>
    </div>
    <div style={{padding:"20px 18px 16px"}}>
      <div style={{background:s.tagBg,color:"#fff",display:"inline-block",fontSize:10,fontWeight:700,textTransform:"uppercase",padding:"3px 9px",marginBottom:10,fontFamily:"'Roboto Condensed',sans-serif"}}>BREAKING NEWS</div>
      <div style={{fontSize:26,fontWeight:900,color:s.tc,lineHeight:1.2,fontFamily:"'Playfair Display',Georgia,serif",marginBottom:8}}>Your Headline Here</div>
      <div style={{fontSize:13,color:s.dark?"rgba(255,255,255,.6)":"rgba(0,0,0,.6)"}}>Summary text preview.</div>
    </div>
    <div style={{height:3,background:`linear-gradient(90deg,${s.acc2},${s.accent})`}}/>
  </div>);
}

/* ─── SETTINGS MODAL ─── */
function SettingsModal({settings,onSave,onClose}){
  const[s,setS]=useState({...settings});
  const upd=(k,v)=>setS(p=>({...p,[k]:v}));
  return(<div className="mo" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:C.panel,border:`1px solid ${C.panelBorder}`,borderRadius:10,width:560,maxWidth:"96vw",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 80px rgba(0,0,0,.8)"}}>
      <div style={{background:`linear-gradient(135deg,#0d1b0d,#1b3a1b)`,padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <MI n="settings" sz={18} col={C.accent}/>
          <span style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:"1px"}}>SOFTWARE PREFERENCES</span>
        </div>
        <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,255,255,.6)",fontSize:20}}>✕</button>
      </div>
      <div style={{flex:1,overflow:"auto",padding:20,display:"flex",flexDirection:"column",gap:20}}>
        
        {/* Gemini */}
        <div style={{padding:14,background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,borderRadius:8}}>
          <SHead icon="auto_awesome" label="Google Gemini API (Image Generation)" col={C.purple}/>
          <div style={{fontSize:11,color:C.textSec,marginBottom:10}}>Get your API key from <strong style={{color:C.accent}}>aistudio.google.com</strong> → Get API key. Enables AI image generation.</div>
          <Fld label="Gemini API Key" value={s.geminiKey||''} onChange={v=>upd('geminiKey',v)} placeholder="AIza..."/>
          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:C.textMuted}}>Model:</span>
            <select value={s.geminiModel||'gemini-2.0-flash-exp'} onChange={e=>upd('geminiModel',e.target.value)} style={{fontSize:11,background:"#111a11",border:`1px solid ${C.border}`,color:C.text,borderRadius:3,padding:"3px 6px"}}>
              <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (image gen)</option>
              <option value="imagen-3.0-generate-002">Imagen 3 (higher quality)</option>
            </select>
          </div>
        </div>

        {/* Google Search */}
        <div style={{padding:14,background:C.blueBg,border:`1px solid ${C.blueBorder}`,borderRadius:8}}>
          <SHead icon="image_search" label="Google Custom Image Search" col={C.blue}/>
          <div style={{fontSize:11,color:C.textSec,marginBottom:10}}>1. Enable <strong style={{color:C.accent}}>Custom Search API</strong> in Google Cloud Console<br/>2. Create a Programmable Search Engine at <strong style={{color:C.accent}}>programmablesearchengine.google.com</strong></div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <Fld label="Google Search API Key" value={s.searchKey||''} onChange={v=>upd('searchKey',v)} placeholder="AIza..."/>
            <Fld label="Search Engine ID (cx)" value={s.searchCx||''} onChange={v=>upd('searchCx',v)} placeholder="abc123..."/>
          </div>
        </div>

        {/* Preferences */}
        <div style={{padding:14,background:"#111a11",border:`1px solid ${C.border}`,borderRadius:8}}>
          <SHead icon="tune" label="Editor Preferences"/>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}>
              <label style={{fontSize:10,fontWeight:600,color:C.textSec,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:5}}>Default Language</label>
              <select value={s.defaultLang||'en'} onChange={e=>upd('defaultLang',e.target.value)} style={{width:"100%",fontSize:12,background:"#111a11",border:`1px solid ${C.border}`,color:C.text,borderRadius:4,padding:"6px 8px"}}>
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:10,fontWeight:600,color:C.textSec,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:5}}>Preview Zoom</label>
              <select value={String(s.defaultZoom||1)} onChange={e=>upd('defaultZoom',Number(e.target.value))} style={{width:"100%",fontSize:12,background:"#111a11",border:`1px solid ${C.border}`,color:C.text,borderRadius:4,padding:"6px 8px"}}>
                <option value="0.7">70%</option><option value="0.85">85%</option>
                <option value="1">100%</option><option value="1.15">115%</option>
              </select>
            </div>
          </div>
          <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}>
            <input type="checkbox" id="autoSave" checked={!!s.autoSave} onChange={e=>upd('autoSave',e.target.checked)} style={{accentColor:C.primary,cursor:'pointer'}}/>
            <label htmlFor="autoSave" style={{fontSize:12,color:C.textSec,cursor:'pointer'}}>Auto-save settings across sessions (uses artifact storage)</label>
          </div>
        </div>

        {/* About */}
        <div style={{padding:12,background:"#0a1a0a",border:`1px solid ${C.border}`,borderRadius:8,display:"flex",alignItems:"center",gap:12}}>
          <img src="./assets/logo.png" alt="" style={{width:40,height:40,borderRadius:8,objectFit:"cover"}} onError={e=>e.target.style.display='none'}/>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.accent}}>PhotoCard Studio v1.6</div>
            <div style={{fontSize:11,color:C.textSec}}>News Edition · by Abdullah Al Fahim</div>
            <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>Layers · Resize · Image Overlay · AI Search · AI Generation</div>
          </div>
        </div>
      </div>
      <div style={{padding:"10px 16px",borderTop:`1px solid ${C.div}`,display:"flex",justifyContent:"flex-end",gap:8,background:C.panel2}}>
        <button onClick={onClose} style={{padding:"7px 16px",border:`1px solid ${C.border}`,borderRadius:4,background:"#111a11",color:C.textSec,fontSize:12,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>Cancel</button>
        <button onClick={()=>onSave(s)} style={{padding:"7px 18px",border:"none",borderRadius:4,background:C.primaryDk,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Roboto',sans-serif",display:"flex",alignItems:"center",gap:5}}>
          <MI n="save" sz={14} col="#fff"/>Save Settings
        </button>
      </div>
    </div>
  </div>);
}

/* ─── IMAGE SEARCH MODAL ─── */
function ImageSearchModal({settings,onSelect,onClose,showToast}){
  const[q,setQ]=useState('');const[results,setResults]=useState([]);const[loading,setLoading]=useState(false);const[err,setErr]=useState('');
  const search=async()=>{
    if(!settings.searchKey||!settings.searchCx){setErr('Add your Google Search API Key and Engine ID in Settings first.');return;}
    if(!q.trim())return;
    setLoading(true);setErr('');setResults([]);
    try{
      const url=`https://www.googleapis.com/customsearch/v1?key=${settings.searchKey}&cx=${settings.searchCx}&q=${encodeURIComponent(q)}&searchType=image&num=10&imgSize=large`;
      const r=await fetch(url);const d=await r.json();
      if(d.error)throw new Error(d.error.message);
      setResults(d.items||[]);
      if(!(d.items||[]).length)setErr('No results found. Try a different query.');
    }catch(e){setErr(`Search error: ${e.message}`);}
    setLoading(false);
  };
  const pickImg=async(url)=>{
    showToast("Loading image…","info");
    try{
      const r=await fetch(url,{mode:'cors'});const blob=await r.blob();
      const reader=new FileReader();reader.onload=e=>onSelect(e.target.result);reader.readAsDataURL(blob);
    }catch{
      // fallback: use URL directly
      onSelect(url);
    }
    onClose();
  };
  return(<div className="mo" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:C.panel,border:`1px solid ${C.panelBorder}`,borderRadius:10,width:760,maxWidth:"96vw",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 80px rgba(0,0,0,.8)"}}>
      <div style={{background:`linear-gradient(135deg,#0a1628,#1565c0)`,padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><MI n="image_search" sz={18} col="#fff"/><span style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"'Roboto Condensed',sans-serif"}}>Google Image Search</span></div>
        <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,255,255,.6)",fontSize:20}}>✕</button>
      </div>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8}}>
        <input type="text" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Search for news images… e.g. 'Dhaka flooding 2025'" style={{flex:1,background:"#111a11",border:`1.5px solid ${C.border}`,borderRadius:6,padding:"9px 12px",fontSize:13,color:C.text,fontFamily:"'Roboto',sans-serif"}}/>
        <button onClick={search} disabled={loading} style={{display:"flex",alignItems:"center",gap:6,background:C.blue,border:"none",color:"#fff",borderRadius:6,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"'Roboto',sans-serif",opacity:loading?.65:1}}>
          <MI n={loading?"hourglass_top":"search"} sz={16} col="#fff"/>{loading?"…":"Search"}
        </button>
      </div>
      <div style={{flex:1,overflow:"auto",padding:14}}>
        {err&&<div style={{padding:"10px 14px",background:C.redBg,border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,fontSize:12,marginBottom:12}}>{err}</div>}
        {!settings.searchKey&&<div style={{padding:"14px",background:C.yellowBg,border:`1px solid ${C.yellow}44`,borderRadius:6,color:C.yellow,fontSize:12,lineHeight:1.6}}>
          <strong>⚙ Setup Required:</strong> Open Settings (top-right) and add your <strong>Google Custom Search API Key</strong> and <strong>Search Engine ID</strong> to enable image search.
        </div>}
        {results.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
          {results.map((item,i)=>(
            <div key={i} className="srch-img" onClick={()=>pickImg(item.link)} style={{border:`2px solid ${C.border}`,borderRadius:6,overflow:"hidden",cursor:"pointer",transition:"all .2s",background:"#111a11"}}>
              <img src={item.image?.thumbnailLink||item.link} alt={item.title} style={{width:"100%",height:110,objectFit:"cover",display:"block"}}/>
              <div style={{padding:"5px 7px",fontSize:10,color:C.textSec,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
            </div>
          ))}
        </div>}
        {results.length===0&&!err&&!loading&&!q&&(
          <div style={{textAlign:"center",padding:"30px 0",color:C.textMuted}}>
            <MI n="image_search" sz={48} col={C.border}/>
            <div style={{marginTop:12,fontSize:13}}>Search Google for news images</div>
            <div style={{fontSize:11,marginTop:6,color:C.textMuted}}>Click an image to place it as an overlay layer on the card</div>
          </div>
        )}
      </div>
    </div>
  </div>);
}

/* ─── GEMINI MODAL ─── */
function GeminiModal({settings,onResult,onClose,showToast}){
  const[prompt,setPrompt]=useState('');const[loading,setLoading]=useState(false);const[err,setErr]=useState('');const[preview,setPreview]=useState(null);
  const generate=async()=>{
    if(!settings.geminiKey){setErr('Add your Gemini API Key in Settings first.');return;}
    if(!prompt.trim())return;
    setLoading(true);setErr('');setPreview(null);
    try{
      const model=settings.geminiModel||'gemini-2.0-flash-exp';
      let url,body,parseResp;
      if(model.includes('imagen')){
        url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${settings.geminiKey}`;
        body={instances:[{prompt}],parameters:{sampleCount:1,aspectRatio:"4:3"}};
        parseResp=async(r)=>{const d=await r.json();if(d.error)throw new Error(d.error.message);const b64=d.predictions?.[0]?.bytesBase64Encoded;if(!b64)throw new Error("No image returned");return`data:image/png;base64,${b64}`;};
      }else{
        url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.geminiKey}`;
        body={contents:[{parts:[{text:`Generate a realistic news photograph for this scene: ${prompt}. Photo should be high quality, photorealistic, suitable for news article.`}]}],generationConfig:{responseModalities:["TEXT","IMAGE"]}};
        parseResp=async(r)=>{const d=await r.json();if(d.error)throw new Error(d.error.message);const parts=d.candidates?.[0]?.content?.parts||[];const imgPart=parts.find(p=>p.inlineData);if(!imgPart)throw new Error("No image in response. Try the Imagen model or a different prompt.");return`data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;};
      }
      const resp=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const dataUrl=await parseResp(resp);
      setPreview(dataUrl);
    }catch(e){setErr(`Generation failed: ${e.message}`);}
    setLoading(false);
  };
  const PRESETS=["Professional news photograph, breaking news scene","Aerial cityscape view at golden hour, Bangladesh","Business meeting with diverse professionals","Natural disaster emergency response team","Political press conference, microphones, crowd","Sports victory celebration, stadium crowd"];
  return(<div className="mo" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:C.panel,border:`1px solid ${C.panelBorder}`,borderRadius:10,width:700,maxWidth:"96vw",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 80px rgba(0,0,0,.8)"}}>
      <div style={{background:`linear-gradient(135deg,#1a0028,#6a1b9a)`,padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><MI n="auto_awesome" sz={18} col="#ce93d8"/><span style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"'Roboto Condensed',sans-serif"}}>Gemini AI Image Generation</span></div>
        <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,255,255,.6)",fontSize:20}}>✕</button>
      </div>
      <div style={{flex:1,overflow:"auto",padding:18,display:"flex",gap:16}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{padding:10,background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,borderRadius:6,fontSize:11,color:C.textSec,lineHeight:1.6}}>
            Powered by <strong style={{color:"#ce93d8"}}>Google Gemini AI</strong>. Enter a prompt to generate a news-ready image. Add your API key in Settings.
          </div>
          <div>
            <label style={{fontSize:10,fontWeight:600,color:C.textSec,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:5}}>Quick Presets</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {PRESETS.map(p=><button key={p} onClick={()=>setPrompt(p)} style={{fontSize:10,padding:"4px 8px",border:`1px solid ${C.purpleBorder}`,borderRadius:4,background:C.purpleBg,color:"#ce93d8",cursor:"pointer",fontFamily:"'Roboto',sans-serif",textAlign:"left"}}>{p.slice(0,40)}…</button>)}
            </div>
          </div>
          <div>
            <label style={{fontSize:10,fontWeight:600,color:C.textSec,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:5}}>Your Prompt</label>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe the image you want to generate…" rows={4} style={{width:"100%",background:"#111a11",border:`1.5px solid ${C.purpleBorder}`,borderRadius:6,padding:"9px 12px",fontSize:13,color:C.text,fontFamily:"'Roboto',sans-serif",resize:"vertical"}}/>
          </div>
          <button onClick={generate} disabled={loading||!prompt.trim()} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,background:loading?"#2a1a3a":C.purple,border:"none",color:"#fff",borderRadius:6,padding:"11px",fontSize:13,fontWeight:700,cursor:loading||!prompt.trim()?"not-allowed":"pointer",fontFamily:"'Roboto',sans-serif",transition:"all .2s",opacity:loading||!prompt.trim()?.65:1}}>
            <MI n={loading?"hourglass_top":"auto_awesome"} sz={16} col="#fff"/>{loading?"Generating with Gemini…":"Generate Image"}
          </button>
          {err&&<div style={{padding:"9px 12px",background:C.redBg,border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,fontSize:12}}>{err}</div>}
          {!settings.geminiKey&&<div style={{padding:"9px 12px",background:C.yellowBg,border:`1px solid ${C.yellow}44`,borderRadius:6,color:C.yellow,fontSize:11,lineHeight:1.6}}><strong>⚙ Setup:</strong> Open Settings and add your <strong>Gemini API Key</strong> from aistudio.google.com to enable generation.</div>}
        </div>
        <div style={{width:260,flexShrink:0,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{flex:1,background:"#0a0a0a",border:`1px solid ${C.border}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",minHeight:200,overflow:"hidden"}}>
            {preview?<img src={preview} alt="generated" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<div style={{textAlign:"center",color:C.textMuted}}><MI n="image" sz={48} col={C.border}/><div style={{fontSize:11,marginTop:8}}>Generated image<br/>appears here</div></div>}
          </div>
          {preview&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
            <button onClick={()=>{onResult(preview,'bg');onClose();}} style={{display:"flex",alignItems:"center",gap:6,background:"#111a11",border:`1px solid ${C.primary}`,borderRadius:5,padding:"8px 12px",color:C.primary,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
              <MI n="wallpaper" sz={15} col={C.primary}/>Use as Card Image
            </button>
            <button onClick={()=>{onResult(preview,'overlay');onClose();}} style={{display:"flex",alignItems:"center",gap:6,background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,borderRadius:5,padding:"8px 12px",color:"#ce93d8",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
              <MI n="layers" sz={15} col="#ce93d8}"/>Add as Overlay Layer
            </button>
          </div>}
        </div>
      </div>
    </div>
  </div>);
}

/* ─── PHOTO CARD ─── */
function PhotoCard({template,headline,subtext,tag,imageUrl,imgNatW,imgNatH,imgZoom,imgX,imgY,onImgDragStart,logoText,logoUrl,adConfig,adBannerUrl,adBannerH,watermark,cardRef,isExporting,cardLang,shapes,designActive,activeTool,fillColor,fillNone,strokeColor,strokeNone,strokeWidth,shapeOpacity,cornerRadius,textProps,imgOverSrc,selectedIdx,onShapeAdd,onShapeUpdate,onShapeSelect,onDblClickShape,onCardH}){
  const s=template.style,cl=cardLang;
  const dateStr=new Date().toLocaleDateString(cl.dateLocale,{month:"short",day:"numeric",year:"numeric"});
  const frameH=imgNatW&&imgNatH?Math.round(CARD_W/(imgNatW/imgNatH)):0;
  const innerRef=useRef(null);
  const liveH=useRef(0);
  useEffect(()=>{
    if(!innerRef.current)return;
    const obs=new ResizeObserver(()=>{const h=innerRef.current?.offsetHeight||0;if(h!==liveH.current){liveH.current=h;onCardH(h);}});
    obs.observe(innerRef.current);
    const h=innerRef.current.offsetHeight||0;liveH.current=h;onCardH(h);
    return()=>obs.disconnect();
  },[]);

  return(
    <div ref={el=>{cardRef.current=el;innerRef.current=el;}} style={{width:CARD_W,background:s.bg,borderRadius:4,overflow:"hidden",boxShadow:"0 8px 48px rgba(0,0,0,.6)",display:"flex",flexDirection:"column",fontFamily:cl.bodyFont,position:"relative",userSelect:"none"}}>
      <div style={{height:4,background:`linear-gradient(90deg,${s.accent},${s.acc2})`,flexShrink:0}}/>
      {/* Header */}
      <div style={{padding:"11px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,borderBottom:`1px solid ${s.dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"}`}}>
        {logoUrl?<img src={logoUrl} alt="logo" style={{height:26,maxWidth:130,objectFit:"contain"}}/>
                :<div style={{fontFamily:cl.tagFont,fontSize:20,fontWeight:700,color:s.accent,letterSpacing:cl.logoSpacing,textTransform:cl.logoTransform}}>{logoText||cl.defLogoText}</div>}
        <div style={{fontSize:10,color:s.dark?"rgba(255,255,255,.3)":"rgba(0,0,0,.3)",fontWeight:500}}>{dateStr}</div>
      </div>
      {/* Image */}
      {imageUrl&&frameH>0&&(
        <div onMouseDown={!designActive?onImgDragStart:undefined} style={{position:"relative",width:CARD_W,height:frameH,overflow:"hidden",flexShrink:0,cursor:designActive?"default":"move"}}>
          <img src={imageUrl} alt="" draggable={false} style={{position:"absolute",top:"50%",left:"50%",width:`${imgZoom}%`,height:"auto",transform:`translate(calc(-50% + ${imgX}px),calc(-50% + ${imgY}px))`,display:"block"}}/>
          <div style={{position:"absolute",inset:0,background:s.dark?`linear-gradient(to top,${s.bg}f0,transparent 55%)`:`linear-gradient(to top,${s.bg}e0,transparent 60%)`,pointerEvents:"none"}}/>
          {tag&&<div style={{position:"absolute",top:12,left:18,background:s.tagBg,color:"#fff",fontSize:10,fontWeight:700,letterSpacing:cl.tagSpacing,textTransform:cl.tagTransform,padding:"3px 9px",fontFamily:cl.tagFont}}>{tag}</div>}
          {!isExporting&&<div style={{position:"absolute",bottom:8,right:10,background:"rgba(0,0,0,.4)",borderRadius:3,padding:"2px 6px",fontSize:9,color:"rgba(255,255,255,.7)",pointerEvents:"none"}}>↔ DRAG</div>}
        </div>
      )}
      {/* Content */}
      <div style={{padding:"16px 18px 12px"}}>
        {!imageUrl&&tag&&<div style={{background:s.tagBg,color:"#fff",display:"inline-block",fontSize:10,fontWeight:700,letterSpacing:cl.tagSpacing,textTransform:cl.tagTransform,padding:"3px 9px",marginBottom:9,fontFamily:cl.tagFont}}>{tag}</div>}
        {headline&&<div style={{fontSize:headline.length>80?18:headline.length>50?22:26,fontWeight:900,color:s.tc,lineHeight:cl.lineHeight,fontFamily:cl.headlineFont,marginBottom:subtext?8:0,wordBreak:"break-word"}}>{headline}</div>}
        {subtext&&<div style={{fontSize:13,color:s.dark?"rgba(255,255,255,.62)":"rgba(0,0,0,.6)",lineHeight:1.65,wordBreak:"break-word"}}>{subtext}</div>}
        <div style={{width:36,height:3,background:`linear-gradient(90deg,${s.accent},${s.acc2})`,marginTop:11,borderRadius:2}}/>
      </div>
      {watermark&&<div style={{padding:"0 18px 7px",fontSize:10,color:s.dark?"rgba(255,255,255,.22)":"rgba(0,0,0,.25)",letterSpacing:".3px"}}>{watermark}</div>}
      {/* Ad */}
      {adConfig?.id==="image"&&adBannerUrl?(
        <div style={{flexShrink:0,height:adBannerH,borderTop:`1px solid ${s.accent}22`,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <img src={adBannerUrl} alt="ad" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
        </div>
      ):adConfig?.id!=="none"&&adConfig?.id!=="image"?(
        <div style={{flexShrink:0,background:s.dark?"rgba(0,0,0,.35)":"rgba(0,0,0,.04)",borderTop:`1px solid ${s.accent}22`,padding:"8px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div style={{fontSize:11,color:s.dark?"rgba(255,255,255,.65)":s.accent,flex:1}}>{adConfig.text}</div>
          <div style={{fontSize:10,fontWeight:700,color:s.acc2,border:`1.5px solid ${s.acc2}`,padding:"3px 10px",whiteSpace:"nowrap",letterSpacing:cl.tagSpacing,textTransform:cl.tagTransform,fontFamily:cl.tagFont,flexShrink:0}}>{adConfig.cta}</div>
        </div>
      ):null}
      <div style={{height:3,background:`linear-gradient(90deg,${s.acc2},${s.accent})`,flexShrink:0}}/>
      {/* Shape layers */}
      {shapes.length>0&&<StaticLayer shapes={shapes} cardH={innerRef.current?.offsetHeight||600}/>}
      {!isExporting&&designActive&&(
        <DesignCanvas shapes={shapes} selectedIdx={selectedIdx} activeTool={activeTool}
          fillColor={fillColor} fillNone={fillNone} strokeColor={strokeColor} strokeNone={strokeNone}
          strokeWidth={strokeWidth} shapeOpacity={shapeOpacity} cornerRadius={cornerRadius}
          textProps={textProps} imgOverSrc={imgOverSrc}
          onAdd={onShapeAdd} onUpdate={onShapeUpdate} onSelect={onShapeSelect} onDblClick={onDblClickShape}
          cardH={innerRef.current?.offsetHeight||600}
        />
      )}
    </div>
  );
}

/* ─── LANG TOGGLE ─── */
function LangToggle({cardLangKey,onToggle}){
  const isBn=cardLangKey==="bn";
  return(<button onClick={onToggle} style={{display:"flex",alignItems:"center",gap:7,background:isBn?"rgba(76,175,80,.15)":"rgba(255,255,255,.08)",border:`1.5px solid ${isBn?C.primary:"rgba(255,255,255,.2)"}`,borderRadius:20,padding:"5px 12px",cursor:"pointer",transition:"all .2s"}}>
    <span style={{fontSize:11,fontWeight:700,color:isBn?"rgba(255,255,255,.35)":"#fff"}}>EN</span>
    <div style={{width:34,height:17,borderRadius:9,background:isBn?"#4caf50":"rgba(255,255,255,.2)",position:"relative",flexShrink:0}}>
      <div style={{position:"absolute",top:2,left:isBn?16:2,width:13,height:13,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.4)"}}/>
    </div>
    <span style={{fontSize:12,fontWeight:700,fontFamily:"'Noto Serif Bengali',serif",color:isBn?"#fff":"rgba(255,255,255,.35)"}}>বাং</span>
  </button>);
}

/* ─── LAYERS PANEL ─── */
function LayersPanel({shapes,selectedIdx,onSelect,onDelete,onToggle,onMoveUp,onMoveDown,onClearAll,onEpsExport,onOpenProject}){
  return(
    <div style={{width:216,background:C.panel,borderLeft:`1px solid ${C.panelBorder}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{background:`linear-gradient(160deg,#0d1b0d,#1b3a1b)`,padding:"10px 12px",flexShrink:0,borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><MI n="layers" sz={15} col={C.accent}/><span style={{fontSize:11,fontWeight:700,color:C.accent,letterSpacing:"1px",textTransform:"uppercase"}}>Layers</span></div>
          <span style={{fontSize:10,background:`${C.primary}22`,color:C.primary,padding:"1px 7px",borderRadius:10,fontWeight:700}}>{shapes.length}</span>
        </div>
        <button onClick={onOpenProject} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:"rgba(255,255,255,.07)",border:`1px solid rgba(255,255,255,.15)`,color:"#fff",borderRadius:5,padding:"6px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"'Roboto',sans-serif",marginBottom:5}}>
          <MI n="folder_open" sz={14} col="#fff"/>Open Project (.eps)
        </button>
        <button onClick={onEpsExport} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:`${C.purple}33`,border:`1px solid ${C.purpleBorder}`,color:"#ce93d8",borderRadius:5,padding:"6px",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"'Roboto',sans-serif"}}>
          <MI n="texture" sz={14} col="#ce93d8"/>Export EPS Vector
        </button>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"6px 0"}}>
        {shapes.length===0&&<div style={{padding:"20px 12px",textAlign:"center",color:C.textMuted,fontSize:11,lineHeight:1.6}}>No layers yet.<br/>Use Design tools to draw.</div>}
        {[...shapes].reverse().map((sh,ri)=>{const i=shapes.length-1-ri;const sel=selectedIdx===i;return(
          <div key={sh.id} className={`layer-row${sel?" sel":""}`} onClick={()=>onSelect(i)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 8px",cursor:"pointer",borderLeft:`3px solid ${sel?C.primary:"transparent"}`,transition:"all .1s"}}>
            <div style={{width:13,height:13,borderRadius:2,background:sh.fill==='none'?'transparent':(sh.fill||sh.textColor||'#888'),border:`2px solid ${sh.stroke==='none'?'#444':(sh.stroke||'#444')}`,flexShrink:0}}/>
            <MI n={TYPE_ICON[sh.type]||"layers"} sz={12} col={sel?C.primary:C.textMuted}/>
            <span style={{fontSize:10,flex:1,color:sel?C.primary:C.textSec,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",fontWeight:sel?700:400}}>{sh.name}</span>
            <button onClick={e=>{e.stopPropagation();onToggle(i);}} style={{background:"none",border:"none",cursor:"pointer",padding:1,display:"flex",flexShrink:0}} title={sh.visible?"Hide":"Show"}>
              <MI n={sh.visible?"visibility":"visibility_off"} sz={12} col={sh.visible?C.primary:C.textMuted}/>
            </button>
            <button onClick={e=>{e.stopPropagation();onDelete(i);}} style={{background:"none",border:"none",cursor:"pointer",padding:1,display:"flex",flexShrink:0}}>
              <MI n="delete_outline" sz={12} col={C.red}/>
            </button>
          </div>
        );})}
      </div>
      {selectedIdx!=null&&shapes.length>1&&(
        <div style={{padding:"6px 8px",borderTop:`1px solid ${C.div}`,display:"flex",gap:4,flexShrink:0}}>
          <button onClick={()=>onMoveUp(selectedIdx)} disabled={selectedIdx>=shapes.length-1} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:3,padding:"4px",border:`1px solid ${C.border}`,borderRadius:3,cursor:"pointer",background:"#111a11",fontSize:10,color:C.textSec,fontFamily:"'Roboto',sans-serif",opacity:selectedIdx>=shapes.length-1?.4:1}}>
            <MI n="arrow_upward" sz={11} col={C.primary}/>Up
          </button>
          <button onClick={()=>onMoveDown(selectedIdx)} disabled={selectedIdx<=0} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:3,padding:"4px",border:`1px solid ${C.border}`,borderRadius:3,cursor:"pointer",background:"#111a11",fontSize:10,color:C.textSec,fontFamily:"'Roboto',sans-serif",opacity:selectedIdx<=0?.4:1}}>
            <MI n="arrow_downward" sz={11} col={C.primary}/>Down
          </button>
        </div>
      )}
      {shapes.length>0&&<div style={{padding:"5px 8px",borderTop:`1px solid ${C.div}`,flexShrink:0}}>
        <button onClick={onClearAll} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"5px",border:`1px solid ${C.red}44`,borderRadius:4,background:C.redBg,color:C.red,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
          <MI n="delete_sweep" sz={12} col={C.red}/>Clear All
        </button>
      </div>}
    </div>
  );
}

/* ─── APP ROOT ─── */
function App(){
  const [cardLangKey,setCardLangKey]=useState("en");
  const cl=CARD_LANG[cardLangKey];
  const [templates,setTemplates]=useState(DEFAULT_TEMPLATES);
  const [template,setTemplate]=useState(DEFAULT_TEMPLATES[0]);
  const [headline,setHeadline]=useState(CARD_LANG.en.defHeadline);
  const [subtext,setSubtext]=useState(CARD_LANG.en.defSubtext);
  const [tag,setTag]=useState(CARD_LANG.en.defTag);
  const [logoText,setLogoText]=useState(CARD_LANG.en.defLogoText);
  const [logoUrl,setLogoUrl]=useState("");
  const [imageUrl,setImageUrl]=useState("");
  const [imgNatW,setImgNatW]=useState(0);
  const [imgNatH,setImgNatH]=useState(0);
  const [imgZoom,setImgZoom]=useState(100);
  const [imgX,setImgX]=useState(0);
  const [imgY,setImgY]=useState(0);
  const [watermark,setWatermark]=useState(CARD_LANG.en.defWatermark);
  const [selectedAd,setSelectedAd]=useState(ADS[1]);
  const [customTxt,setCustomTxt]=useState("");
  const [customCta,setCustomCta]=useState("");
  const [adBannerUrl,setAdBannerUrl]=useState("");
  const [adBannerH,setAdBannerH]=useState(50);
  const [activeTab,setActiveTab]=useState("content");
  const [exporting,setExporting]=useState(false);
  const [isExporting,setIsExporting]=useState(false);
  const [toast,setToast]=useState(null);
  const [zoomUI,setZoomUI]=useState(1);
  const [showBuilder,setShowBuilder]=useState(false);
  const [editingTpl,setEditingTpl]=useState(null);
  const [cardH,setCardH]=useState(600);
  const [shapes,setShapes]=useState([]);
  const [selectedIdx,setSelectedIdx]=useState(null);
  const [activeTool,setActiveTool]=useState("select");
  const [fillColor,setFillColor]=useState("#e53935");
  const [fillNone,setFillNone]=useState(false);
  const [strokeColor,setStrokeColor]=useState("#ffffff");
  const [strokeNone,setStrokeNone]=useState(false);
  const [strokeWidth,setStrokeWidth]=useState(2);
  const [shapeOpacity,setShapeOpacity]=useState(100);
  const [cornerRadius,setCornerRadius]=useState(0);
  const [tbText,setTbText]=useState("Your text here");
  const [tbFontSize,setTbFontSize]=useState(20);
  const [tbColor,setTbColor]=useState("#ffffff");
  const [tbBold,setTbBold]=useState(false);
  const [tbItalic,setTbItalic]=useState(false);
  const [tbFont,setTbFont]=useState("'Roboto',sans-serif");
  const [imgOverSrc,setImgOverSrc]=useState(null);
  const [editingShapeIdx,setEditingShapeIdx]=useState(null);
  const [showSettings,setShowSettings]=useState(false);
  const [showSearch,setShowSearch]=useState(false);
  const [showGemini,setShowGemini]=useState(false);
  const [settings,setSettings]=useState({geminiKey:'',geminiModel:'gemini-2.0-flash-exp',searchKey:'',searchCx:'',defaultLang:'en',defaultZoom:1,autoSave:false});

  const cardRef=useRef(null);
  const imageRef=useRef(null);
  const logoRef=useRef(null);
  const adBannerRef=useRef(null);
  const epsRef=useRef(null);
  const imgOverRef=useRef(null);
  const dragRef=useRef(null);
  const cardWrapRef=useRef(null);

  const adConfig=selectedAd.id==="none"?{id:"none"}:selectedAd.id==="custom"?{id:"custom",text:customTxt,cta:customCta}:selectedAd;
  const designActive=activeTab==='design';
  const textProps={text:tbText,fontSize:tbFontSize,textColor:tbColor,bold:tbBold,italic:tbItalic,fontFamily:tbFont};
  const selSh=selectedIdx!=null?shapes[selectedIdx]:null;
  const ratioLabel=imgNatW&&imgNatH?(()=>{const g=(a,b)=>b===0?a:g(b,a%b);const d=g(imgNatW,imgNatH);return`${imgNatW/d}:${imgNatH/d}`;})():null;

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  // Load persistent settings
  useEffect(()=>{
    const load=async()=>{
      try{const r=await window.storage?.get('pcs_v16_settings');if(r?.value){const s=JSON.parse(r.value);setSettings(s);if(s.defaultZoom)setZoomUI(s.defaultZoom);if(s.defaultLang&&s.defaultLang!=='en'){const next=s.defaultLang;const ncl=CARD_LANG[next];setCardLangKey(next);setTag(ncl.defTag);setHeadline(ncl.defHeadline);setSubtext(ncl.defSubtext);setWatermark(ncl.defWatermark);setLogoText(ncl.defLogoText);}}}catch{}
    };load();
  },[]);

  const saveSettings=async(s)=>{
    setSettings(s);
    if(s.autoSave){try{await window.storage?.set('pcs_v16_settings',JSON.stringify(s));}catch{}}
    setShowSettings(false);showToast("Settings saved!");
  };

  const handleImageFile=useCallback((file)=>{
    if(!file)return;
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{setImgNatW(img.naturalWidth);setImgNatH(img.naturalHeight);setImageUrl(e.target.result);setImgZoom(100);setImgX(0);setImgY(0);};
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  },[]);

  const handleImgDragStart=useCallback((e)=>{
    e.preventDefault();
    dragRef.current={sx:e.clientX,sy:e.clientY,ox:imgX,oy:imgY};
    const mm=(ev)=>{if(!dragRef.current)return;setImgX(Math.round(dragRef.current.ox+(ev.clientX-dragRef.current.sx)/zoomUI));setImgY(Math.round(dragRef.current.oy+(ev.clientY-dragRef.current.sy)/zoomUI));};
    const mu=()=>{dragRef.current=null;window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);};
    window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu);
  },[imgX,imgY,zoomUI]);

  const handleLangToggle=()=>{
    const next=cardLangKey==="en"?"bn":"en";const ncl=CARD_LANG[next];
    setCardLangKey(next);setTag(ncl.defTag);setHeadline(ncl.defHeadline);setSubtext(ncl.defSubtext);setWatermark(ncl.defWatermark);setLogoText(ncl.defLogoText);
  };

  const handleSaveTpl=(tpl)=>{
    setTemplates(p=>{const e=p.find(t=>t.id===tpl.id);return e?p.map(t=>t.id===tpl.id?tpl:t):[...p,tpl];});
    setTemplate(tpl);setShowBuilder(false);setEditingTpl(null);showToast(`Template "${tpl.name}" saved!`);
  };

  const handleExport=useCallback(async()=>{
    setExporting(true);setIsExporting(true);
    await new Promise(r=>setTimeout(r,80));
    try{
      const h2c=require("html2canvas");
      const canvas=await h2c(cardRef.current,{scale:2,useCORS:true,allowTaint:true,backgroundColor:null,logging:false});
      const a=document.createElement("a");a.download=`photocard-${template.id}-${Date.now()}.png`;const dUrl=canvas.toDataURL("image/png");
      const dn=`photocard-${template.id}-${Date.now()}.png`;
      if(window.electronAPI)await window.electronAPI.savePng(dUrl,dn);
      else{const a=document.createElement("a");a.download=dn;a.href=dUrl;a.click();}
      showToast("Card exported as PNG!");
    }catch(e){console.error(e);showToast("Export failed: "+e.message,"error");}
    setIsExporting(false);setExporting(false);
  },[template]);

  const handleEpsExport=useCallback(()=>{
    try{
      const eps=generateEPS({shapes,headline,subtext,tag,watermark,logoText,template,cardH,cardLang:cl});
      const a=document.createElement("a");a.download=`photocard-${template.id}-${Date.now()}.eps`;
      if(window.electronAPI)await window.electronAPI.saveEps(eps,a.download);
      else{a.href=URL.createObjectURL(new Blob([eps],{type:"application/postscript"}));a.click();}
      showToast("EPS exported!");
    }catch(e){showToast("EPS failed: "+e.message,"error");}
  },[shapes,headline,subtext,tag,watermark,logoText,template,cardH,cl]);

  const handleOpenProject=()=>epsRef.current.click();
  const handleEpsFile=useCallback((e)=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{const parsed=parseEPS(ev.target.result);if(parsed.length){setShapes(parsed);setSelectedIdx(null);setActiveTab("design");showToast(`Loaded ${parsed.length} layer${parsed.length>1?"s":""}`);}else showToast("No shapes found in EPS","error");};
    reader.readAsText(file);e.target.value="";
  },[]);

  const handleImgOverFile=useCallback((file)=>{
    if(!file)return;
    const reader=new FileReader();
    reader.onload=e=>{setImgOverSrc(e.target.result);showToast("Image ready — click card to place","info");};
    reader.readAsDataURL(file);
  },[]);

  const handleGeminiResult=(dataUrl,target)=>{
    if(target==='bg'){const img=new Image();img.onload=()=>{setImgNatW(img.naturalWidth);setImgNatH(img.naturalHeight);setImageUrl(dataUrl);setImgZoom(100);setImgX(0);setImgY(0);};img.src=dataUrl;showToast("AI image set as card background!");}
    else{setImgOverSrc(dataUrl);setActiveTool('imgover');setActiveTab('design');showToast("AI image ready — click card to place overlay","info");}
  };

  const moveLayerUp=(i)=>{if(i>=shapes.length-1)return;setShapes(p=>{const a=[...p];[a[i],a[i+1]]=[a[i+1],a[i]];return a;});setSelectedIdx(i+1);};
  const moveLayerDown=(i)=>{if(i<=0)return;setShapes(p=>{const a=[...p];[a[i],a[i-1]]=[a[i-1],a[i]];return a;});setSelectedIdx(i-1);};
  const updSel=(k,v)=>{if(selectedIdx===null)return;setShapes(p=>p.map((s,i)=>i===selectedIdx?{...s,[k]:v}:s));};
  const updSelMulti=(kv)=>{if(selectedIdx===null)return;setShapes(p=>p.map((s,i)=>i===selectedIdx?{...s,...kv}:s));};

  return(<div style={{height:"100vh",background:C.bg,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* AppBar */}
    <div style={{background:`linear-gradient(90deg,#0d1b0d,#1b3a1b)`,height:54,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",borderBottom:`1px solid ${C.panelBorder}`,boxShadow:"0 2px 16px rgba(0,0,0,.5)",zIndex:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <img src="./assets/logo.png" alt="logo" style={{width:34,height:34,borderRadius:8,objectFit:"cover",boxShadow:"0 2px 8px rgba(0,0,0,.4)"}} onError={e=>e.target.style.display='none'}/>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#fff",lineHeight:1.1,fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:".5px"}}>PhotoCard Studio</div>
          <div style={{fontSize:8,color:"rgba(255,255,255,.4)",letterSpacing:"2px",textTransform:"uppercase"}}>News Edition v1.6</div>
        </div>
        <div style={{width:1,height:24,background:C.panelBorder,margin:"0 4px"}}/>
        <div style={{fontSize:10,background:`${C.primary}22`,color:C.primary,padding:"2px 8px",borderRadius:3,fontWeight:700,border:`1px solid ${C.primaryBorder}`}}>{template.name}</div>
        {shapes.length>0&&<div style={{fontSize:10,background:`${C.purple}22`,color:"#ce93d8",padding:"2px 8px",borderRadius:3,fontWeight:700,border:`1px solid ${C.purpleBorder}`,display:"flex",alignItems:"center",gap:3}}><MI n="layers" sz={11} col="#ce93d8"/>{shapes.length}</div>}
        {ratioLabel&&<div style={{fontSize:9,background:"rgba(0,0,0,.3)",color:"rgba(255,255,255,.5)",padding:"2px 7px",borderRadius:3,fontFamily:"monospace"}}>{ratioLabel}</div>}
        {/* AI buttons in AppBar */}
        <button onClick={()=>setShowSearch(true)} style={{display:"flex",alignItems:"center",gap:5,background:C.blueBg,border:`1px solid ${C.blueBorder}`,color:C.blue,padding:"5px 10px",borderRadius:5,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
          <MI n="image_search" sz={14} col={C.blue}/>Search Images
        </button>
        <button onClick={()=>setShowGemini(true)} style={{display:"flex",alignItems:"center",gap:5,background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,color:"#ce93d8",padding:"5px 10px",borderRadius:5,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
          <MI n="auto_awesome" sz={14} col="#ce93d8}"/>AI Generate
        </button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <LangToggle cardLangKey={cardLangKey} onToggle={handleLangToggle}/>
        <div style={{width:1,height:20,background:C.panelBorder}}/>
        {[.7,.85,1,1.15].map(z=>(<button key={z} onClick={()=>setZoomUI(z)} style={{background:zoomUI===z?"rgba(76,175,80,.2)":"transparent",border:`1px solid ${zoomUI===z?C.primary:"rgba(255,255,255,.15)"}`,color:zoomUI===z?C.accent:"rgba(255,255,255,.4)",padding:"3px 6px",borderRadius:3,fontSize:10,cursor:"pointer",fontFamily:"monospace"}}>{Math.round(z*100)}%</button>))}
        <div style={{width:1,height:20,background:C.panelBorder}}/>
        <button onClick={()=>setShowSettings(true)} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,.07)",border:`1px solid rgba(255,255,255,.12)`,color:"rgba(255,255,255,.7)",padding:"6px 10px",borderRadius:5,fontSize:11,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
          <MI n="settings" sz={15} col="rgba(255,255,255,.6)"/>Settings
        </button>
        <button onClick={handleEpsExport} style={{display:"flex",alignItems:"center",gap:5,background:`${C.purple}33`,border:`1px solid ${C.purpleBorder}`,color:"#ce93d8",padding:"6px 11px",borderRadius:5,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
          <MI n="texture" sz={14} col="#ce93d8}"/>EPS
        </button>
        <button onClick={handleExport} disabled={exporting} style={{display:"flex",alignItems:"center",gap:6,background:`linear-gradient(135deg,#b71c1c,#e53935)`,color:"#fff",border:"none",padding:"7px 16px",borderRadius:5,fontSize:13,fontWeight:700,cursor:exporting?"not-allowed":"pointer",fontFamily:"'Roboto',sans-serif",boxShadow:"0 2px 10px rgba(197,57,57,.4)",opacity:exporting?.7:1}}>
          <MI n={exporting?"hourglass_top":"save"} sz={17} col="#fff"/>{exporting?"Saving…":"Save PNG"}
        </button>
      </div>
    </div>

    {/* Body */}
    <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>
      {/* Left Panel */}
      <div style={{width:290,background:C.panel,borderRight:`1px solid ${C.panelBorder}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        {/* Tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          {TABS.map(tab=>(<button key={tab.id} className={`btn-tab${activeTab===tab.id?" active-tab":""}`} onClick={()=>setActiveTab(tab.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 2px 6px",background:"transparent",border:"none",borderBottom:activeTab===tab.id?`2px solid ${tab.id==='design'?C.purple:C.primary}`:"2px solid transparent",marginBottom:-1,color:activeTab===tab.id?(tab.id==='design'?C.purple:C.primary):C.textMuted,cursor:"pointer",fontFamily:"'Roboto',sans-serif",transition:"color .15s"}}>
            <MI n={tab.icon} sz={15} col={activeTab===tab.id?(tab.id==='design'?C.purple:C.primary):C.textMuted}/>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:".8px",textTransform:"uppercase"}}>{tab.label}</span>
          </button>))}
        </div>
        <div style={{flex:1,overflow:"auto",padding:13,display:"flex",flexDirection:"column",gap:11}}>

          {/* CONTENT */}
          {activeTab==="content"&&<>
            <SHead icon="edit_note" label="Card Content"/>
            {cardLangKey==='bn'&&<div style={{padding:"6px 9px",background:C.primaryBg,border:`1px solid ${C.primaryBorder}`,borderRadius:4,fontSize:10,color:C.primary,fontFamily:"'Noto Serif Bengali',serif"}}>বাংলা কার্ড মোড সক্রিয়</div>}
            <Fld label="News Tag"  value={tag}       onChange={setTag}       placeholder="BREAKING NEWS"/>
            <Fld label="Headline"  value={headline}  onChange={setHeadline}  multi rows={3} placeholder="Your headline…"/>
            <Fld label="Summary"   value={subtext}   onChange={setSubtext}   multi rows={3} placeholder="Short description…"/>
            <Fld label="Watermark" value={watermark} onChange={setWatermark} placeholder="yoursite.com"/>
          </>}

          {/* STYLE */}
          {activeTab==="template"&&<>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
              <SHead icon="palette" label="Card Style"/>
              <button onClick={()=>{setEditingTpl(null);setShowBuilder(true);}} style={{display:"flex",alignItems:"center",gap:3,background:C.primaryDk,border:"none",color:"#fff",padding:"4px 9px",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Roboto',sans-serif",marginTop:-10}}>
                <MI n="add" sz={12} col="#fff"/>New
              </button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {templates.map(tpl=>(<div key={tpl.id} style={{display:"flex",alignItems:"center"}}>
                <div className="card-tpl" onClick={()=>setTemplate(tpl)} style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"8px 10px",border:`1.5px solid ${template.id===tpl.id?C.primary:C.border}`,borderRadius:tpl.custom?"5px 0 0 5px":"5px",cursor:"pointer",background:template.id===tpl.id?"#1a2e1a":"#111a11",transition:"all .15s"}}>
                  <div style={{width:28,height:28,borderRadius:3,background:tpl.style.bg,border:`2.5px solid ${tpl.style.accent}`,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:template.id===tpl.id?C.primary:C.text}}>{tpl.name}</div>
                    <div style={{fontSize:9,color:C.textMuted}}>{tpl.sub}</div>
                  </div>
                  <MI n={template.id===tpl.id?"radio_button_checked":"radio_button_unchecked"} sz={14} col={template.id===tpl.id?C.primary:C.border}/>
                </div>
                {tpl.custom&&<div style={{display:"flex",flexDirection:"column"}}>
                  <button onClick={()=>{setEditingTpl(tpl);setShowBuilder(true);}} style={{background:"#1a2e1a",border:`1.5px solid ${C.border}`,borderLeft:"none",borderBottom:`.75px solid ${C.border}`,borderRadius:"0 3px 0 0",padding:"0 6px",height:24,cursor:"pointer",display:"flex",alignItems:"center"}}><MI n="edit" sz={11} col={C.primary}/></button>
                  <button onClick={()=>{setTemplates(p=>p.filter(t=>t.id!==tpl.id));if(template.id===tpl.id)setTemplate(DEFAULT_TEMPLATES[0]);}} style={{background:"#2a1a1a",border:`1.5px solid ${C.red}44`,borderLeft:"none",borderTop:`.75px solid ${C.red}44`,borderRadius:"0 0 3px 0",padding:"0 6px",height:24,cursor:"pointer",display:"flex",alignItems:"center"}}><MI n="delete_outline" sz={11} col={C.red}/></button>
                </div>}
              </div>))}
            </div>
            <Divider/>
            <SHead icon="translate" label="Card Language"/>
            <LangToggle cardLangKey={cardLangKey} onToggle={handleLangToggle}/>
          </>}

          {/* MEDIA */}
          {activeTab==="media"&&<>
            <SHead icon="image" label="News Image"/>
            <div style={{display:"flex",gap:7,marginBottom:3}}>
              <button onClick={()=>setShowSearch(true)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:C.blueBg,border:`1px solid ${C.blueBorder}`,borderRadius:5,padding:"7px",color:C.blue,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
                <MI n="image_search" sz={13} col={C.blue}/>Google Search
              </button>
              <button onClick={()=>setShowGemini(true)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,borderRadius:5,padding:"7px",color:"#ce93d8",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Roboto',sans-serif"}}>
                <MI n="auto_awesome" sz={13} col="#ce93d8}"/>AI Generate
              </button>
            </div>
            <input type="file" accept="image/*" ref={imageRef} onChange={e=>handleImageFile(e.target.files[0])} style={{display:"none"}}/>
            <UpBtn onClick={()=>imageRef.current.click()} icon="upload_file" label="Upload from Device"/>
            {imageUrl&&(<>
              <div style={{position:"relative",borderRadius:4,overflow:"hidden",border:`1px solid ${C.border}`}}>
                <img src={imageUrl} alt="" style={{width:"100%",height:"auto",display:"block"}}/>
                <div style={{position:"absolute",top:3,right:3,background:"#111a11",border:`1px solid ${C.primary}`,borderRadius:3,padding:"1px 5px",fontSize:9,fontWeight:700,color:C.accent,fontFamily:"monospace"}}>{imgNatW}×{imgNatH}</div>
                <button onClick={()=>{setImageUrl("");setImgNatW(0);setImgNatH(0);}} style={{position:"absolute",top:3,left:3,background:C.red,border:"none",color:"#fff",width:20,height:20,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><MI n="close" sz={12} col="#fff"/></button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,background:"#111a11",border:`1px solid ${C.border}`,borderRadius:6,padding:10}}>
                <Sldr label="Zoom"  value={imgZoom} onChange={setImgZoom} min={100} max={300} unit="%"/>
                <Sldr label="Pan X" value={imgX}    onChange={setImgX}    min={-200} max={200} unit="px"/>
                <Sldr label="Pan Y" value={imgY}    onChange={setImgY}    min={-200} max={200} unit="px"/>
                <button onClick={()=>{setImgZoom(100);setImgX(0);setImgY(0);}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:`1px solid ${C.border}`,color:C.textSec,padding:"4px",borderRadius:3,cursor:"pointer",fontSize:10,fontFamily:"'Roboto',sans-serif"}}><MI n="refresh" sz={12} col={C.textSec}/>Reset</button>
              </div>
            </>)}
            <Divider/>
            <SHead icon="business" label="Media Logo"/>
            <Fld label="Logo Text" value={logoText} onChange={setLogoText} placeholder="YOUR MEDIA"/>
            <input type="file" accept="image/*" ref={logoRef} onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setLogoUrl(ev.target.result);r.readAsDataURL(f);}}} style={{display:"none"}}/>
            <UpBtn onClick={()=>logoRef.current.click()} icon="add_photo_alternate" label="Upload Logo"/>
            {logoUrl&&<div style={{display:"flex",alignItems:"center",gap:8}}><img src={logoUrl} alt="logo" style={{height:26,background:"#111a11",padding:3,borderRadius:3,border:`1px solid ${C.border}`}}/><button onClick={()=>setLogoUrl("")} style={{display:"flex",alignItems:"center",gap:3,background:C.redBg,border:`1px solid ${C.red}33`,color:C.red,padding:"3px 7px",borderRadius:3,cursor:"pointer",fontSize:10,fontFamily:"'Roboto',sans-serif"}}><MI n="delete" sz={11} col={C.red}/>Remove</button></div>}
          </>}

          {/* DESIGN */}
          {activeTab==="design"&&<>
            <SHead icon="architecture" label="Design Tools" col={C.purple}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
              {TOOLS.map(tool=>(<button key={tool.id} className={`dtool${activeTool===tool.id?" active-tool":""}`} onClick={()=>setActiveTool(tool.id)} title={tool.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"7px 2px",border:`1.5px solid ${activeTool===tool.id?C.primary:C.border}`,borderRadius:4,cursor:"pointer",background:activeTool===tool.id?"#1b5e20":"#111a11",transition:"all .15s",fontFamily:"'Roboto',sans-serif"}}>
                <MI n={tool.icon} sz={15} col={activeTool===tool.id?"#fff":C.textSec}/>
                <span style={{fontSize:7,fontWeight:700,letterSpacing:".2px",textTransform:"uppercase",color:activeTool===tool.id?"#fff":C.textMuted}}>{tool.label.split(' ')[0]}</span>
              </button>))}
            </div>

            {/* Tool hints */}
            {activeTool==='pen'&&<div style={{padding:"6px 8px",background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,borderRadius:4,fontSize:10,color:C.purple,lineHeight:1.5}}>Click points · <b>Dbl-click</b> finish · <b>Esc</b> cancel</div>}
            {activeTool==='textbox'&&<div style={{padding:"6px 8px",background:C.blueBg,border:`1px solid ${C.blueBorder}`,borderRadius:4,fontSize:10,color:C.blue,lineHeight:1.5}}>Click on card to place text box. Dbl-click to edit text in place.</div>}
            {activeTool==='imgover'&&<div style={{padding:"6px 8px",background:"#1a2a1a",border:`1px solid ${C.primaryBorder}`,borderRadius:4,fontSize:10,color:C.primary,lineHeight:1.5}}>Upload an image below, then click card to place as overlay layer.</div>}

            {/* Image Overlay Upload */}
            {activeTool==='imgover'&&<>
              <input type="file" accept="image/*" ref={imgOverRef} onChange={e=>handleImgOverFile(e.target.files[0])} style={{display:"none"}}/>
              <UpBtn onClick={()=>imgOverRef.current.click()} icon="add_photo_alternate" label="Upload Overlay Image"/>
              {imgOverSrc&&<div style={{position:"relative",borderRadius:4,overflow:"hidden",border:`2px solid ${C.primary}`,background:"#111a11",padding:4,display:"flex",alignItems:"center",gap:8}}>
                <img src={imgOverSrc} alt="overlay" style={{width:44,height:44,objectFit:"cover",borderRadius:3,flexShrink:0}}/>
                <div style={{fontSize:10,color:C.primary,fontWeight:600}}>Ready to place — click card!</div>
                <button onClick={()=>setImgOverSrc(null)} style={{position:"absolute",top:3,right:3,background:C.red,border:"none",color:"#fff",width:16,height:16,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><MI n="close" sz={10} col="#fff"/></button>
              </div>}
            </>}

            {/* Text Box controls */}
            {(activeTool==='textbox'||(selSh&&selSh.type==='textbox'))&&<>
              <Divider/>
              <SHead icon="text_fields" label="Text Box" col={C.blue}/>
              <div style={{background:"#0a1020",border:`1px solid ${C.blueBorder}`,borderRadius:6,padding:9,display:"flex",flexDirection:"column",gap:7}}>
                <Fld label="Content" value={activeTool==='textbox'?tbText:(selSh?.text||'')} onChange={activeTool==='textbox'?setTbText:v=>updSel('text',v)} multi rows={2}/>
                <div style={{display:"flex",gap:7}}>
                  <div style={{flex:1}}>
                    <label style={{display:"block",fontSize:9,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>Font Size</label>
                    <input type="number" min={8} max={120} value={activeTool==='textbox'?tbFontSize:(selSh?.fontSize||20)} onChange={e=>activeTool==='textbox'?setTbFontSize(Number(e.target.value)):updSel('fontSize',Number(e.target.value))} style={{width:"100%",background:"#111a11",border:`1px solid ${C.border}`,borderRadius:4,padding:"5px 7px",fontSize:12,color:C.text}}/>
                  </div>
                  <div style={{flex:1}}>
                    <label style={{display:"block",fontSize:9,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>Color</label>
                    <input type="color" value={activeTool==='textbox'?tbColor:(selSh?.textColor||'#ffffff')} onChange={e=>activeTool==='textbox'?setTbColor(e.target.value):updSel('textColor',e.target.value)} style={{width:"100%",height:29,border:`1px solid ${C.border}`,borderRadius:4,cursor:"pointer",background:"#111a11",padding:2}}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:5}}>
                  {[{k:'bold',l:'B',st:{fontWeight:700}},{k:'italic',l:'I',st:{fontStyle:'italic'}}].map(({k,l,st})=>{
                    const v=activeTool==='textbox'?(k==='bold'?tbBold:tbItalic):(selSh?.[k]||false);
                    const tgl=()=>activeTool==='textbox'?(k==='bold'?setTbBold(x=>!x):setTbItalic(x=>!x)):updSel(k,!v);
                    return<button key={k} onClick={tgl} style={{flex:1,padding:"5px",border:`1.5px solid ${v?C.blue:C.border}`,borderRadius:4,background:v?C.blueBg:"#111a11",cursor:"pointer",fontSize:13,color:v?C.blue:C.textSec,...st,fontFamily:"'Roboto',sans-serif"}}>{l}</button>;
                  })}
                  <select value={activeTool==='textbox'?tbFont:(selSh?.fontFamily||"'Roboto',sans-serif")} onChange={e=>activeTool==='textbox'?setTbFont(e.target.value):updSel('fontFamily',e.target.value)} style={{flex:3,border:`1px solid ${C.border}`,borderRadius:4,padding:"4px 5px",fontSize:10,background:"#111a11",color:C.text}}>
                    <option value="'Roboto',sans-serif">Roboto</option>
                    <option value="'Playfair Display',Georgia,serif">Playfair Display</option>
                    <option value="'Roboto Condensed',sans-serif">Roboto Condensed</option>
                    <option value="'Noto Serif Bengali',serif">Noto Serif Bengali</option>
                    <option value="Georgia,serif">Georgia</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
              </div>
            </>}

            {/* Image overlay controls if selected */}
            {selSh&&selSh.type==='imgover'&&<>
              <Divider/>
              <SHead icon="add_photo_alternate" label="Image Overlay"/>
              <div style={{background:"#0a1a0a",border:`1px solid ${C.primaryBorder}`,borderRadius:6,padding:9,display:"flex",flexDirection:"column",gap:7}}>
                <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>updSel('src',ev.target.result);r.readAsDataURL(f);}} style={{display:"none"}} id="sel-img-over"/>
                <label htmlFor="sel-img-over" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:"#111a11",border:`1.5px dashed ${C.border}`,borderRadius:5,padding:"8px",color:C.textSec,fontSize:11,fontWeight:500,cursor:"pointer"}}>
                  <MI n="upload" sz={14} col={C.textMuted}/>Replace Image
                </label>
                <Sldr label="Opacity" value={selSh.opacity||100} onChange={v=>updSel('opacity',v)} min={10} max={100} unit="%"/>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <input type="checkbox" id="pAR" checked={!!selSh.preserveAR} onChange={e=>updSel('preserveAR',e.target.checked)} style={{accentColor:C.primary}}/>
                  <label htmlFor="pAR" style={{fontSize:11,color:C.textSec,cursor:"pointer"}}>Preserve aspect ratio</label>
                </div>
                <div style={{display:"flex",gap:7}}>
                  <div style={{flex:1}}><label style={{fontSize:9,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:".4px",display:"block",marginBottom:3}}>W (px)</label><input type="number" min={10} max={540} value={selSh.w||100} onChange={e=>updSel('w',Number(e.target.value))} style={{width:"100%",background:"#111a11",border:`1px solid ${C.border}`,borderRadius:4,padding:"5px",fontSize:11,color:C.text}}/></div>
                  <div style={{flex:1}}><label style={{fontSize:9,fontWeight:700,color:C.textSec,textTransform:"uppercase",letterSpacing:".4px",display:"block",marginBottom:3}}>H (px)</label><input type="number" min={10} max={900} value={selSh.h||100} onChange={e=>updSel('h',Number(e.target.value))} style={{width:"100%",background:"#111a11",border:`1px solid ${C.border}`,borderRadius:4,padding:"5px",fontSize:11,color:C.text}}/></div>
                </div>
              </div>
            </>}

            <Divider/>
            {/* Shape style */}
            <SHead icon="format_paint" label="Shape Style"/>
            <div style={{display:"flex",flexDirection:"column",gap:7,background:"#111a11",border:`1px solid ${C.border}`,borderRadius:6,padding:9}}>
              {activeTool!=='textbox'&&activeTool!=='imgover'&&<ColRow label="Fill"   value={fillColor}   onChange={setFillColor}   allowNone isNone={fillNone}   onNone={()=>setFillNone(p=>!p)}/>}
              {activeTool!=='imgover'&&<ColRow label="Stroke" value={strokeColor} onChange={setStrokeColor} allowNone isNone={strokeNone} onNone={()=>setStrokeNone(p=>!p)}/>}
              {activeTool!=='textbox'&&activeTool!=='imgover'&&<Sldr label="Stroke W" value={strokeWidth}  onChange={setStrokeWidth}  min={1} max={20} unit="px"/>}
              <Sldr label="Opacity"   value={shapeOpacity} onChange={setShapeOpacity} min={10} max={100} unit="%"/>
              {activeTool==='rect'&&<Sldr label="Corner R" value={cornerRadius} onChange={setCornerRadius} min={0} max={80} unit="px"/>}
            </div>

            {/* Selected shape properties */}
            {selSh&&selSh.type!=='textbox'&&selSh.type!=='imgover'&&<>
              <Divider/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <SHead icon="tune" label="Selected Shape"/>
                <button onClick={()=>{setShapes(p=>p.filter((_,i)=>i!==selectedIdx));setSelectedIdx(null);}} style={{background:C.redBg,border:`1px solid ${C.red}44`,color:C.red,padding:"3px 7px",borderRadius:3,cursor:"pointer",fontSize:10,fontFamily:"'Roboto',sans-serif",display:"flex",alignItems:"center",gap:3,marginTop:-10}}>
                  <MI n="delete" sz={11} col={C.red}/>Del
                </button>
              </div>
              <div style={{background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,borderRadius:6,padding:9,display:"flex",flexDirection:"column",gap:7}}>
                <div style={{fontSize:10,fontWeight:600,color:C.purple,display:"flex",alignItems:"center",gap:4}}><MI n="layers" sz={11} col={C.purple}/>{selSh.type} · {selSh.name}</div>
                <ColRow label="Fill"   value={selSh.fill==='none'?'#000000':(selSh.fill||'#000000')}     onChange={v=>updSel('fill',v)} allowNone isNone={selSh.fill==='none'} onNone={()=>updSel('fill',selSh.fill==='none'?fillColor:'none')}/>
                <ColRow label="Stroke" value={selSh.stroke==='none'?'#000000':(selSh.stroke||'#000000')} onChange={v=>updSel('stroke',v)} allowNone isNone={selSh.stroke==='none'} onNone={()=>updSel('stroke',selSh.stroke==='none'?strokeColor:'none')}/>
                <Sldr label="Stroke W" value={selSh.strokeWidth||2} onChange={v=>updSel('strokeWidth',v)} min={1} max={20} unit="px"/>
                <Sldr label="Opacity"  value={selSh.opacity||100}    onChange={v=>updSel('opacity',v)}    min={10} max={100} unit="%"/>
                {selSh.type==='rect'&&<Sldr label="Corner R" value={selSh.rx||0} onChange={v=>updSel('rx',v)} min={0} max={80} unit="px"/>}
              </div>
            </>}
          </>}

          {/* AD */}
          {activeTab==="ad"&&<>
            <SHead icon="campaign" label="Bottom Ad Banner"/>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {ADS.map(ad=>(<div key={ad.id} className="card-ad" onClick={()=>setSelectedAd(ad)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",border:`1.5px solid ${selectedAd.id===ad.id?C.primary:C.border}`,borderRadius:5,cursor:"pointer",background:selectedAd.id===ad.id?"#1a2e1a":"#111a11",transition:"all .15s"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:selectedAd.id===ad.id?C.primaryDk:C.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><MI n={ad.icon} sz={14} col={selectedAd.id===ad.id?"#fff":C.textMuted}/></div>
                <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:selectedAd.id===ad.id?C.primary:C.text}}>{ad.label}</div>{ad.id==="image"&&<div style={{fontSize:9,color:C.textMuted}}>Dynamic height up to {AD_MAX_H}px</div>}</div>
                <MI n={selectedAd.id===ad.id?"check_circle":"radio_button_unchecked"} sz={13} col={selectedAd.id===ad.id?C.primary:C.border}/>
              </div>))}
            </div>
            {selectedAd.id==="image"&&<div style={{marginTop:6,padding:10,background:"#111a11",borderRadius:5,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
              <input type="file" accept="image/*" ref={adBannerRef} onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setAdBannerUrl(ev.target.result);r.readAsDataURL(f);}}} style={{display:"none"}}/>
              <UpBtn onClick={()=>adBannerRef.current.click()} icon="add_photo_alternate" label="Upload Banner"/>
              <Sldr label={`Banner Height (max ${AD_MAX_H}px)`} value={adBannerH} onChange={setAdBannerH} min={10} max={AD_MAX_H} unit="px"/>
            </div>}
            {selectedAd.id==="custom"&&<div style={{marginTop:6,padding:10,background:"#111a11",borderRadius:5,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
              <Fld label="Ad Text"    value={customTxt} onChange={setCustomTxt} placeholder="Your promotional text…"/>
              <Fld label="CTA Button" value={customCta} onChange={setCustomCta} placeholder="Click Here"/>
            </div>}
          </>}

        </div>
        <div style={{padding:"6px 12px",borderTop:`1px solid ${C.div}`,display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:designActive?C.purple:imageUrl?C.primary:C.textMuted}}/>
          <span style={{fontSize:9,color:C.textMuted}}>{designActive?`${TOOLS.find(t=>t.id===activeTool)?.label} tool`:imageUrl?`${ratioLabel||""} ratio locked`:"Ready"}</span>
          <span style={{marginLeft:"auto",fontSize:9,color:C.textMuted,fontFamily:"monospace"}}>540px wide</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={cardWrapRef} style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px",background:"#0f140f",position:"relative"}}>
        {designActive&&(
          <div style={{position:"sticky",top:0,zIndex:20,display:"flex",alignItems:"center",gap:4,marginBottom:12,background:"rgba(20,30,20,.97)",border:`1px solid ${C.panelBorder}`,borderRadius:22,padding:"4px 10px",boxShadow:"0 4px 16px rgba(0,0,0,.6)"}}>
            {TOOLS.map(tool=>(<button key={tool.id} className={`dtool${activeTool===tool.id?" active-tool":""}`} onClick={()=>setActiveTool(tool.id)} title={tool.label} style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px solid ${activeTool===tool.id?C.primary:C.border}`,borderRadius:4,cursor:"pointer",background:activeTool===tool.id?"#1b5e20":"transparent",transition:"all .15s"}}>
              <MI n={tool.icon} sz={14} col={activeTool===tool.id?"#fff":C.textSec}/>
            </button>))}
            <div style={{width:1,height:18,background:C.div,margin:"0 2px"}}/>
            {activeTool!=='textbox'&&activeTool!=='imgover'&&<div style={{width:18,height:18,borderRadius:3,background:fillNone?"transparent":fillColor,border:`2px solid ${fillNone?C.border:fillColor}`}} title="Fill"/>}
            {activeTool!=='imgover'&&<div style={{width:18,height:18,borderRadius:3,background:"transparent",border:`3px solid ${strokeNone?C.border:strokeColor}`}} title="Stroke"/>}
          </div>
        )}
        <div style={{zIndex:1,transform:`scale(${zoomUI})`,transformOrigin:"top center",transition:"transform .2s"}}>
          <PhotoCard
            template={template} headline={headline} subtext={subtext} tag={tag}
            imageUrl={imageUrl} imgNatW={imgNatW} imgNatH={imgNatH}
            imgZoom={imgZoom} imgX={imgX} imgY={imgY} onImgDragStart={handleImgDragStart}
            logoText={logoText} logoUrl={logoUrl}
            adConfig={adConfig} adBannerUrl={adBannerUrl} adBannerH={adBannerH}
            watermark={watermark} cardRef={cardRef} isExporting={isExporting} cardLang={cl}
            shapes={shapes} designActive={designActive} activeTool={activeTool}
            fillColor={fillColor} fillNone={fillNone} strokeColor={strokeColor} strokeNone={strokeNone}
            strokeWidth={strokeWidth} shapeOpacity={shapeOpacity} cornerRadius={cornerRadius}
            textProps={textProps} imgOverSrc={imgOverSrc}
            selectedIdx={selectedIdx}
            onShapeAdd={sh=>{setShapes(p=>[...p,sh]);setSelectedIdx(shapes.length);}}
            onShapeUpdate={(i,sh)=>setShapes(p=>p.map((s,j)=>j===i?sh:s))}
            onShapeSelect={i=>{setSelectedIdx(i);if(i!=null)setActiveTool('select');}}
            onDblClickShape={i=>{if(i!=null&&shapes[i]?.type==='textbox'){setEditingShapeIdx(i);}}}
            onCardH={setCardH}
          />
        </div>
        <div style={{marginTop:12,zIndex:1,fontSize:9,color:C.textMuted,display:"flex",alignItems:"center",gap:6}}>
          <MI n="info_outline" sz={11} col={C.textMuted}/>540px · exported at 2× (1080px) · EPS vector available · drag resize handles to scale shapes
        </div>
      </div>

      {/* Right Layers Panel */}
      <LayersPanel
        shapes={shapes} selectedIdx={selectedIdx}
        onSelect={i=>{setSelectedIdx(i);setActiveTool('select');setActiveTab('design');}}
        onDelete={i=>{setShapes(p=>p.filter((_,j)=>j!==i));setSelectedIdx(null);}}
        onToggle={i=>setShapes(p=>p.map((s,j)=>j===i?{...s,visible:!s.visible}:s))}
        onMoveUp={moveLayerUp} onMoveDown={moveLayerDown}
        onClearAll={()=>{setShapes([]);setSelectedIdx(null);}}
        onEpsExport={handleEpsExport} onOpenProject={handleOpenProject}
      />
    </div>

    {/* Inline text editor overlay */}
    {editingShapeIdx!=null&&shapes[editingShapeIdx]&&(
      <TextEditOverlay
        sh={shapes[editingShapeIdx]}
        cardScale={zoomUI}
        cardRect={cardRef.current?.getBoundingClientRect()}
        onChange={v=>setShapes(p=>p.map((s,i)=>i===editingShapeIdx?{...s,text:v}:s))}
        onDone={()=>setEditingShapeIdx(null)}
      />
    )}

    {/* Hidden inputs */}
    <input type="file" accept=".eps,.ps" ref={epsRef} onChange={handleEpsFile} style={{display:"none"}}/>

    {/* Modals */}
    {showBuilder&&<TplBuilder onSave={handleSaveTpl} onClose={()=>{setShowBuilder(false);setEditingTpl(null);}} editing={editingTpl}/>}
    {showSettings&&<SettingsModal settings={settings} onSave={saveSettings} onClose={()=>setShowSettings(false)}/>}
    {showSearch&&<ImageSearchModal settings={settings} onSelect={src=>{setImgOverSrc(src);setActiveTool('imgover');setActiveTab('design');showToast("Image loaded — click card to place","info");}} onClose={()=>setShowSearch(false)} showToast={showToast}/>}
    {showGemini&&<GeminiModal settings={settings} onResult={handleGeminiResult} onClose={()=>setShowGemini(false)} showToast={showToast}/>}
    {toast&&<Toast msg={toast.msg} type={toast.type}/>}
  </div>);
}

export default function Root(){
  return(<ErrorBoundary><App/></ErrorBoundary>);
}
