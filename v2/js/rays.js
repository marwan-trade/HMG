/* Fond : grille de lignes fines parcourues par des rayons lumineux */
document.querySelectorAll('canvas.rays').forEach(function(c){
  const x=c.getContext('2d');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W,H,dpr,lines=[],pulses=[];
  const GAP=64;
  function build(){
    dpr=Math.min(devicePixelRatio||1,2);
    W=c.clientWidth;H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);
    lines=[];
    for(let y=GAP/2;y<H;y+=GAP) lines.push({h:1,p:y});
    for(let v=GAP/2;v<W;v+=GAP) lines.push({h:0,p:v});
    pulses=[];const n=Math.round((W*H)/38000);
    for(let i=0;i<n;i++) pulses.push(spawn(true));
  }
  function spawn(rand){
    const l=lines[Math.floor(Math.random()*lines.length)];
    const len=l.h?W:H, size=90+Math.random()*200;
    const gold=Math.random()<.35;
    return {l,len,size,t:rand?Math.random()*(len+size):-size,v:(l.h?1.4:1)*(0.6+Math.random()*1.6)*(Math.random()<.5?1:-1),
      col:gold?'212,168,67':'255,122,40',a:.55+Math.random()*.45};
  }
  function grid(){
    x.lineWidth=1;
    for(const l of lines){
      x.strokeStyle='rgba(148,175,214,0.07)';x.beginPath();
      if(l.h){x.moveTo(0,l.p+.5);x.lineTo(W,l.p+.5)}else{x.moveTo(l.p+.5,0);x.lineTo(l.p+.5,H)}
      x.stroke();
    }
    // points d'intersection
    x.fillStyle='rgba(148,175,214,0.16)';
    for(let y=GAP/2;y<H;y+=GAP)for(let v=GAP/2;v<W;v+=GAP){x.fillRect(v-1,y-1,2,2)}
  }
  function draw(){
    x.clearRect(0,0,W,H);grid();
    x.globalCompositeOperation='lighter';
    for(const p of pulses){
      p.t+=Math.abs(p.v); const dir=Math.sign(p.v);
      const head=dir>0?p.t:p.len-p.t, tail=head-dir*p.size;
      let g;
      if(p.l.h) g=x.createLinearGradient(tail,0,head,0); else g=x.createLinearGradient(0,tail,0,head);
      g.addColorStop(0,`rgba(${p.col},0)`);g.addColorStop(.85,`rgba(${p.col},${p.a*.6})`);g.addColorStop(1,`rgba(255,240,220,${p.a})`);
      x.strokeStyle=g;x.lineWidth=1.6;x.shadowColor=`rgba(${p.col},.9)`;x.shadowBlur=10;
      x.beginPath();
      if(p.l.h){x.moveTo(tail,p.l.p+.5);x.lineTo(head,p.l.p+.5)}else{x.moveTo(p.l.p+.5,tail);x.lineTo(p.l.p+.5,head)}
      x.stroke();
      // tête lumineuse
      x.fillStyle=`rgba(255,236,210,${p.a})`;x.beginPath();
      if(p.l.h)x.arc(head,p.l.p+.5,1.8,0,7);else x.arc(p.l.p+.5,head,1.8,0,7);x.fill();
      x.shadowBlur=0;
      if(p.t>p.len+p.size) Object.assign(p,spawn(false));
    }
    x.globalCompositeOperation='source-over';
    // fondu vers la gauche pour garder le texte lisible
    const f=x.createLinearGradient(0,0,W,0);f.addColorStop(0,'rgba(6,14,28,.75)');f.addColorStop(.55,'rgba(6,14,28,.15)');f.addColorStop(1,'rgba(6,14,28,0)');
    x.fillStyle=f;x.fillRect(0,0,W,H);
    if(!reduce) requestAnimationFrame(draw);
  }
  build();addEventListener('resize',build);draw();
});
