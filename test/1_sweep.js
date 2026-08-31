hush()

setResolution(1920,1080)

setFunction({
  name: "vco",
  type: "src",
  inputs: [
    {
      type: "float",
      name: "frequency",
      default: 60,
    },
  ],
  glsl: `
       float TAU = 6.28318530718;
       float r = -cos(_st.y*frequency*TAU);
       return vec4(r, r, r, 1.0);`,
});

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

// measure 1: sweep [0 - 900] (vertical blanking compensation)
vco([0, 15].smooth().fast(.2)).amp(0.5).brightness(0.5).out()

// measure 1: sweep [0 - 900] (vertical blanking compensation)
vcoComp([0, 15].smooth().fast(.2)).amp(0.5).brightness(0.5).out()

// measure 1: sweep [0 - 900] (vertical blanking compensation + sigmoid())
vcoComp([0, 15].smooth().fast(.2)).amp(0.5).brightness(0.5).mult(sigmoid()).out()




// measure 2: sweep [30 - 6000Hz] (vertical blanking compensation)
vco([0.5, 100].smooth().fast(.2)).amp(0.5).brightness(0.5).out()

// measure 2: sweep [30 - 6000Hz] (vertical blanking compensation)
vcoComp([0.5, 100].smooth().fast(.2)).amp(0.5).brightness(0.5).out()

// measure 2: sweep [30 - 6000Hz] (vertical blanking compensation + sigmoid())
vcoComp([0.5, 100].smooth().fast(.2)).amp(0.5).brightness(0.5).mult(sigmoid()).out()

