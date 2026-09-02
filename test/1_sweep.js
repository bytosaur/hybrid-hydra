// Frequency sweep test
// Validate frequency response of cos_naive and cos functions and windowing function (sigmoid) for vertical blanking compensation


hush()

setResolution(1920,1080)

await loadScript("https://cdn.jsdelivr.net/gh/bytosaur/hybrid-hydra@main/main.js")

await initHybridHydra()


// log sweep: sweep [0 - 20kHz]
// check for frequency resolution, linear frequency response and vertical blanking compensation

// measure 1: baseline
cos_naive(() => (Math.pow(10, (time / 10 % 4.3))/60.0))
	.amp(0.5)
	.brightness(0.5)
	.out()

// measure 1: vertical blanking compensation)
cos(() => (Math.pow(10, (time / 10 % 4.3))/60.0))
	.amp(0.5)
	.brightness(0.5)
	.out()

// measure 1: vertical blanking compensation + sigmoid()
cos(() => (Math.pow(10, (time / 10 % 4.3))/60.0))
	.amp(0.5)
	.brightness(0.5)
	.mult(sigmoid())
	.out()


// Cross‑talk
// Validate RGB channel separation and frequency response
// measure R and at least one of G or B

cos([
		[0, 333].smooth()
		.fast(0.1)
	])
	.color(1, 0, 0)
	.amp(0.5)
	.brightness(0.5)
	.mult(sigmoid())
	.out()