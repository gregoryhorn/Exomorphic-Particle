import * as THREE from 'three';
import {createSwarm} from './Swarm.js';
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setClearColor(0x000000,0);document.body.appendChild(renderer.domElement);
const time={value:0},preference=matchMedia('(prefers-reduced-motion: reduce)');let paused=false,raf=0,last=performance.now(),disposed=false;
const draw=()=>{renderer.setRenderTarget(null);renderer.clear();swarm.draw();};
const swarm=createSwarm(renderer,time,()=>{if(!disposed)draw();},{cycle:true,lighting:true,compact:true,labels:['Exomorphic-Particle','Codex']});
const stopped=()=>paused||preference.matches||document.hidden;
const tick=t=>{raf=0;if(disposed)return;if(!stopped())time.value+=Math.min((t-last)/1000,.04);last=t;draw();if(!stopped())raf=requestAnimationFrame(tick);};
const update=()=>{cancelAnimationFrame(raf);raf=0;last=performance.now();draw();if(!stopped())raf=requestAnimationFrame(tick);};
const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);swarm.resize(innerWidth,innerHeight);draw();};
let parentOrigin;try{parentOrigin=new URL(document.referrer).origin;}catch{parentOrigin=location.origin;}
const message=event=>{if(event.source===parent&&[parentOrigin,location.origin,'https://gregoryhorn.xyz'].includes(event.origin)&&event.data?.type==='exomorphic-motion'){paused=event.data.paused===true;update();}};
window.addEventListener('message',message);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',update);preference.addEventListener('change',update);resize();update();
window.__exoMini=()=>({...swarm.probe(),time:time.value,paused:stopped(),rafScheduled:!!raf});
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);window.removeEventListener('message',message);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',update);preference.removeEventListener('change',update);swarm.dispose();renderer.dispose();},{once:true});
