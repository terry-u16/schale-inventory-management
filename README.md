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
- pnpm v12.11.2
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
pnpm install --frozen-lockfile --ignore-scripts
```

その後、プロジェクトルートで以下のコマンドを実行するとローカルでサーバが立ち上がります。

```sh
pnpm dev
```

## PRルール

`main` へのPRでは、GitHub Actions の `Pull Request Checks` が Prettier、ESLint、Stylelint を実行します。マージ前にすべての検査を通してください。fork からのPRも対象です。初回の外部コントリビューターによる実行には、メンテナーの承認が必要です。

手元では `pnpm format:check` と `pnpm lint` で同じ検査を実行できます。Prettier の指摘は `pnpm format` で修正できます。

## 確率計算方法について

### 計算を行う上での仮定

確率計算は以下の仮定の下行っています。

- 備品の配置は、全ての起こりうる配置から一様ランダムに抽選される
- 備品の配置がパターン化されておらず、抽選されない配置が存在しない
- 備品の配置はマスのオープン前に全て確定しており、後から変更されない

### 計算方法

開いたマスと発見済みの備品の位置をもとに、残りの備品を配置するパターンが何通りあるかを前後から動的計画法（DP）で数えます。

ある位置に備品を置くとき、その直前の状態に至るまでの配置数と、そこから残りの備品を置き切る方法の数を掛けると、その置き方を含む配置パターンの数が分かります。各マスについて、そのマスを対象の備品が覆う配置パターンの数を合計し、全配置パターンの数で割って確率を求めます。

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
- pnpm v12.11.2
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
pnpm install --frozen-lockfile --ignore-scripts
```

Then, start the local server from the project root:

```sh
pnpm dev
```

## Pull Request Rules

For pull requests targeting `main`, the `Pull Request Checks` job runs Prettier, ESLint, and Stylelint. All checks should pass before merging. Pull requests from forks are included. A maintainer must approve workflow runs from first-time external contributors.

Run `pnpm format:check` and `pnpm lint` to run the same checks locally. To fix Prettier issues, run `pnpm format`.

## About the Probability Calculation

### Assumptions

The probability calculation is based on the following assumptions:

- Item placement is uniformly random among all possible configurations
- There are no unselectable or patterned placements
- All item placements are determined before any cell is opened and do not change afterwards

### Calculation Method

Given the opened cells and the locations of supplies already found, the solver uses dynamic programming to count the possible arrangements of the remaining supplies.

For each placement, the solver multiplies the number of ways to reach the state just before placing the supply by the number of ways to finish the board afterward. This gives the number of arrangements that include that placement. For each cell, the solver adds up the counts for placements where a selected supply covers that cell, then divides by the total number of arrangements to get the probability.

For details, see `/wasm/src/solver/counter.rs`.

## License

MIT License
