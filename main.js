// GNU General Public License v3.0

async function initHybridHydra() {
  /// ===== Hydra-Strudel integration ===== ///

  // code adapted from https://github.com/atfornes/Hydra-strudel-extension/blob/main/hydra-strudel.js

  if (window.strudel !== undefined) {
    return;
  }
  // to avoid multiple calls
  window.strudel = "";
  const hydraHush = hush;
  const strudel = await import("https://cdn.skypack.dev/@strudel.cycles/core");
  const webaudio =
    await import("https://cdn.skypack.dev/@strudel.cycles/webaudio");
  const mini = await import("https://cdn.skypack.dev/@strudel.cycles/mini");
  const { evalScope } = strudel;
  const { webaudioScheduler } = webaudio;
  const { miniAllStrings } = mini;
  //initAudioOnFirstClick();
  miniAllStrings();
  const loadModules = evalScope(evalScope, strudel, mini, webaudio);
  await Promise.all([loadModules]);
  const scheduler = webaudioScheduler();

  Pattern.prototype["value"] = function () {
    const t = scheduler.now();
    return this.query(new strudel.State(new strudel.TimeSpan(t, t)))[0].value;
  };

  shush = () => scheduler?.stop();

  hush = hydraHush;

  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === ".") {
      shush();
    }
  });

  // enabling to use pattern functions to stringsm converting them to Patterns:
  // "10 20".slow(2)
  //  is the same as:
  //  mini("10 20").slow(2)
  Object.setPrototypeOf(String.prototype, Pattern.prototype);

  // function to use inside hydra code, syntax sugar of:
  // () => pattern.value(); // for Patterns
  // () => window.mini(pattern).value(); // for strings that have not been converted to Patterns
  window.P = (pattern) => {
    if (pattern instanceof Pattern) {
      return () => pattern.value();
    } else {
      return () => window.mini(pattern).value();
    }
  };

  console.log("Strudel loaded!");

  /// ===== End of Hydra-Strudel integration ===== ///

  /*

  SEQUENCER

  */

  window.activeTrackers = new Set();

  // Automatically unregister track objects when GC cleans them up
  const trackerRegistry = new FinalizationRegistry((ref) => {
    window.activeTrackers.delete(ref);
  });

  // Factory Function: track(sequenceCallback, attackSec, minLengthSec, decaySec)
  window.track = (
    sequenceCallback,
    attackSec = 0,
    minLengthSec = 2,
    decaySec = 0.01,
  ) => {
    let noteStartTime = -Infinity;
    let activeNoteVal = 0;
    let prevRawVal = 0;
    let amp = 0;

    // The callable function returned to Hydra
    const trackerFunc = () => amp;

    trackerFunc.update = (dtSec) => {
      const now = performance.now() / 1000;

      const currentPattern = P(sequenceCallback);
      const rawVal =
        typeof currentPattern === "function"
          ? currentPattern()
          : currentPattern;

      const isNewNote =
        rawVal > 0 &&
        (rawVal !== prevRawVal ||
          (currentPattern.query && currentPattern.query().length > 0));

      if (isNewNote) {
        noteStartTime = now;
        activeNoteVal = rawVal;
        amp = attackSec > 0 ? 0 : activeNoteVal;
      }
      prevRawVal = rawVal;

      const elapsed = now - noteStartTime;
      const isHoldPhase = elapsed < minLengthSec;

      if (elapsed < attackSec && attackSec > 0) {
        amp = Math.min(activeNoteVal, (elapsed / attackSec) * activeNoteVal);
      } else if (isHoldPhase) {
        amp = activeNoteVal;
      } else {
        const safeDecaySec = Math.max(0.001, decaySec);
        amp *= Math.exp((-6.91 * dtSec) / safeDecaySec);
      }
    };

    // Register a weak reference to this tracker instance
    const weakRef = new WeakRef(trackerFunc);
    window.activeTrackers.add(weakRef);
    trackerRegistry.register(trackerFunc, weakRef);

    return trackerFunc;
  };
  // 2. Tracker Step Engine
  let lastFrameTime = performance.now() / 1000;

  window.stepTrackers = () => {
    const now = performance.now() / 1000;
    const dtSec = now - lastFrameTime;
    lastFrameTime = now;

    window.activeTrackers.forEach((ref) => {
      const tracker = ref.deref();
      if (tracker) {
        tracker.update(dtSec);
      } else {
        window.activeTrackers.delete(ref);
      }
    });
  };

  // 3. Transparent Update Override Interceptor
  let userDefinedUpdate = () => {};

  Object.defineProperty(window, "update", {
    configurable: true,
    enumerable: true,
    get() {
      return () => {
        userDefinedUpdate(); // Run custom code defined in Hydra
        stepTrackers(); // Run tracker step engine automatically
      };
    },
    set(fn) {
      if (typeof fn === "function") {
        userDefinedUpdate = fn;
      }
    },
  });

  /* 

  OPERATORS

  /*



  /*

  AMP

  */

  setFunction({
    name: "amp",
    type: "color",
    inputs: [{ type: "float", name: "amount", default: 1 }],
    glsl: `
          return vec4(_c0.rgb*amount, _c0.a);
      `,
  });

  /*

  Layer

  */

  setFunction({
    name: "rr",
    type: "color",
    inputs: [],
    glsl: `
          return vec4(_c0.r, 0.0, 0.0, _c0.a);
      `,
  });
  setFunction({
    name: "gg",
    type: "color",
    inputs: [],
    glsl: `
          return vec4(0.0, _c0.g, 0.0, _c0.a);
      `,
  });
  setFunction({
    name: "bb",
    type: "color",
    inputs: [],
    glsl: `
          return vec4(0.0, 0.0, _c0.b, _c0.a);
      `,
  });

  // hydra's substract function substract the alpha channel as well, which is not always desired.
  // This function only substracts the rgb channels and keeps the alpha channel of the first input.
  setFunction({
    name: "sub2",
    type: "combine",
    inputs: [
      {
        type: "float",
        name: "amount",
        default: 1,
      },
    ],
    glsl: `   return vec4(_c0.rgb-_c1.rgb, _c0.a);`,
  });

  /*

  Synth

  */

  setFunction({
    name: "cos_naive",
    type: "src",
    inputs: [{ type: "float", name: "numPeriods", default: 60 }],
    glsl: `
      float TAU = 6.28318530718;
      float s = -cos(_st.y * numPeriods * TAU);
      return vec4(s, s, s, 1.0);`,
  });

  setFunction({
    name: "cos",
    type: "src",
    inputs: [{ type: "float", name: "numPeriods", default: 60 }],
    glsl: `
    float TAU = 6.28318530718;
    float yComp = _st.y * (1080.0/1125.0); 
    float s = -cos(yComp * numPeriods * TAU);
    return vec4(s, s, s, 1.0); `,
  });

  setFunction({
    name: "phaseLockedCos",
    type: "src",
    inputs: [
      { name: "freq", type: "float", default: 30.0 },
      { name: "fps", type: "float", default: 60.0 },
    ],
    glsl: `
    float TAU = 6.28318530718;
    float yComp = _st.y * (1080.0/1125.0); 
    float k = floor(time * fps);
    float tSample = (k + yComp) / fps;
    float s = -cos(TAU * freq * tSample);
    return vec4(s, s, s, 1.0);
`,
  });

  /*

  Drums

  */

  setFunction({
    name: "acht",
    type: "src",
    inputs: [
      {
        type: "float",
        name: "line",
        default: 60,
      },
    ],
    glsl: `
      float r = -cos(sqrt(line)*80.0*-0.25*_st.y);
      return vec4(r, r, r, 1.0);`,
  });

  setFunction({
    name: "acht2",
    type: "src",
    inputs: [
      {
        type: "float",
        name: "line",
        default: 60,
      },
    ],
    glsl: `
      float r = sqrt(line)*( cos(line*20.0*_st.y));
      return vec4(r, r, r, 1.0);`,
  });

  /* 

  Filters

  */

  // usage:
  // shape(4)
  // .lowpass(o0,0.001,0.9)
  // .out()

  Object.getPrototypeOf(src()).comb = function (tex, freq = 1.02, amt = 0.9) {
    return this.blend(src(tex).scrollY(freq), amt);
  };

  // highpass example
  // src(s0)
  // .sub2(src(s0).scrollY(0.01),1)
  // .out(o0)

  // 1. Hann Window Source (Maximum Hum Avoidance)
  setFunction({
    name: "hann",
    type: "src",
    inputs: [{ name: "amount", type: "float", default: 1.0 }],
    glsl: `
    vec2 st = _st;
    // Raised cosine wave along Y axis
    float w = 0.5 * (1.0 - cos(6.28318530718 * st.y));
    float win = mix(1.0, w, amount);
    return vec4(vec3(win), 1.0);
  `,
  });

  // 2. Tukey / Tapered Cosine Source (Balanced)
  setFunction({
    name: "tukey",
    type: "src",
    inputs: [
      { name: "alpha", type: "float", default: 0.2 },
      { name: "amount", type: "float", default: 1.0 },
    ],
    glsl: `
    vec2 st = _st;
    float a = clamp(alpha, 0.001, 1.0);
    float y = st.y;
    float w = 1.0;
    
    if (y < a / 2.0) {
      w = 0.5 * (1.0 + cos(3.14159265359 * (2.0 * y / a - 1.0)));
    } else if (y > 1.0 - a / 2.0) {
      w = 0.5 * (1.0 + cos(3.14159265359 * (2.0 * (y - 1.0) / a + 1.0)));
    }
    
    float win = mix(1.0, w, amount);
    return vec4(vec3(win), 1.0);
  `,
  });

  // 3. Sigmoid / Logistic Source (Maximum Image Preservation)
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

  /*

  Misc

  */

  setFunction({
    name: "rand",
    type: "src",
    inputs: [
      {
        type: "float",
        name: "line",
        default: 60,
      },
    ],
    glsl: `
    float r = fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    return vec4(r, r, r, 1.0);`,
  });
}
