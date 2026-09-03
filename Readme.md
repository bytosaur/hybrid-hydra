# Hybrid Hydra: audio-visual alignment with mixed signals [ICLC2027]

This repository includes the source code for the framework, scripts for plots,  example code and audio-visual recordings to accompany the paper.  




![Mono Demo](https://github.com/user-attachments/assets/8529d29c-72fd-4221-a24d-f943e70ab431)



## Quick Start

- Build the [VGA to Minijack converter](https://theblacksea.space/code-circuits/v2a-amp/) ==> [github](https://github.com/eternalmachine/VGA-Audio-Breakout)
- Go Fullscreen
- hide code on the VGA signal (overlay code for performances)
- check out the sippets in `./test` and `./examples`


## Physical Signal Integrity
![](images/combined_grid.png)
Four oscilloscope screenshots put together for comparison. Display output is a 240Hz cosine wave signal along the
vertical axis. (a) VGA R-Channel (yellow) & audio breakout (blue). (b) VGA R-Channel (same as before) (c) VGA R-Channel
with zero-padding compensation (d) VGA R-Channel with zero-padding compensation and sigmoid windowing


## Usage

### Simple modulated sine wave example
```js

await loadScript("https://cdn.jsdelivr.net/gh/bytosaur/hybrid-hydra@main/main.js")

await initHybridHydra()

cos(10)
.modulate(cos(2))
.amp(0.5)
.brightness(.5)
.out()
```

### Simple sequenced Kick example
```js

await loadScript("https://cdn.jsdelivr.net/gh/bytosaur/hybrid-hydra@main/main.js")

await initHybridHydra()

// mininotation pattern with attack, minimum note length and decay
t1 = track("<1 0 [1 0 1] 0>", 0, 0, 0.3)

// kick drum op
acht(t1)
.out()
```


## Distributed Editor Architecture
You can use our presented distributed editor by running the following steps:


### Node WebSocket Server
We have to serve a WebSocket Server that connects the individual clients with each other. 

__Note:__ This requires Node to be installed

#### Installation
```sh
cd editor
npm install
```

#### Start the Server
```sh
cd editor
npm start
```

### Client & Receiver
We also need to run an HTTP Server to that serves the client and receiver editors. You can host a simple server through python, for example:

```sh
python3 -m http.server
```


#### Usage
Open a browser to see the editor, for example, `http://127.0.0.1:5500/editor-client.html` and `http://127.0.0.1:5500/editor-receiver.html`.

The receiver will follow the commands send by the client. Use the following commands to execute code on the client:

* Ctrl/Cmd + Return: Execute code block
* Ctrl/Cmd + H: Toggle Hydra code
* Ctrl/Cmd + F: Toggle fullscreen

#### Configuration
Both `editor-client.html` and `editor-receiver.html` share the same code. However their config varies. If needed adjust it to your needs:

```js

const config = {
    panels: 1,
    executeLocally: true, // Execute code locally when Ctrl/Cmd+Enter is pressed
    sync: {
        enabled: true, // Enable/disable WebSocket connection entirely
        wsUrl: "ws://localhost:8080", // WebSocket server URL
        room: "default-room", // Room/session identifier
        sendChanges: true, // Send editor changes
        receiveChanges: false, // Receive editor changes
        sendExecutions: true, // Send code executions
        receiveExecutions: false, // Receive code executions
    },
};

```
