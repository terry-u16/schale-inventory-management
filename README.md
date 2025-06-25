# シャーレの総決算with連邦生徒会 在庫管理計算機

※ English version is available [below](#overview).

## 概要

スマートフォン向けゲームアプリ「ブルーアーカイブ」におけるイベント「シャーレの総決算with連邦生徒会」のコンテンツ「在庫管理」を補助するためのツールです。

各マスにどの備品がどのくらいの確率で存在するかを計算することができます。

## 公開場所

以下のWebサイトで公開しています。

https://schale-inventory-management.terry-u16.net/

## ローカル実行方法

### 実行環境

以下の環境で動作確認しています。

- Node.js v23.9.0
- pnpm v10.11.0
- Rust（Cargo 1.85.0）
- wasm-pack 0.13.1

### 実行方法

事前にwasmのビルドが必要です。以下のコマンドを実行し、wasmをビルドしてください。

Rustのコードを変更した際には再度ビルドが必要です。

```sh
cd ./wasm
cargo install wasm-pack     # wasm-packが未インストールの場合のみ
wasm-pack build --target web --out-dir ../public/wasm
```

また初回実行時は、プロジェクトのルートディレクトリで以下のコマンドを実行して依存パッケージをインストールしてください。

```sh
pnpm install
```

その後、プロジェクトルートで以下のコマンドを実行するとローカルでサーバが立ち上がります。

```sh
pnpm dev
```

## 確率計算方法について

### 計算を行う上での仮定

確率計算は以下の仮定の下行っています。

- 備品の配置は、全ての起こりうる配置から一様ランダムに抽選される
- 備品の配置がパターン化されておらず、抽選されない配置が存在しない
- 備品の配置はマスのオープン前に全て確定しており、後から変更されない

### 計算方法

配置パターン数の計算にはDPを用いています。 `dp(c, r, i0, i1, i2, w0, w1, w2, w3, w4) := マス(r, c)まで見て、備品0, 1, 2をそれぞれi0, i1, i2個配置済みで、0, 1, 2, 3, 4行目がこの先それぞれw0, w1, w2, w3, w4マス先まで埋まっているときの場合の数` と定義して、昇順にDPテーブルを埋めることで計算を行っています。

その後、起こりうる全パターンの数が100,000通り以下の場合は全パターンを復元し、それを超える場合はランダムサンプリングを行うことで、各マスに各備品が存在する確率を求めています。ランダムサンプリングを行う際は、上記のDPテーブルを使用して、パターン数に比例した確率でランダムにバックトラックを行うことで効率的なサンプリングを行っています。

処理の詳細は `/wasm/src/solver/counter.rs` をご参照ください。

## ライセンス

MIT License

---

## Overview

This tool assists with the "Settlement Task with General Student Council" content in the event "SCHALE Settlement Task with General Student Council" of the mobile game "Blue Archive".

It calculates the probability of each item being present in each cell.

## Website

Available at:

https://schale-inventory-management.terry-u16.net/

## How to Run Locally

### Environment

Tested with the following environment:

- Node.js v23.9.0
- pnpm v10.11.0
- Rust (Cargo 1.85.0)
- wasm-pack 0.13.1

### Usage

You need to build the wasm module first. Run the following commands:

If you modify the Rust code, rebuild is required.

```sh
cd ./wasm
cargo install wasm-pack     # Only if wasm-pack is not installed
wasm-pack build --target web --out-dir ../public/wasm
```

For the first run, install dependencies in the project root:

```sh
pnpm install
```

Then, start the local server from the project root:

```sh
pnpm dev
```

## About the Probability Calculation

### Assumptions

The probability calculation is based on the following assumptions:

- Item placement is uniformly random among all possible configurations
- There are no unselectable or patterned placements
- All item placements are determined before any cell is opened and do not change afterwards

### Calculation Method

The number of placement patterns is calculated using dynamic programming (DP). Define `dp(c, r, i0, i1, i2, w0, w1, w2, w3, w4)` as the number of ways to fill up to cell (r, c), having placed i0, i1, i2 of items 0, 1, 2, and with rows 0-4 filled for w0-w4 cells ahead, and fill the DP table in ascending order.

If the total number of possible patterns is 100,000 or less, all patterns are enumerated. If it exceeds that, random sampling is performed to estimate the probability of each item in each cell. When sampling, the DP table is used to efficiently backtrack in proportion to the number of patterns.

For details, see `/wasm/src/solver/counter.rs`.

## License

MIT License
