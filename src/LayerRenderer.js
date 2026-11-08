import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

// Three depth-separated fields: sharp midground, softly defocused distance,
// and larger foreground blur. This is layered DOF, not a physical lens model.
export function createLayerRenderer(renderer,scenes,camera){
 const options={depthBuffer:false,stencilBuffer:false,type:THREE.HalfFloatType};
 const targets=[0,1,2].map(()=>new THREE.WebGLRenderTarget(1,1,options));
 const focusSoft=[0,1].map(()=>new THREE.WebGLRenderTarget(1,1,options));
 const cornerEnabled=new URLSearchParams(location.search).get('cornerBlur')!=='off';
 const scratch=[0,1].map(()=>new THREE.WebGLRenderTarget(1,1,options));
 const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const blurMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{uMap:{value:null},uStep:{value:new THREE.Vector2()}},vertexShader,fragmentShader:`varying vec2 vUv;uniform sampler2D uMap;uniform vec2 uStep;
 void main(){vec4 c=texture2D(uMap,vUv)*.227027;c+=(texture2D(uMap,vUv+uStep*1.384615)+texture2D(uMap,vUv-uStep*1.384615))*.316216;c+=(texture2D(uMap,vUv+uStep*3.230769)+texture2D(uMap,vUv-uStep*3.230769))*.070270;gl_FragColor=c;}`});
 const compositeMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{uFocus:{value:targets[0].texture},uFocusSoft:{value:focusSoft[1].texture},uCorner:{value:cornerEnabled?1:0},uFar:{value:targets[1].texture},uNear:{value:targets[2].texture}},vertexShader,fragmentShader:`varying vec2 vUv;uniform sampler2D uFocus,uFocusSoft,uFar,uNear;uniform float uCorner;
 void main(){float edge=.02+.32*pow(smoothstep(.48,1.,vUv.x),1.8);float corner=smoothstep(.52,.93,vUv.x)*(1.-smoothstep(edge-.08,edge+.1,vUv.y))*uCorner;vec3 focus=mix(texture2D(uFocus,vUv).rgb,texture2D(uFocusSoft,vUv).rgb,corner*.9);vec3 c=focus+texture2D(uFar,vUv).rgb*.72+texture2D(uNear,vUv).rgb*.86;float vignette=1.-smoothstep(.3,.88,length((vUv-.5)*vec2(.9,1.)));c*=mix(.45,1.,vignette);gl_FragColor=vec4(c+vec3(.003,.008,.012),1.);}`});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),blurMaterial),postScene=new THREE.Scene(),postCamera=new THREE.Camera();quad.frustumCulled=false;postScene.add(quad);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(postScene,postCamera));const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.48,.65,.3);composer.addPass(bloom);composer.addPass(new OutputPass());
 renderer.info.autoReset=false;
 const resize=(w,h)=>{const dpr=renderer.getPixelRatio();composer.setSize(w,h);focusSoft.forEach(t=>t.setSize(Math.max(1,Math.round(w*dpr)),Math.max(1,Math.round(h*dpr))));[1,.6,.65].forEach((ratio,i)=>targets[i].setSize(Math.max(1,Math.round(w*dpr*ratio)),Math.max(1,Math.round(h*dpr*ratio))));scratch.forEach((target,i)=>target.setSize(targets[i+1].width,targets[i+1].height));};
 const draw=()=>{
  renderer.info.reset();renderer.setClearColor('#000000',0);
  scenes.forEach((scene,i)=>{renderer.setRenderTarget(targets[i]);renderer.clear();renderer.render(scene,camera);});
  for(let i=1;i<3;i++){
   const radius=i===1?1.05:1.8;quad.material=blurMaterial;blurMaterial.uniforms.uMap.value=targets[i].texture;blurMaterial.uniforms.uStep.value.set(radius/targets[i].width,0);renderer.setRenderTarget(scratch[i-1]);renderer.render(postScene,postCamera);
   blurMaterial.uniforms.uMap.value=scratch[i-1].texture;blurMaterial.uniforms.uStep.value.set(0,radius/targets[i].height);renderer.setRenderTarget(targets[i]);renderer.render(postScene,postCamera);
  }
  quad.material=blurMaterial;blurMaterial.uniforms.uMap.value=targets[0].texture;blurMaterial.uniforms.uStep.value.set(2.2/targets[0].width,0);renderer.setRenderTarget(focusSoft[0]);renderer.render(postScene,postCamera);
  blurMaterial.uniforms.uMap.value=focusSoft[0].texture;blurMaterial.uniforms.uStep.value.set(0,2.2/targets[0].height);renderer.setRenderTarget(focusSoft[1]);renderer.render(postScene,postCamera);
  quad.material=compositeMaterial;renderer.setRenderTarget(null);renderer.setClearColor('#000000',1);composer.render();
 };
 return {resize,draw,dispose:()=>{composer.passes.forEach(p=>p.dispose?.());composer.dispose();targets.forEach(t=>t.dispose());scratch.forEach(t=>t.dispose());focusSoft.forEach(t=>t.dispose());quad.geometry.dispose();blurMaterial.dispose();compositeMaterial.dispose();}};
}
