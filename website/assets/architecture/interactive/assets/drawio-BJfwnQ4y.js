import { t as e } from './main-DxQ9nvZ6.js';
var t = { default: async () => await e(() => import(`./drawio-C1a_4noq.js`), [], import.meta.url) };
async function n(e) {
  let n = t[e];
  if (!n) {
    let n = Object.keys(t);
    throw (
      console.error(`Unknown projectId: ` + e + ` (available: ` + n + `)`),
      Error(`Project does not enable drawio export: ` + e)
    );
  }
  return await n();
}
export { n as loadDrawioSources };
