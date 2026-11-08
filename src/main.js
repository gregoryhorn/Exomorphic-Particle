import * as THREE from 'three';
import {buildLayer,populateLayers} from './FieldLayers.js';
import {createLayerRenderer} from './LayerRenderer.js';
import {createPackets} from './Packets.js';
import {createSwarm} from './Swarm.js';
import './style.css';
const parameters=new URLSearchParams(location.search),test=parameters.has('test'),preference=matchMedia('(prefers-reduced-motion: reduce)');
const back=document.getElementById('back');back.addEventListener('click',e=>{if(document.referrer&&history.length>1){e.preventDefault();history.back();}});
if(test){document.getElementById('test-link').href='./';document.getElementById('test-link').textContent='Main page';}
const host=document.getElementById('field'),button=document.getElementById('motion');let renderer,composite,swarm,layers,packets,observer,raf=0,paused=false,disposed=false,nowBefore=performance.now(),px=0,py=0;
const time={value:0};
try{
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);
 const scenes=[new THREE.Scene(),new THREE.Scene(),new THREE.Scene()],camera=new THREE.PerspectiveCamera(47,1,.1,90);camera.position.set(0,5.3,21.25);camera.lookAt(0,-.2,-5);
 layers=[0,1,2].map(buildLayer);populateLayers(scenes,layers,time);packets=createPackets(layers[0],time);scenes[0].add(packets.object);composite=createLayerRenderer(renderer,scenes,camera);
 const draw=()=>{composite.draw();swarm?.draw();};
 swarm=createSwarm(renderer,time,()=>{if(!disposed){document.body.classList.add('ready');draw();}},{cycle:test});
 const stopped=()=>paused||preference.matches;
 const tick=t=>{raf=0;if(disposed||document.hidden)return;const dt=Math.min((t-nowBefore)/1000,.04);nowBefore=t;if(!stopped()){time.value+=dt;const ease=1-Math.exp(-1.25*dt);camera.position.x+=(px*.7-camera.position.x)*ease;camera.position.y+=(5.3+py*.3-camera.position.y)*ease;camera.lookAt(0,-.2,-5);}draw();if(!stopped())raf=requestAnimationFrame(tick);};
 const wake=()=>{if(!raf&&!document.hidden&&!disposed){nowBefore=performance.now();raf=requestAnimationFrame(tick);}};
 const update=()=>{cancelAnimationFrame(raf);raf=0;button.disabled=preference.matches;button.textContent=preference.matches?'Reduced motion':paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(stopped()));draw();if(!stopped())wake();};
 const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();composite.resize(width,height);swarm.resize(width,height);draw();};
 const move=e=>{px=e.clientX/innerWidth*2-1;py=-(e.clientY/innerHeight*2-1);};
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{draw();if(!stopped())wake();}};
 const toggle=()=>{paused=!paused;update();};const lost=e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;document.getElementById('failure').hidden=false;document.getElementById('failure').textContent='The graphics context was lost. Reload to restart; navigation and the download still work.';};
 window.addEventListener('pointermove',move,{passive:true});document.addEventListener('visibilitychange',visibility);preference.addEventListener('change',update);button.addEventListener('click',toggle);renderer.domElement.addEventListener('webglcontextlost',lost);observer=new ResizeObserver(resize);observer.observe(host);resize();update();
 window.__exoProbe=()=>({time:time.value,paused:stopped(),rafScheduled:!!raf,test,swarm:swarm.probe(),drawCalls:renderer.info.render.calls});
 window.addEventListener('pageshow',event=>{if(event.persisted)visibility();});
 window.addEventListener('pagehide',event=>{if(event.persisted){cancelAnimationFrame(raf);raf=0;return;}disposed=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',update);button.removeEventListener('click',toggle);renderer.domElement.removeEventListener('webglcontextlost',lost);const geometries=new Set(),materials=new Set();scenes.forEach(s=>s.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);}));layers.forEach(l=>Object.values(l).forEach(g=>{if(g?.isBufferGeometry)geometries.add(g);}));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());packets.dispose();swarm.dispose();composite.dispose();renderer.dispose();});
}catch(error){console.error(error);document.getElementById('failure').hidden=false;document.getElementById('failure').textContent='This browser cannot start the live graphics. The project download and links still work.';button.disabled=true;}
