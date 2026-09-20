# UXトライアル M番号マップ / UX 试用 M 号映射表

機能と「コード上の所在（ファイルと範囲）」の対応表。
履歴は squash されているため、機能の取り出し・除去はコミット単位ではなく
この表のコード範囲を基準に行う。**どれかの機能を取り除きたい場合は、
表の「場所」の範囲をそのまま削除すればよい**（依存関係は文末を参照）。
功能与「代码所在（文件与范围）」的对应表。历史已 squash，功能提取/移除
以本表代码范围为准；想去掉某个功能时，直接删除表中「场所」范围即可（依赖关系见文末）。

## 機能一覧 / 功能一览

| M番号 | 機能 / 功能 | 場所（ファイルとコード範囲）/ 场所（文件与代码范围） |
| --- | --- | --- |
| M1 | スマート配置（クリック配置・回転の最寄り配置・配置モードの落下点プレビュー）/ 智能放置（点击放置・旋转就近落位・放置模式落点预览） | `ItemPane.tsx`: `BOARD_ROWS/BOARD_COLS`、`coversOpenedCells`、`overlapsOthers`、`isValidAnchor`、`findSmartPlacement`（回転ユーティリティの直後のブロック一式）/ 旋转工具函数后的整块；`MainArea.tsx`: `onAddPlacedItem`、`onRotatePlacedItem`、`applyPlacementChange`；`Board.tsx`: 配置モードのホバー虚影（`selectingPlacedItem` に対する `findSmartPlacement` 呼び出しと虚影描画）/ 放置模式悬停虚影段；`PlaceSelectHelper.tsx`: 盤面クリック判定の緩和（`row>=1 && col>=1` のみ）/ 仅放行盘面内点击 |
| M2 | 盤面ジェスチャー（ドラッグ移動・タップ回転・ダブルタップ削除・右クリック削除/開閉）/ 盘面手势（拖动・单击旋转・双击删除・右键删除/开闭） | `Board.tsx`: `DRAG_THRESHOLD_PX`、`DOUBLE_TAP_MS`、`BoardRect`、`DragState`、`DragGhost`、`clamp`、`cellFromRect/cellFromEvent`、`itemAt`、`onPointerDown/onPointerMove/onPointerUp/onClickCapture/onContextMenu`、`dragRef/dragGhost/suppressClickRef/lastTapRef`、`#board-container` の `touchAction` と各ハンドラ属性；`PlacedItemSquare.tsx`: `invalid` プロップ（赤破線）/ 红虚线无效样式 |
| M3 | 数値入力スピンボックス（1〜4 / 0〜7、ホイール・↑↓対応）/ 数字输入 | `ItemPane.tsx`: `clampInt`、`NumField`（コンポーネント全体）、`commitHeight/commitWidth/commitCount` |
| M4 | サイズのお気に入り / 尺寸收藏 | `ItemPane.tsx`: `SizeFavorite`、`FAVORITES_KEY`、`loadFavorites/saveFavorites`、`favoriteSizeKey/sortFavorites`、`addFavorite/removeFavorite/applyFavorite`、お気に入りChip列のJSX / 收藏 Chip 的 JSX |
| M5 | ヒートマップ正規化（min-max＋下限20%、トグル）/ 热力图归一化 | `Board.tsx`: `minProb/rangeMax` 計算と `scaleProb`；`Cover.tsx`: `Cover.colorValue` への変更；`ControlPane.tsx`: normalize トグル（`ExposureIcon`）；`MainArea.tsx`: `probScale`（localStorage 永続化） |
| M6 | 厳密DP（サンプリング廃止）/ 精确DP | `wasm/src/solver/exact.rs` 全体；`wasm/src/lib.rs`: `solve_inner` の呼び出し1行とコメント；`wasm/src/solver.rs`: `pub mod exact;`。`counter.rs` は未変更で残置 / counter.rs 未动保留 |
| M7 | 自動再計算（debounce 50ms・run_id で古い結果を破棄）/ 自动重算 | `MainArea.tsx`: `inputKey/inputItemsKey/probsFresh`、`runIdRef`、自動再計算の `useEffect`、worker `onmessage`（run_id 照合）；`workers/ProbCalcWorker.ts`（`run_id` の透過） |
| M8 | i18n 追加キー（ja・zh-CNのみ。en/ko は ja フォールバック）/ 新增翻译键 | `public/locales/{ja,zh-CN}/{ControlPane,ItemPane,MainArea}.json` の追加キーのみ / 仅新增键 |
| M9 | カード/2カラムレイアウト・可変盤面 / 卡片与两栏布局・流式盘面 | `ItemPane.tsx`: `ShapePreview` とカードの grid 構造（`px/py/gridTemplateColumns="auto auto"` のJSX全体）；`MainArea.tsx`: 2トラック grid（`minmax(520px,1fr) auto`）のJSX；`App.tsx`: `maxWidth:1600` のBox；`Board.css`: `aspect-ratio` 等の可変化 |
| M10 | 再計算の高速化（worker 常駐）/ 计算提速（worker 常驻） | `MainArea.tsx`: worker を `workerResetCnt` でのみ再生成する `useEffect`（M7 と同居 / 与 M7 同一段） |
| M11 | 手動「実行」ボタンの廃止 / 移除运行按钮 | `ControlPane.tsx`: execute 系を削除した差分；`MainArea.tsx`: `isRunning/onExecute` を削除した差分（grid 列定義の変更を含む） |
| M12 | ジェスチャーはマスを開閉しない（配置時の自動開封も廃止）/ 手势不开闭格子（含取消放置自动开格） | `MainArea.tsx`: `applyPlacementChange/onRemovePlacedItem`（`openMap` を触らないこと）、`onAddPlacedItem`（自動開封なし）；上流の自動開封ブロックの削除差分 |
| M13 | 備品色块（最前面描画・外周強調・番号札）/ 道具色块 | `PlacedItemSquare.tsx` 全体（`styleGenerator`、`label` バッジ） |
| M14 | 最高確率ハイライト（覆い・開き済みを除き表示中データから即時計算）/ 最佳格高亮 | `Board.tsx`: `covered` Set、`bestProb` 計算、`covers` の `isBest`；`Cover.tsx`: `BEST_BORDER` と `isBest` 枠 |
| M15 | 警告・スクロール安定・言語メニュー修正 / 警告・滚动条稳定・语言菜单修复 | `MainArea.tsx`: `noValidConfig` state と `Alert`；`index.css`: `html{overflow-y:scroll}` と Vite テンプレ削除部；`Header.tsx`: Menu の `disableScrollLock`＋右アンカー；`ControlPane.tsx`: Select の `MenuProps` |

## 依存関係 / 依赖关系

- M7（自動再計算）と M10（高速化）は M6（厳密DP）の速さに依存する。M6 を外す場合は上流のサンプリング＋実行ボタン構成に戻すことになる / M7/M10 依赖 M6 的速度，去掉 M6 时需回到上游「抽样+运行按钮」结构。
- M1/M2/M12 は `Board.tsx` の同じハンドラ群を共有する。ドラッグだけ（M2）を取り上げる場合は M1 のホバー虚影部分を外せば独立する / M1/M2/M12 共享 Board 手势代码，只取拖动时可剥离 M1 的悬停虚影段。
- M5 は上流の `isMaxProbs`（最大確率フラグを worker が計算する方式）を廃止して表示側計算に統一している。外す場合は `Board.tsx` の `maxProb` 除算に戻すだけでよい / M5 取消了上游 isMaxProbs 机制，回退只需还原 maxProb 除法。
- M14 の「覆いの下を除外」は M1 の備品カバー情報（`covered` Set）と同居 / M14 的遮挡排除与 M1 的 covered 集合同段。
