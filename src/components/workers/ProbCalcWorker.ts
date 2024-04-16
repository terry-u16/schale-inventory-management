import init, { solve } from '../../../public/wasm/wasm_solver';
import { type ItemAndPlacement } from '../MainArea';

let wasmInitialized = false;

self.addEventListener('message', async (e) => {
  try {
    if (!wasmInitialized) {
      await init();
      wasmInitialized = true;
    }

    const input = e.data as {
      item_and_placement: ItemAndPlacement[];
      open_map: boolean[];
    };

    const result = solve(input) as { probs: number[][]; error: string };
    self.postMessage(result);
  } catch (ex) {
    self.postMessage({ probs: null, error: ex as string });
  }
});

export default {};
