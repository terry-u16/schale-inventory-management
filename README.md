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

盤面を列ごとに上から走査します。DPの状態には、現在のマス、各備品の残り個数、各行が先の何列まで埋まっているかを持ちます。備品の幅は最大4なので、各行の埋まり具合は0〜3の2ビット、5行で計10ビットに収まります。

各状態から全備品を置き切る方法を後ろ向きDPで数えます。次に先頭から走査し、備品を置く遷移ごとに「遷移元に到達する方法の数 × 遷移先から置き切る方法の数」を集計します。各マスを対象の備品が覆う配置数を全配置数で割ると、そのマスの確率が得られます。配置数の計算には `u64` を使用しており、オーバーフローする場合は正しい確率を保証できません。

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

The solver scans each column from top to bottom. A DP state records the current cell, the number of items left in each group, and how many columns ahead are already occupied in each row. Since items are at most four cells wide, two bits per row encode the occupied width, for a total of ten bits.

A backward pass counts the ways to complete each state. For each transition that places an item, a forward pass multiplies the number of ways to reach its source by the number of ways to complete its destination. Summing these counts for placements covering a cell and dividing by the total number of configurations gives its occupancy probability. Counts use `u64`, so overflow can affect the result.

For details, see `/wasm/src/solver/counter.rs`.

## License

MIT License
