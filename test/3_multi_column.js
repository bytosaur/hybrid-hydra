// Multi‑column interference demo
// Demonstrates spatial summation across a line yields unique acoustic textures
// a capability that software 1D sampling would miss


hush()

setResolution(1920,1080)

await loadScript("https://cdn.jsdelivr.net/gh/bytosaur/hybrid-hydra@main/main.js")

await initHybridHydra()


// bascially blended to gether
cos()
.add(cos(40))
.add(cos(30))
.amp(.25)
.brightness(.5)
.mult(sigmoid())
.out()


// separate color channels
cos()
.add(cos(40).rr())
.add(cos(30).gg())
.amp(.5)
.brightness(.5)
.mult(sigmoid())
.out()

// spatially separated channels
solid()
.add(cos(40).mult(shape(4,.25,0).scrollX(0.25).pixelate(2,1) ) )
.add(cos(30).mult(shape(4,.25,0).scrollX(-0.25).pixelate(2,1) ) )
.amp(0.5)
.brightness(.5)
.mult(sigmoid())
.out()



// three‑column interference pattern
solid()
.add(cos(520/60).mask(shape(4,.25,0).scrollX(0.25).pixelate(3,1) ) )
.add(cos(300/60).mask(shape(4,.25,0).scrollX(0.00).pixelate(3,1) ) )
.add(cos(870/60).mask(shape(4,.25,0).scrollX(-0.25).pixelate(3,1) ) )
.amp(0.5)
.brightness(0.5)
.mult(sigmoid())
.out()

