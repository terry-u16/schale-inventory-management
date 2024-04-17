import { type FC } from 'react';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

function createSingleConsumptionData(
  stage: string,
  large50: number,
  large90: number,
  large99: number,
  medium50: number,
  medium90: number,
  medium99: number,
  small50: number,
  small90: number,
  small99: number,
) {
  return {
    stage,
    large50,
    large90,
    large99,
    medium50,
    medium90,
    medium99,
    small50,
    small90,
    small99,
  };
}

const singleConsumptionData = [
  createSingleConsumptionData(
    '1周目/4周目',
    880,
    1210,
    1430,
    2310,
    2640,
    2860,
    3520,
    3850,
    3960,
  ),
  createSingleConsumptionData(
    '2周目/5周目',
    990,
    1210,
    1210,
    1980,
    2200,
    2200,
    3190,
    3410,
    3520,
  ),
  createSingleConsumptionData(
    '3周目/6周目',
    1100,
    1100,
    1210,
    2200,
    2530,
    2640,
    3520,
    3850,
    3960,
  ),
];

function createMultiConsumptionData(
  stage: string,
  large50: number,
  large90: number,
  large99: number,
  medium50: number,
  medium90: number,
  medium99: number,
  small50: number,
  small90: number,
  small99: number,
) {
  return {
    stage,
    large50,
    large90,
    large99,
    medium50,
    medium90,
    medium99,
    small50,
    small90,
    small99,
  };
}

const multiConsumptionData = [
  createMultiConsumptionData(
    '1～6周目',
    6050,
    6490,
    6930,
    13200,
    13750,
    14190,
    20460,
    21120,
    21670,
  ),
  createMultiConsumptionData(
    '2～6周目',
    5060,
    5500,
    5830,
    10780,
    11330,
    11770,
    16940,
    17490,
    17930,
  ),
  createMultiConsumptionData(
    '3～6周目',
    4070,
    4510,
    4730,
    8800,
    9350,
    9680,
    13750,
    14300,
    14740,
  ),
  createMultiConsumptionData(
    '4～6周目',
    2970,
    3410,
    3630,
    6600,
    7040,
    7370,
    10230,
    10670,
    11000,
  ),
  createMultiConsumptionData(
    '5～6周目',
    2090,
    2310,
    2420,
    4290,
    4510,
    4730,
    6710,
    7040,
    7260,
  ),
  createMultiConsumptionData(
    '6～6周目',
    1100,
    1100,
    1210,
    2200,
    2530,
    2640,
    3520,
    3850,
    3960,
  ),
];

const Note: FC = () => {
  return (
    <>
      <Paper>
        <Box p={2}>
          <Container maxWidth="md">
            <Stack spacing={6} my={4} sx={{ textAlign: 'start' }}>
              <Stack spacing={1}>
                <Typography variant="h4">これは何？</Typography>
                <Typography variant="body1">
                  スマートフォン向けゲームアプリ「
                  <a
                    href="https://bluearchive.jp/"
                    target="_brank"
                    rel="noreferrer"
                  >
                    ブルーアーカイブ
                  </a>
                  」におけるイベント「シャーレの総決算with連邦生徒会」のコンテンツ「在庫管理」を補助するためのツールです。
                </Typography>
                <Typography variant="body1">
                  各マスにどの備品がどのくらいの確率で存在するかを計算することができます。
                </Typography>
              </Stack>

              <Stack spacing={3}>
                <Typography variant="h4">使い方</Typography>
                <Stack spacing={1}>
                  <Typography variant="h5">1. 初期設定</Typography>
                  <Typography variant="body1">
                    「備品プリセット」から何周目のデータを読み込むかを選択し「適用」ボタンを押すと、その周回における備品の高さ・幅・個数が読み込まれます。
                  </Typography>
                  <Typography variant="body1">
                    プリセットデータが存在しない場合、自分で備品の高さ・幅・個数を設定することもできます。
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">2. 初期確率の計算</Typography>
                  <Typography variant="body1">
                    画面中央部の「実行」ボタンを押すと、1マスもオープンしていない状態において、各マスに何%の確率で備品が存在するかを計算します（環境によっては計算に数秒かかります）。備品が存在する確率が最大のマスは強調表示されます。
                  </Typography>
                  <Typography variant="body1">
                    「実行」ボタンの横の「1」「2」「3」のボタンを押すと、備品ごとに確率を表示するかどうかを切り替えることができます。例えば「1」「2」がONで「3」がOFFの場合、備品1か備品2のどちらかを引き当てる確率が表示されます。小さい備品を無視して大きい備品を引きたい時に便利です。
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">3. 盤面の更新と再計算</Typography>
                  <Typography variant="body1">
                    各マスをクリックすると、マスのオープン・クローズを切り替えることができます。
                  </Typography>
                  <Typography variant="body1">
                    備品情報の下部にある「追加」ボタンを押すと、発見した備品の位置を設定することができます。位置の移動と回転を指定して、ゲーム内で発見した備品の位置と一致するように設定してください。間違えて追加ボタンを押してしまった場合は、ゴミ箱アイコンのボタンを押すと削除することができます。
                  </Typography>
                  <Typography variant="body1">
                    盤面の更新が終わったら、再度「実行」ボタンを押すことで確率が再計算されます。自動では再計算されませんのでご注意ください。
                  </Typography>
                </Stack>
              </Stack>

              <Stack spacing={3}>
                <Stack spacing={1}>
                  <Typography variant="h4">よくある質問</Typography>
                  <Typography variant="h5">
                    スマートフォンからだと見づらい！
                  </Typography>
                  <Typography variant="body1">
                    それなりに重い計算を行うこと、ブルーアーカイブを起動しながらの使用を想定していることから、スマートフォンからの利用は非推奨としています。PCからアクセスしてください。
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">
                    「備品が重なっています」というエラーが出た！
                  </Typography>
                  <Typography variant="body1">
                    ゲーム内で備品が重なって出てくることはないため、そのような配置には制限をかけています。エラーメッセージ中にどの位置で備品が重なっているかが表示されているので、それに従って入力を修正してください。
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">
                    「条件を満たす配置が存在しません」というエラーが出た！
                  </Typography>
                  <Typography variant="body1">
                    どのように配置しても矛盾が生じてしまい、条件を満たす配置が一つも存在しない状態です。入力が間違っていないかご確認ください。
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">
                    よく分からない内容のエラーが出た！
                  </Typography>
                  <Typography variant="body1">
                    バグかもしれません。
                    <a
                      href="https://twitter.com/terry_u16"
                      target="_brank"
                      rel="noreferrer"
                    >
                      開発者
                    </a>
                    にお問い合わせください。
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">盤面をリセットしたい！</Typography>
                  <Typography variant="body1">
                    備品プリセットを読み込み直すか、ページをリロードすると盤面がリセットされます。逆に、リロードすると作業中の内容が消えてしまうのでご注意ください。
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">
                    実行ボタンを押しても確率が表示されない！
                  </Typography>
                  <Typography variant="body1">
                    お使いの端末やブラウザによっては、確率計算に時間がかかる可能性があるほか、ブラウザによっては機能に対応していない可能性があります（動作確認はGoogle
                    Chromeにて実行しております）。また、確率表示ボタンが全てOFFになっていないかもご確認ください。
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">
                    実行ボタンを押すたびに確率が変わるんだけど？
                  </Typography>
                  <Typography variant="body1">
                    あり得る全パターンの配置を計算すると時間がかかりすぎるため、一部の配置をランダムにサンプリングすることで計算時間を削減しています。そのため、実行のたびに表示される確率が変化します。（余談ですが、1周目の初期状態における配置パターン数は930億通りほど存在します。）
                  </Typography>
                  <Typography variant="body1">
                    なお、あり得る全パターンが100,000通り以下の場合は全パターンを計算した厳密な確率が表示されます。
                    <s>かんぺき～</s>
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">
                    表示された確率は絶対に正しいの？
                  </Typography>
                  <Typography variant="body1">
                    正しくない可能性もあります。上記のように配置をランダムにサンプリングしているほか、確率計算を行う上での前提が異なっている可能性もあります。以下の仮定の下で計算を行っているので、妥当性判定の参考にしてください。
                  </Typography>
                  <ul>
                    <li>
                      備品の配置は、全ての起こりうる配置から一様ランダムに抽選される（ゲーム内で使用されている初期盤面の生成アルゴリズムによっては、
                      <a
                        href="https://twitter.com/chokudai/status/1778760450215383085"
                        target="_brank"
                        rel="noreferrer"
                      >
                        全ての配置の確率が均等ではなくなる
                      </a>
                      可能性があります。）
                    </li>
                    <li>
                      備品の配置がパターン化されておらず、抽選されない配置が存在しない
                    </li>
                    <li>
                      備品の配置はマスのオープン前に全て確定しており、後から変更されない
                    </li>
                  </ul>
                  <Typography variant="caption">
                    バグってたらごめんなさい……。
                  </Typography>
                </Stack>

                <Stack>
                  <Typography variant="h5">
                    備品の回収にはどのくらい電卓が必要？
                  </Typography>
                  <Typography variant="body1">
                    正確な値は出せませんが、ある戦略にしたがってマスを開けていったときの期待される電卓消費量をシミュレーションしてみましょう。上記前提条件のもとに試算していますので、前提次第で異なった値になる可能性もあります。
                  </Typography>
                  <Typography variant="body1">
                    「オープンしていないマスのうち、狙っている備品の存在する確率が最大のマスを開ける（そのようなマスが複数あるときは一様ランダムに選ぶ）」という戦略を取ることを考えます。狙っている備品以外は完全に無視する（一部が見えたとしても放置する）ことに注意してください。
                  </Typography>
                  <Typography variant="body1">
                    このとき、各周回において「大きな備品のみ狙う」「大・中の備品のみ狙う」「大・中・小全ての備品を狙う」という3つの方針を考えたときに、「50%の確率で」「90%の確率で」「99%の確率で」電卓消費量がこの数に収まるという値をシミュレーション（試行回数1000回）で求めたところ、以下のようになりました。
                  </Typography>
                  <Box my={2}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell align="center"></TableCell>
                            <TableCell colSpan={3} align="center">
                              大
                            </TableCell>
                            <TableCell colSpan={3} align="center">
                              大・中
                            </TableCell>
                            <TableCell colSpan={3} align="center">
                              大・中・小
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align="center"></TableCell>
                            <TableCell align="right">50%</TableCell>
                            <TableCell align="right">90%</TableCell>
                            <TableCell align="right">99%</TableCell>
                            <TableCell align="right">50%</TableCell>
                            <TableCell align="right">90%</TableCell>
                            <TableCell align="right">99%</TableCell>
                            <TableCell align="right">50%</TableCell>
                            <TableCell align="right">90%</TableCell>
                            <TableCell align="right">99%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {singleConsumptionData.map((row) => {
                            return (
                              <TableRow key={`row-single-${row.stage}`}>
                                <TableCell
                                  key={`cell-single-stage-${row.stage}`}
                                >
                                  {row.stage}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-single-large50-${row.stage}`}
                                >
                                  {row.large50}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-single-large90-${row.stage}`}
                                >
                                  {row.large90}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-single-large99-${row.stage}`}
                                >
                                  {row.large99}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-single-medium50-${row.stage}`}
                                >
                                  {row.medium50}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-single-medium90-${row.stage}`}
                                >
                                  {row.medium90}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-single-medium99-${row.stage}`}
                                >
                                  {row.medium99}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-single-small50-${row.stage}`}
                                >
                                  {row.small50}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-single-small90-${row.stage}`}
                                >
                                  {row.small90}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-single-small99-${row.stage}`}
                                >
                                  {row.small99}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Typography variant="body1">
                    また、上記のシミュレーション結果から「X周目開始から6周目完了までの電卓消費量がこの値に収まる数」を求めたところ、以下のようになりました。上の表の単純な和にならないことに注意してください。
                  </Typography>

                  <Box my={2}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell align="center"></TableCell>
                            <TableCell colSpan={3} align="center">
                              大
                            </TableCell>
                            <TableCell colSpan={3} align="center">
                              大・中
                            </TableCell>
                            <TableCell colSpan={3} align="center">
                              大・中・小
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align="center"></TableCell>
                            <TableCell align="right">50%</TableCell>
                            <TableCell align="right">90%</TableCell>
                            <TableCell align="right">99%</TableCell>
                            <TableCell align="right">50%</TableCell>
                            <TableCell align="right">90%</TableCell>
                            <TableCell align="right">99%</TableCell>
                            <TableCell align="right">50%</TableCell>
                            <TableCell align="right">90%</TableCell>
                            <TableCell align="right">99%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {multiConsumptionData.map((row) => {
                            return (
                              <TableRow key={`row-multi-${row.stage}`}>
                                <TableCell
                                  key={`cell-multi-stage-${row.stage}`}
                                >
                                  {row.stage}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-multi-large50-${row.stage}`}
                                >
                                  {row.large50}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-multi-large90-${row.stage}`}
                                >
                                  {row.large90}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-multi-large99-${row.stage}`}
                                >
                                  {row.large99}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-multi-medium50-${row.stage}`}
                                >
                                  {row.medium50}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-multi-medium90-${row.stage}`}
                                >
                                  {row.medium90}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-multi-medium99-${row.stage}`}
                                >
                                  {row.medium99}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-multi-small50-${row.stage}`}
                                >
                                  {row.small50}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-multi-small90-${row.stage}`}
                                >
                                  {row.small90}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  key={`cell-multi-small99-${row.stage}`}
                                >
                                  {row.small99}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Typography variant="body1">
                    上記はあくまで上記の前提のもとでシミュレーションにより試算された結果であり、保証された値ではないことにご注意ください。
                    <s>
                      99%でさえ信用できないことはベテランの先生方ならご存じかと思います。
                    </s>
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="h5">
                    確率が最大のマスを開けていけば電卓消費量の期待値が最小になるの？
                  </Typography>
                  <Typography variant="body1">
                    比較的筋の良い戦略とは思われますが、最適な行動という保証はありません。
                  </Typography>
                  <Typography variant="body1">
                    なお、似た題材の問題として、競技プログラミングサイト
                    <a
                      href="https://atcoder.jp/"
                      target="_brank"
                      rel="noreferrer"
                    >
                      AtCoder
                    </a>
                    上で行われた
                    <a
                      href="https://atcoder.jp/contests/ahc030"
                      target="_brank"
                      rel="noreferrer"
                    >
                      AtCoder Heuristic Contest 030
                    </a>
                    がありますので、ご興味のある方は挑戦してみてください。
                  </Typography>

                  <Typography variant="caption">
                    ちなみに私はその優勝者です。
                  </Typography>
                </Stack>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h4">開発者について</Typography>
                <Typography variant="body1">
                  このページは
                  <a
                    href="https://twitter.com/terry_u16"
                    target="_brank"
                    rel="noreferrer"
                  >
                    terry_u16
                  </a>
                  が作成しました。
                </Typography>
                <Typography variant="body1">
                  GitHubリポジトリは
                  <a
                    href="https://github.com/terry-u16/schale-inventory-management"
                    target="_brank"
                    rel="noreferrer"
                  >
                    こちら
                  </a>
                  です。計算が間違っていそう・こういった機能が欲しいなど、バグ報告やリクエストはそちらにお願いします。
                </Typography>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Paper>
    </>
  );
};

export default Note;
