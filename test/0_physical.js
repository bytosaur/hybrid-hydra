// physical signal test

hush()

setResolution(1920,1080)

await loadScript("https://cdn.jsdelivr.net/gh/bytosaur/hybrid-hydra@main/main.js")

await initHybridHydra()


// measure 1: 240HZ
cos_naive(4).amp(0.5).brightness(0.5).out()

// measure 1: 240Hz (vertical blanking compensation
cos(4).amp(0.5).brightness(0.5).out()

// measure 1: 240Hz (vertical blanking compensation
cos(4).amp(0.5).brightness(0.5).mult(sigmoid()).out()


