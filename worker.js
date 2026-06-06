// Web Worker host for WebLLM. Runs model download + inference off the main
// thread so the podcast agent UI stays responsive during generation.
//
// This is a module worker (started with { type: 'module' }) and imports
// web-llm straight from the esm.run CDN, mirroring how index.html loads it —
// no bundler/build step required, so it works as-is on GitHub Pages.
import * as webllm from "https://esm.run/@mlc-ai/web-llm@0.2.84";

const handler = new webllm.WebWorkerMLCEngineHandler();

self.onmessage = (msg) => {
    handler.onmessage(msg);
};
