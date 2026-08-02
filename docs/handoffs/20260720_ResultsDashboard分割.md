Issue #10の項目「`ResultsDashboard.tsx` の分割（グラフ種別・フィルタ・集計呼び出し単位）」を進めてください。エンジニアへのタスク割り振り前に、コンフリクトを避けるために完了させたい作業です。

## 背景
`src/app/results/ResultsDashboard.tsx` は1,199行の単一ファイルですが、中身はすでにコメントブロックで論理的に区切られています。今回はロジックを変更せず、既存の区切りに沿ってファイルを分割するだけの作業です。

## 分割方針

`src/app/results/components/` ディレクトリを新設し、以下の単位でファイルを切り出してください（現在のファイル内の行番号はおおよその目安です、実際の区切りはコメント `/* ===... */` を参照してください）。

- `designTokens.ts`（元 22〜70行付近）: `LOSS_LEGEND` / `INDUSTRY` / `INDUSTRY_LABEL` / `PRODUCTIVITY_COLOR` / `ABSENT_COLOR` / `compareTone` / `compareLabel` / `scoreBandColor` / `niceCeil` などの定数・純粋関数
- `common.tsx`（元 472〜549行付近）: `Card` / `AccentTitle` / `CardHeader` / `SelectBox` などの共通UIパーツ
- `MetricCard.tsx`（元 550〜650行付近、Card 1）: `MetricRow` / `HalfDonut`
- `DepartmentBarsCard.tsx`（元 651〜771行付近、Card 2）: `LegendAmountRow` / `HorizontalBars`
- `PainFigureCard.tsx`（元 772〜928行付近、Card 3）: `PainFigure` とホットスポット座標データ
- `DepartmentLossChart.tsx`（元 929〜1025行付近）: `StackedDepartmentChart`
- `WorkEngagementCard.tsx`（元 1026〜1199行付近）: `ScoreFace` / `WeScoreCard` / `WeCompareColumn` / `ScoreLegendChip`

`ResultsDashboard.tsx` 本体（元 75〜471行、`export default function ResultsDashboard()`）は、状態管理・データ取得（`loadData`/`useEffect`）・集計値の算出（`useMemo`群）・上記コンポーネントの組み立て（JSX）を担う「オーケストレーター」として残してください。上記の切り出したファイルから必要な関数・コンポーネントをimportする形にします。

## 注意点

- **ロジック・見た目を一切変更しないでください。** あくまでファイル分割のみが目的です。
- 分割後、`npm run lint` と `npx tsc --noEmit` を実行してエラーがないことを確認してください。
- 可能であれば、分割前後でダッシュボード画面のスクリーンショットを比較し、見た目に差分がないことを確認してください。
- 作業が終わったら、PRを作成してください（`develop`向け）。DB変更を伴わない純粋なリファクタリングですが、影響範囲が広いファイルなので、可能であればシニアエンジニア（中間さん）にもレビューを依頼してください。
- 完了したら、GitHub Issue #10の該当チェックボックスにチェックを入れてください。
