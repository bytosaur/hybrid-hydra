

await loadScript("https://cdn.jsdelivr.net/gh/geikha/hyper-hydra@latest/hydra-wrap.js")

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

Object.getPrototypeOf(src()).lowpass = function (
  tex,
  freq = 1.02,
  amt = 0.9,
) {
  return this.blend(src(tex).scrollY(freq), amt);
};



// measure 1: sweep [0 - 900Hz] (vertical blanking compensation + sigmoid())
vcoComp([0, 15].smooth().fast(.2)).thresh(0,0).mult(sigmoid()).out()


// measure 2: 240Hz (square wave open & close)
vcoComp(4).thresh([-1,1].smooth().fast(.2)).mult(sigmoid()).out()


// hydraWrap.setNoWrap()

// measure 3: 240Hz square (lowpass open & close)
vcoComp(4).thresh(0,0).lowpass(o0, 0.03, [0.6,0.95].smooth(.2)).out()

src(o0).mult(sigmoid()).out(o1)

render(o1)

// measure 4: 240Hz square (lowpass cutoff open & close)
vcoComp(4).thresh(0,0).lowpass(o0, [0.0,0.1].smooth(.2), 0.9).out()

src(o0).mult(sigmoid()).out(o1)

render(o1)



