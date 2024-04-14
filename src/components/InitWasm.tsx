import type { FC } from 'react';
import { useState, useEffect } from 'react';
import init from '../../public/wasm/wasm_solver';
import MainArea from './MainArea';

const InitWasm: FC = () => {
  const [wasmInitialized, setWasmInitialized] = useState(false);

  useEffect(() => {
    const initFunc = async () => {
      await init();
      setWasmInitialized(true);
    };
    initFunc().catch((e) => {
      console.log(e);
    });
  }, []);

  return wasmInitialized ? <MainArea /> : <></>;
};

export default InitWasm;
