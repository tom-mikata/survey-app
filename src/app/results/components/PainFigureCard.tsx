/* =============================================================================
 * Card 3 : PainFigure（人体アウトライン画像＋痛みヒートマップ）
 *
 *  画像アセット:
 *   /public/pain-body.jpeg に人体アウトライン画像（背面観）を配置してください。
 *   画像はアスペクト比 ≒ 0.56（幅:高さ = 568:1024）を想定しています。
 *   比率が異なる場合は下の BODY_ASPECT と painMap の位置を調整してください。
 * ========================================================================== */

// 人体アウトライン画像の幅 / 高さ。Next.js 側で /public/pain-body.jpeg を置いた
// 画像の実アスペクト比に合わせる。
const BODY_IMG_SRC = "/pain-body.jpeg";
const BODY_ASPECT = 568 / 1024; // ≒ 0.555

/**
 * 画像上でのホットスポット位置（パーセント）と表示半径（px）。
 *
 * 画像は右上に「頭部ディテール」が入る構図（568×1024）前提のため、
 * 体の正中線 x ≒ 47% に置いています。画像をトリミングして体を
 * センタリングした場合は、全体を +7 程度シフトしてください。
 *
 *   y=0 : 画像上端        y=100 : 画像下端
 *   x=0 : 画像左端        x=100 : 画像右端
 */
const PAIN_MAP: Record<string, Array<{ x: number; y: number; r: number }>> = {
  // 右上の顔面詳細図
  face: [{ x: 77.5, y: 15, r: 16 }],
  // 頭部中心（髪の生え際付近）
  head: [{ x: 47, y: 15, r: 16 }],
  // 首の後ろ
  neck: [{ x: 47, y: 25, r: 16 }],
  // 両肩（僧帽筋上部）
  shoulder: [
    { x: 37, y: 28, r: 20 },
    { x: 58, y: 28, r: 20 },
  ],
  // 肩甲骨〜背中上部
  upper_back: [{ x: 47, y: 34, r: 20 }],
  // 腰（腰椎）
  lower_back: [{ x: 47, y: 42, r: 38 }],
  // 臀部
  hip: [{ x: 47, y: 52, r: 38 }],
  // 両肘
  elbow: [
    { x: 22, y: 47, r: 18 },
    { x: 69, y: 47, r: 18 },
  ],
  // 両腕
  arm: [
    { x: 28, y: 42, r: 18 },
    { x: 66, y: 42, r: 18 },
  ],
  // 両手首
  wrist: [
    { x: 23, y: 52, r: 18 },
    { x: 72, y: 52, r: 18 },
  ],
  // 大腿（太もも）
  thigh: [
    { x: 35, y: 66, r: 22 },
    { x: 51, y: 66, r: 22 },
  ],
  // 両膝
  knee: [
    { x: 38, y: 70, r: 20 },
    { x: 56, y: 70, r: 20 },
  ],
  // ふくらはぎ
  calf: [
    { x: 35, y: 85, r: 18 },
    { x: 56, y: 85, r: 18 },
  ],
  // 両足首
  ankle: [
    { x: 36, y: 88, r: 18 },
    { x: 58, y: 88, r: 18 },
  ],
};

export function PainFigure({
  hotspots,
}: {
  hotspots: { id: string; intensity: number; count: number }[];
}) {
  const hasAny = hotspots.some((h) => h.count > 0);

  return (
    <div className="mt-4 flex flex-col items-center">
      <div
        className="relative mx-auto w-full max-w-[20rem]"
        style={{ aspectRatio: `${BODY_ASPECT}` }}
      >
        {/* 背景の人体アウトライン */}
        <img
          src={BODY_IMG_SRC}
          alt="身体の痛み部位を示す後面図"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
          draggable={false}
        />

        {/* 痛みのヒートマップ */}
        <div className="pointer-events-none absolute inset-0">
          {hotspots.map((h) => {
            const positions = PAIN_MAP[h.id];
            if (!positions || h.count === 0) return null;
            const intensity = Math.max(0.15, h.intensity);
            const coreAlpha = 0.35 + intensity * 0.45; // 0.35 - 0.80
            const midAlpha = 0.22 + intensity * 0.28; // 0.22 - 0.50
            return positions.map((pos, idx) => {
              const size = pos.r * 2;
              return (
                <span
                  key={`${h.id}-${idx}`}
                  className="absolute rounded-full mix-blend-multiply"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: size,
                    height: size,
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle,
                      rgba(220,38,38,${coreAlpha}) 0%,
                      rgba(239,68,68,${midAlpha}) 42%,
                      rgba(244,63,94,${midAlpha * 0.45}) 68%,
                      rgba(244,63,94,0) 88%)`,
                    filter: "blur(3px)",
                  }}
                  title={`${h.id}: ${h.count}件`}
                />
              );
            });
          })}
        </div>
      </div>

      {/* 強度レジェンド */}
      <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
        <span>少ない</span>
        <span
          className="inline-block h-2.5 w-28 rounded-full"
          style={{
            background:
              "linear-gradient(to right, rgba(239,68,68,0.15), rgba(239,68,68,0.45), rgba(220,38,38,0.85))",
          }}
        />
        <span>多い</span>
      </div>

      {!hasAny && (
        <p className="mt-2 text-xs text-slate-400">
          該当する痛み部位のデータがありません。
        </p>
      )}
    </div>
  );
}
