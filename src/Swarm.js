import * as THREE from 'three';

// Persistent GPU blocks, two rasterized destinations, no text crossfade.
export function createSwarm(renderer,time,onReady,{cycle=false,lighting=false,compact=false,labels}={}){
 const phrases=labels||['Gregory Horn','Exomorphic-Particle Codex'];
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,1,0,1,-10,10);
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 let width=innerWidth,height=innerHeight,mesh,geometry,material,disposed=false,ready=false,start=0,phase='loading',word=phrases[0],count=0,solidity=0;
 const solidMeshes=[];let bounds=[],carry=0,carryGoal=0,armed=false,previousTime=time.value;
 const pointer=new THREE.Vector2(-1000,-1000),home=new THREE.Vector2();
 const nearWord=(x,y)=>{const r=bounds[phrases.indexOf(word)]||bounds[0];if(!r)return Infinity;return Math.hypot(Math.max(r.left-x,0,x-r.left-r.width),Math.max(r.top-y,0,y-r.top-r.height));};
 const move=e=>{if(preference.matches)return;pointer.set(e.clientX,e.clientY);const distance=nearWord(e.clientX,e.clientY);if(distance<45)armed=true;if(armed)carryGoal=distance>95?1:0;};
 const release=e=>{if(!e||e.pointerType!=='mouse'){carryGoal=0;armed=false;}};
 const leave=()=>{carryGoal=0;armed=false;};const key=e=>{if(e.key==='Escape')leave();};
 window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerdown',move,{passive:true});window.addEventListener('pointerup',release,{passive:true});document.documentElement.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);window.addEventListener('keydown',key);
 const font=new FontFace('SwarmManrope',`url(${new URL('../public/manrope.woff2',import.meta.url).href})`,{weight:'200 800'});
 const targets=text=>{
  const canvas=document.createElement('canvas');canvas.height=130;const ctx=canvas.getContext('2d');ctx.font='650 92px SwarmManrope';canvas.width=Math.ceil(ctx.measureText(text).width)+8;ctx.font='650 92px SwarmManrope';ctx.textBaseline='top';ctx.fillStyle='#fff';ctx.fillText(text,2,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,points=[];
  const textWidth=ctx.measureText(text).width;
  for(let y=0;y<120;y+=2)for(let x=0;x<Math.ceil(textWidth)+4;x+=2)if(pixels[(y*canvas.width+x)*4+3]>120)points.push([x,y]);
  // Sort spatially: neighbouring blocks tend to migrate as coherent cohorts.
  const morton=(x,y)=>{let r=0;for(let k=0;k<10;k++){r|=((x>>k)&1)<<(k*2);r|=((y>>k)&1)<<(k*2+1);}return r;};
  points.sort((a,b)=>morton(a[0],a[1])-morton(b[0],b[1]));return {points,textWidth,canvas};
 };
 let words;
 const rebuild=()=>{
  if(!words||disposed)return;
  geometry?.dispose();material?.dispose();if(mesh)scene.remove(mesh);
  solidMeshes.splice(0).forEach(m=>{scene.remove(m);m.geometry.dispose();m.material.map.dispose();m.material.dispose();if(m.userData.shadow){scene.remove(m.userData.shadow);m.userData.shadow.material.dispose();}});
  camera.right=width;camera.bottom=height;camera.updateProjectionMatrix();
  const longest=Math.max(...words.map(w=>w.textWidth)),scale=Math.min(.83,(width*.86)/longest),left=width*.05,top=compact?height*.34:Math.max(65,height*.09);
  bounds=words.map(w=>({left,top:top+15*scale,width:w.textWidth*scale,height:95*scale}));
  count=Math.min(6500,Math.max(...words.map(w=>w.points.length)));
  const data={aFirst:[],aSecond:[],aCloud:[],aSeed:[]};
  for(let i=0;i<count;i++){
   const random=Math.sin(i*127.1+311.7)*43758.5453,fract=random-Math.floor(random);
   for(let j=0;j<2;j++){const list=words[j].points,p=list[Math.min(list.length-1,Math.floor((i+.5)/count*list.length))];data[j?'aSecond':'aFirst'].push(left+p[0]*scale,top+p[1]*scale);}
   const angle=i*2.39996323,radius=70+Math.sqrt(fract)*Math.min(width*.35,400);data.aCloud.push(left+longest*scale*.5+Math.cos(angle)*radius,top+65+Math.sin(angle)*radius*.48);data.aSeed.push(fract);
  }
  geometry=new THREE.InstancedBufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,-1,0,1,1,0,-1,1,0],3));
  for(const [name,array] of Object.entries(data))geometry.setAttribute(name,new THREE.InstancedBufferAttribute(new Float32Array(array),name==='aSeed'?1:2));geometry.instanceCount=count;
  material=new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthTest:false,depthWrite:false,uniforms:{uLighting:{value:lighting?1:0},uLight:{value:new THREE.Vector2()},uFlicker:{value:1},uCarry:{value:0},uPointer:{value:pointer},uHome:{value:home},uSolid:{value:0},uProgress:{value:0},uMode:{value:0},uTime:time,uSize:{value:Math.max(.5,scale*.87)}},vertexShader:`
   attribute vec2 aFirst,aSecond,aCloud;attribute float aSeed;uniform float uProgress,uMode,uTime,uSize,uSolid,uCarry,uLighting,uFlicker;uniform vec2 uPointer,uHome,uLight;varying float vSeed,vFlight,vLight;varying vec2 vLocal;
   void main(){
    vec2 a=uMode<.5?aCloud:(uMode<1.5?aFirst:aSecond);vec2 b=aFirst;if(uMode>.5&&uMode<1.5)b=aSecond;
    float p=clamp((uProgress-aSeed*.16)/.84,0.,1.);float e=p*p*(3.-2.*p);float flight=sin(p*3.14159265);
    float direction=mod(floor(aSeed*12.),2.)<1.?-1.:1.;
    vec2 centre=(a+b)*.5+vec2(direction*(20.+aSeed*50.),-35.-aSeed*60.);
    vec2 pos=(1.-e)*(1.-e)*a+2.*(1.-e)*e*centre+e*e*b;
    pos+=flight*vec2(sin(pos.y*.025+uTime*.8+aSeed*6.28),cos(pos.x*.02-uTime*.6+aSeed*6.28))*8.;
    vec2 flock=uPointer+vec2(cos(aSeed*628.),sin(aSeed*942.))*(12.+aSeed*52.)+(b-uHome)*.12;pos=mix(pos,flock,uCarry);
    float angle=direction*flight*(1.+aSeed*3.)+uCarry*sin(aSeed*50.+uTime)*2.;mat2 rotation=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
    vec2 corner=rotation*position.xy*uSize*(1.+flight*.35+uSolid*.22);vLocal=position.xy;vSeed=aSeed;vFlight=flight;
    vLight=mix(1.,(.62+.55*exp(-length(pos-uLight)/240.))*uFlicker,uLighting);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos+corner,0.,1.);
   }`,fragmentShader:`uniform float uSolid;varying float vSeed,vFlight,vLight;varying vec2 vLocal;void main(){float rim=smoothstep(.65,1.,max(abs(vLocal.x),abs(vLocal.y)));vec3 base=mix(vec3(.32,.78,.9),vec3(.81,.96,1.),vSeed);if(vSeed>.96)base=vec3(.95,.68,.35);base=mix(base,vec3(.72,.91,.95),uSolid);base*=vLight*(1.-rim*.35*(1.-uSolid));gl_FragColor=vec4(base,(.94-vFlight*.12)*(1.-smoothstep(.7,1.,uSolid)));}`});
  mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.name='goal-directed-type-swarm';scene.add(mesh);
  for(const w of words){const texture=new THREE.CanvasTexture(w.canvas);texture.colorSpace=THREE.SRGBColorSpace;const fill=new THREE.Mesh(new THREE.PlaneGeometry(w.canvas.width*scale,w.canvas.height*scale),new THREE.MeshBasicMaterial({map:texture,color:0xb8e8f2,transparent:true,opacity:0,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));fill.position.set(left+w.canvas.width*scale/2,top+w.canvas.height*scale/2,0);fill.scale.y=-1;fill.renderOrder=2;fill.frustumCulled=false;if(lighting){const shadow=new THREE.Mesh(fill.geometry,new THREE.MeshBasicMaterial({map:texture,color:0x000000,transparent:true,opacity:0,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));shadow.scale.y=-1;shadow.renderOrder=0;shadow.frustumCulled=false;fill.userData.shadow=shadow;scene.add(shadow);}solidMeshes.push(fill);scene.add(fill);}
 };
 font.load().then(loaded=>{if(disposed)return;document.fonts.add(loaded);words=phrases.map(targets);rebuild();ready=true;start=time.value;onReady();}).catch(error=>{if(!disposed){phase='font-error';console.error('Swarm font failed',error);}});
 const draw=()=>{
  if(!ready||disposed)return;
  const dt=Math.max(0,Math.min(.04,time.value-previousTime));previousTime=time.value;
  const elapsed=Math.max(0,time.value-start),duration=2.6,hold=5;
  let mode=0,progress=1,solidIndex=0;solidity=0;const smooth=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
  if(preference.matches){phase='reduced-motion';word=phrases[0];solidity=1;}
  else if(elapsed<duration){progress=elapsed/duration;phase='assembling';word=phrases[0];}
  else if(elapsed<duration+hold||!cycle){phase='holding';word=phrases[0];solidity=smooth((elapsed-duration)/1.2);}
  else{const t=elapsed-duration-hold,cycle=Math.floor(t/(duration+hold)),local=t%(duration+hold);mode=cycle%2===0?1:2;progress=Math.min(1,local/duration);phase=progress<1?'reforming':'holding';word=phrases[mode===1?1:0];if(local<duration){solidIndex=mode===1?0:1;solidity=1-smooth(local/.35);}else{solidIndex=mode===1?1:0;solidity=smooth((local-duration)/1.2);}}
  if(preference.matches){carry=0;carryGoal=0;}else if(phase==='holding')carry+=(carryGoal-carry)*(1-Math.exp(-5*dt));else{carryGoal=0;carry+=(0-carry)*(1-Math.exp(-5*dt));}
  if(carry<.001&&carryGoal===0)carry=0;else if(carry>.999&&carryGoal===1)carry=1;
  const r=bounds[phrases.indexOf(word)]||bounds[0];home.set(r.left+r.width/2,r.top+r.height/2);
  solidity*=1-carry;material.uniforms.uCarry.value=carry;
  if(lighting){const lx=width*(.5+Math.sin(time.value*.38)*.4),ly=height*(.15+Math.cos(time.value*.27)*.12),flicker=.94+.04*Math.sin(time.value*3.2)+.02*Math.sin(time.value*5.3);material.uniforms.uLight.value.set(lx,ly);material.uniforms.uFlicker.value=flicker;solidMeshes.forEach(m=>{const dx=m.position.x-lx,dy=m.position.y-ly,d=Math.max(1,Math.hypot(dx,dy));m.material.color.setRGB(.62*flicker,.85*flicker,.92*flicker);const shadow=m.userData.shadow;shadow.position.set(m.position.x+dx/d*12,m.position.y+dy/d*12,0);shadow.material.opacity=solidity*.55*flicker;});}
  material.uniforms.uSolid.value=solidity;solidMeshes.forEach((m,i)=>{m.visible=i===solidIndex&&solidity>0;m.material.opacity=solidity;if(m.userData.shadow)m.userData.shadow.visible=m.visible;});
  material.uniforms.uMode.value=mode;material.uniforms.uProgress.value=progress;
  renderer.setRenderTarget(null);const previousAutoClear=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.render(scene,camera);renderer.autoClear=previousAutoClear;
 };
 return {draw,resize:(w,h)=>{width=w;height=h;rebuild();},probe:()=>({ready,phase,word,blocks:count,interaction:{armed,carry,carryGoal,pointer:{x:pointer.x,y:pointer.y},bounds:bounds[phrases.indexOf(word)]||bounds[0],locked:carry===0},holdSeconds:5,transitionSeconds:2.6,fusionSeconds:1.2,solidity,elapsed:time.value-start,lighting,light:lighting?{x:material?.uniforms.uLight.value.x,y:material?.uniforms.uLight.value.y,flicker:material?.uniforms.uFlicker.value}:null,drawCalls:1+(solidity>0?(lighting?2:1):0)}),dispose:()=>{disposed=true;window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',move);window.removeEventListener('pointerup',release);document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);window.removeEventListener('keydown',key);geometry?.dispose();material?.dispose();solidMeshes.forEach(m=>{m.geometry.dispose();m.material.map.dispose();m.material.dispose();if(m.userData.shadow){scene.remove(m.userData.shadow);m.userData.shadow.material.dispose();}});document.fonts.delete(font);}};
}
