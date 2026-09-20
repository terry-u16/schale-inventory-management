import init, { solve } from '../../../public/wasm/wasm_solver';
import { type ItemAndPlacement } from '../MainArea';

let wasmInitialized = false;

self.addEventListener('message', async (e) => {
  // run_id は呼び出し元の世代管理用。そのまま結果に付けて返す
  const runId = (e.data as { run_id?: number }).run_id ?? 0;

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
    self.postMessage({ ...result, run_id: runId });
  } catch (ex) {
    const error = ex instanceof Error ? ex.message : String(ex);
    self.postMessage({ probs: null, error, run_id: runId });
  }
});

export default {};
