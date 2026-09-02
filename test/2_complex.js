// Complex waveform 


hush()

setResolution(1920,1080)

await loadScript("https://cdn.jsdelivr.net/gh/bytosaur/hybrid-hydra@main/main.js")

await initHybridHydra()



// measure 1: sweep [0 - 900Hz] (vertical blanking compensation + sigmoid())
cos([0, 15].smooth().fast(.2)).thresh(0,0).out()


// measure 2: square wave open & close
cos(4.78).thresh([-1,1].smooth().fast(.2)).out()


// hydraWrap.setNoWrap()

// measure 3: 240Hz square (lowpass open & close)
cos(4).thresh(0,0).lowpass(o0, 0.002, [0.9].smooth()).out()

src(o0).mult(sigmoid()).out(o1)

render(o1)

// measure 4: 240Hz square (lowpass cutoff open & close)
cos(4).thresh(0,0).lowpass(o0, [0.01,0.02].smooth().fast(1), 0.9).out()

src(o0).mult(sigmoid()).out(o1)

render(o1)



