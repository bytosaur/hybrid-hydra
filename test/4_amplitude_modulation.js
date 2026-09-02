// Amplitude modulation


hush()

setResolution(1920,1080)

await loadScript("https://cdn.jsdelivr.net/gh/bytosaur/hybrid-hydra@main/hybrid-hydra.js")

await initHybridHydra()


// measure 1: 240Hz (square wave open & close)
cos_naiveComp(40).amp(()=>(Math.sin(time))).amp(0.5).brightness(0.5).mult(sigmoid()).out()


// mininotation pattern with attack, minimum note length and decay
t1 = track("<1 0 [1 0 1] 0>", 0.3, 1.0, 0.3)

// measure 2: 240Hz amplitude controlled by mininotation pattern
cos_naiveComp(40).amp(t1).amp(0.5).brightness(0.5).mult(sigmoid()).out()


