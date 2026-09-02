// Phase modulation


hush()

setResolution(1920,1080)

await loadScript("https://cdn.jsdelivr.net/gh/bytosaur/hybrid-hydra@main/hybrid-hydra.js")

await initHybridHydra()


// mininotation pattern with attack, minimum note length and decay
t1 = track("<100 [200 140 300] 230>", 0.9, 0.2, 0.1)

// measure 1: 240Hz frequency controlled by mininotation pattern
cos_naiveComp(t1).amp(0.5).brightness(0.5).mult(sigmoid()).out()


// measure 2: 240Hz (square wave open & close)
cos_naiveComp(4).modulate(cos_naiveComp(10)).amp(0.5).brightness(0.5).mult(sigmoid()).out()


