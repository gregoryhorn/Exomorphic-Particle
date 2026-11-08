import * as THREE from 'three';
import {waveGLSL} from './FieldLayers.js';

export function createPackets(layer,time){
 const {positions,edges}=layer.graph,n=positions.length/3,adj=Array.from({length:n},()=>[]);
 const length=(a,b)=>Math.hypot(positions[a*3]-positions[b*3],positions[a*3+1]-positions[b*3+1],positions[a*3+2]-positions[b*3+2]);
 const edgeSet=new Set();for(let i=0;i<edges.length;i+=2){const a=edges[i],b=edges[i+1],d=length(a,b);adj[a].push([b,d]);adj[b].push([a,d]);edgeSet.add(`${Math.min(a,b)}:${Math.max(a,b)}`);}
 const findPath=(start,goal)=>{
  const costs=new Float64Array(n).fill(Infinity),previous=new Int32Array(n).fill(-1),closed=new Uint8Array(n),open=[[length(start,goal),start]];costs[start]=0;
  while(open.length){open.sort((a,b)=>b[0]-a[0]);const [,a]=open.pop();if(closed[a])continue;if(a===goal){const result=[];for(let p=goal;p!==-1;p=previous[p])result.push(p);return result.reverse();}closed[a]=1;for(const [b,d] of adj[a]){const g=costs[a]+d;if(!closed[b]&&g<costs[b]){costs[b]=g;previous[b]=a;open.push([g+length(b,goal),b]);}}}
  throw new Error('No connected packet route');
 };
 const count=20,width=128,speed=1.8,gap=5,routes=[];
 const textureData=new Float32Array(width*count*4);
 for(let i=0;i<count;i++){
  const col=8+(i*17)%40,row=10+(i*7)%18;let start=row*91+col,goal=(row+(i%2?6:-7))*91+col+25+i%12;
  if(i%4===1)[start,goal]=[goal,start];
  if(i%4===2||i%4===3){const c=12+(i*11)%66,other=c+(i%4===2?13:-9);const nearRow=29+i%6,farRow=5+i%7;start=(i%4===2?nearRow:farRow)*91+c;goal=(i%4===2?farRow:nearRow)*91+other;}
  const nodes=findPath(start,goal);if(nodes.length>width)throw new Error('Packet route exceeds texture width');
  const distances=[0];for(let j=1;j<nodes.length;j++)distances.push(distances[j-1]+length(nodes[j-1],nodes[j]));
  const total=distances.at(-1),phase=(i*.61803398875)%1;
  for(let j=0;j<width;j++){const k=Math.min(j,nodes.length-1),node=nodes[k],offset=(i*width+j)*4;textureData.set([positions[node*3],positions[node*3+1],positions[node*3+2],distances[k]],offset);}
  routes.push({nodes,distances,total,phase});
 }
 const texture=new THREE.DataTexture(textureData,width,count,THREE.RGBAFormat,THREE.FloatType);texture.needsUpdate=true;
 const attributes={position:[],aRoute:[],aTotal:[],aCount:[],aPhase:[]};
 for(let i=0;i<count;i++){attributes.position.push(0,0,0);attributes.aRoute.push(i);attributes.aTotal.push(routes[i].total);attributes.aCount.push(routes[i].nodes.length);attributes.aPhase.push(routes[i].phase);}
 const geometry=new THREE.BufferGeometry();for(const [name,data] of Object.entries(attributes))geometry.setAttribute(name,new THREE.Float32BufferAttribute(data,name==='position'?3:1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:time,uLayer:{value:0},uRoutes:{value:texture},uSpeed:{value:speed},uGap:{value:gap}},vertexShader:`
 uniform float uTime,uLayer,uSpeed,uGap;uniform sampler2D uRoutes;
 attribute float aRoute,aTotal,aCount,aPhase;varying float vAlpha;varying vec3 vColor;
 ${waveGLSL}
 void main(){
  float head=mod(uTime*uSpeed+aPhase*(aTotal+uGap),aTotal+uGap);
  float distance=head;float row=(aRoute+.5)/20.;
  vec3 p=vec3(0.);bool found=false;
  for(int i=0;i<127;i++){
   if(float(i)>=aCount-1.)break;
   vec4 a=texture2D(uRoutes,vec2((float(i)+.5)/128.,row));vec4 b=texture2D(uRoutes,vec2((float(i)+1.5)/128.,row));
   if(distance>=a.w&&distance<=b.w){float t=(distance-a.w)/max(.0001,b.w-a.w);p=mix(field(a.xyz),field(b.xyz),t);found=true;break;}
  }
  float envelope=smoothstep(0.,.3,distance)*(1.-smoothstep(aTotal-.4,aTotal,distance));
  vAlpha=found?envelope:0.;
  vColor=mod(aRoute,10.)==7.?vec3(1.5,.9,.35):vec3(.25,1.2,1.8);
  vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=min(18.,5.8*(24./max(4.,-mv.z)));gl_Position=projectionMatrix*mv;
 }`,fragmentShader:`varying float vAlpha;varying vec3 vColor;void main(){vec2 p=gl_PointCoord-.5;float d=length(p)*2.;if(d>1.||vAlpha<.001)discard;float light=exp(-d*d*18.)+.18*exp(-d*d*4.);gl_FragColor=vec4(vColor,light*vAlpha);}`});
 const object=new THREE.Points(geometry,material);object.frustumCulled=false;object.name='information-packets';
 const allEdgesValid=routes.every(r=>r.nodes.slice(1).every((b,i)=>edgeSet.has(`${Math.min(r.nodes[i],b)}:${Math.max(r.nodes[i],b)}`)));
 const directionCounts={left:0,right:0,toward:0,away:0};for(const r of routes){const a=r.nodes[0],b=r.nodes.at(-1),dx=positions[b*3]-positions[a*3],dz=positions[b*3+2]-positions[a*3+2];if(Math.abs(dx)>Math.abs(dz))directionCounts[dx>0?'right':'left']++;else directionCounts[dz>0?'toward':'away']++;}
 const uniqueRoutes=new Set(routes.map(r=>r.nodes.join(','))).size;
 const sample=(t,id=0)=>{const r=routes[id],distance=(t*speed+r.phase*(r.total+gap))%(r.total+gap);let j=0;while(j<r.nodes.length-2&&r.distances[j+1]<distance)j++;return {distance,active:distance<=r.total,edge:[r.nodes[j],r.nodes[j+1]],progress:(distance-r.distances[j])/(r.distances[j+1]-r.distances[j]),destination:r.nodes.at(-1)};};
 return {object,probe:t=>({routeCount:count,uniqueRoutes,directionCounts,renderedDots:geometry.attributes.position.count,cyanDots:18,goldDots:2,trailSamples:0,speed,allEdgesValid,waypoints:routes.map(r=>r.nodes.length),sample:sample(t)}),dispose:()=>texture.dispose()};
}
