// Multi‑colour demo

hush()

setResolution(1920,1080)


setFunction({
  name: "vcoComp",
  type: "src",
  inputs: [{ type: "float", name: "pitch", default: 60 }],
  glsl: `
        float yComp = _st.y * (1080.0/1125.0); 
        float r = -cos(yComp * pitch * 6.28318530718); 
        return vec4(r, r, r, 1.0); `,
});


setFunction({
  name: "amp",
  type: "color",
  inputs: [{ type: "float", name: "amount", default: 1.0 }],
  glsl: `
        return vec4(_c0.rgb * amount, _c0.a);`,
});


setFunction({
  name: "sigmoid",
  type: "src",
  inputs: [
    { name: "steepness", type: "float", default: 40.0 },
    { name: "margin", type: "float", default: 0.03 },
    { name: "amount", type: "float", default: 1.0 },
  ],
  glsl: `
      vec2 st = _st;
      float y = st.y;
      float s = clamp(steepness, 1.0, 100.0);
      float m = clamp(margin, 0.0, 0.49);
      float bottom = 1.0 / (1.0 + exp(-s * (y - m)));
      float top = 1.0 / (1.0 + exp(s * (y - (1.0 - m))));
      float w = bottom * top;
      float win = mix(1.0, w, amount);
      return vec4(vec3(win), 1.0);
`,
});


solid()
.add(vcoComp(520/60))
.add(vcoComp(300/60))
.add(vcoComp(870/60)) 
.amp(0.5/3.0).brightness(0.5)
.mult(sigmoid())
.out()


solid()
.add(vcoComp(520/60).color(0,0,1) )
.add(vcoComp(300/60).color(0,1,0) )
.add(vcoComp(870/60).color(1,0,0) ) 
.amp(0.5).brightness(0.5)
.mult(sigmoid())
.out()

