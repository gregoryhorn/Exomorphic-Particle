import * as THREE from 'three';
export const waveGLSL=`vec3 field(vec3 p){float ridge=sin(p.x*.24+p.z*.28+uLayer*1.7+uTime*.09);float ripple=sin(p.z*.57-p.x*.31+uLayer*2.1-uTime*.12);p.y+=p.x*.17-p.z*.085+ridge*1.45+ripple*.5+sin(p.x*.7+p.z*.13+uTime*.06)*.15;return p;}`;
export function buildLayer(layer){
 let seed=82517+layer*913;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const [nx,nz,width,depth,y,zOffset]=[[91,40,44,38,-1.2,-7],[73,26,50,35,.1,-21],[51,18,37,15,-3,4]][layer];
 const edgePairs=[];const nodes=[],edges=[],colours=[],seeds=[],edgeGold=[];let goldNodes=0,goldEdges=0,edgeIndex=0;
 const colour=gold=>gold?[.93,.58,.25]:[.025,.54,.86];
 for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){
  const i=z*nx+x;nodes.push((x/(nx-1)-.5)*width+(random()-.5)*1.14,y+(random()-.5)*.55+(random()<.055?random()*1.8:0),(z/(nz-1)-.5)*depth+zOffset+(random()-.5)*.62);
  const gold=i%20===7;if(gold)goldNodes++;colours.push(...colour(gold));seeds.push(random());
 }
 const baseNodes=nodes.length/3;
 if(layer===0)for(let i=0;i<120;i++){const index=nodes.length/3;nodes.push((random()-.5)*40,-.7+random()*3.4,(random()-.5)*20-1);const gold=index%20===7;if(gold)goldNodes++;colours.push(...colour(gold));seeds.push(random());}
 const edge=(a,b)=>{edgePairs.push(a,b);const gold=edgeIndex++%20===7;if(gold)goldEdges++;edges.push(...nodes.slice(a*3,a*3+3),...nodes.slice(b*3,b*3+3));edgeGold.push(gold?1:0,gold?1:0);};
 for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const i=z*nx+x;if(x<nx-1&&random()>.25)edge(i,i+1);if(z<nz-1&&random()>.32)edge(i,i+nx);if(x<nx-1&&z<nz-1&&random()>.58)edge(i,i+nx+1);if(x<nx-4&&z<nz-2&&random()>.96)edge(i,i+nx*2+4);}
 for(let i=baseNodes;i<nodes.length/3;i++){const nearest=[];for(let j=0;j<i;j++){const dx=nodes[i*3]-nodes[j*3],dy=nodes[i*3+1]-nodes[j*3+1],dz=nodes[i*3+2]-nodes[j*3+2];const distance=dx*dx+dy*dy+dz*dz;if(distance<16)nearest.push([distance,j]);}nearest.sort((a,b)=>a[0]-b[0]);nearest.slice(0,3).forEach(([,j])=>edge(i,j));}
 const geometry=p=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return g;};
 const points=geometry(nodes);points.setAttribute('aColor',new THREE.Float32BufferAttribute(colours,3));points.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
 const lines=geometry(edges);lines.setAttribute('aGold',new THREE.Float32BufferAttribute(edgeGold,1));
 const motes=[],moteColours=[],moteSeeds=[];const n=[150,180,60][layer];
 for(let i=0;i<n;i++){motes.push((random()-.5)*(layer===2?23:40),random()*10-3,layer===2?3+random()*8:layer===1?-30+random()*18:-12+random()*16);moteColours.push(...colour(i%20===7));moteSeeds.push(random());}
 const floating=geometry(motes);floating.setAttribute('aColor',new THREE.Float32BufferAttribute(moteColours,3));floating.setAttribute('aSeed',new THREE.Float32BufferAttribute(moteSeeds,1));
 const traces=[],traceGold=[];
 if(layer!==2)for(let r=0;r<16;r++)for(let j=0;j<150;j++){
  const z=-26+j/150*37,zz=-26+(j+1)/150*37;const x=4.6*Math.sin(z*.17+r*.045)+r*.12-3.5,xx=4.6*Math.sin(zz*.17+r*.045)+r*.12-3.5;
  traces.push(x,y+.05,z,xx,y+.05,zz);traceGold.push(r%20===7?1:0,r%20===7?1:0);
 }
 const streams=geometry(traces);streams.setAttribute('aGold',new THREE.Float32BufferAttribute(traceGold,1));
 return {points,lines,floating,streams,graph:{positions:points.attributes.position.array,edges:edgePairs},stats:{nodes:nodes.length/3,goldNodes,edges:edges.length/6,goldEdges,motes:n,goldMotes:Math.floor((n+12)/20)}};
}
export function populateLayers(scenes,layers,time){
 const makePoints=(geometry,size,opacity,layer,floating=false)=>{
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:time,uLayer:{value:layer},uSize:{value:size},uOpacity:{value:opacity},uFloating:{value:floating?1:0}},vertexShader:`uniform float uTime,uLayer,uSize,uFloating;attribute vec3 aColor;attribute float aSeed;varying vec3 vColor;varying float vAlpha;varying float vBlur;${waveGLSL}
   void main(){vec3 p=position;if(uFloating<.5)p=field(p);else{p.x+=sin(uTime*.055+aSeed*20.)*.35;p.y+=sin(uTime*.08+aSeed*30.)*.22;}vec4 mv=modelViewMatrix*vec4(p,1.);float pulse=pow(max(0.,sin(p.z*.6+p.x*.27-uTime*.85+aSeed*4.)),12.);float hot=step(.965,aSeed);vColor=aColor*(1.+hot*3.2);vBlur=uFloating>.5?clamp(abs(-mv.z-18.)/13.,0.,1.):0.;vAlpha=(.3+pulse*1.4)*exp(-length(mv.xyz)*.022);gl_PointSize=min(52.,(uSize*(1.+hot*.65)+vBlur*13.)*(24./max(4.,-mv.z)));gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uOpacity;varying vec3 vColor;varying float vAlpha;varying float vBlur;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float sharp=exp(-d*d*22.)+.14*exp(-d*d*4.);float soft=exp(-d*d*4.5)*.5;float light=mix(sharp,soft,vBlur);gl_FragColor=vec4(vColor,light*vAlpha*uOpacity);}`});
  const object=new THREE.Points(geometry,mat);object.frustumCulled=false;scenes[layer].add(object);
 };
 layers.forEach((data,layer)=>{
  const opacity=[1,.45,.58][layer];
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:time,uLayer:{value:layer},uOpacity:{value:opacity}},vertexShader:`uniform float uTime,uLayer;attribute float aGold;varying vec3 vWorld;varying float vDistance,vGold;${waveGLSL}void main(){vec3 p=field(position);vWorld=p;vGold=aGold;vec4 mv=modelViewMatrix*vec4(p,1.);vDistance=length(mv.xyz);gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uTime,uOpacity;varying vec3 vWorld;varying float vDistance,vGold;void main(){float stream=pow(max(0.,sin(vWorld.z*.6+vWorld.x*.27-uTime*.85)),16.);float alpha=(.105+stream*.5)*exp(-vDistance*.027)*uOpacity;vec3 color=mix(vec3(.018,.49,.79),vec3(.91,.55,.22),vGold);gl_FragColor=vec4(color,alpha);}`});
  for(const geometry of [data.lines,data.streams])if(geometry.attributes.position.count){const object=new THREE.LineSegments(geometry,mat);object.frustumCulled=false;scenes[layer].add(object);}
  makePoints(data.points,3.7,opacity,layer);makePoints(data.points,12,opacity*.25,layer);makePoints(data.floating,layer===2?14:8,layer===2?.34:.4,layer,true);
 });
}
