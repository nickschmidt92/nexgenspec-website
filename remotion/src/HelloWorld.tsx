import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface HelloWorldProps {
  titleText: string;
  titleColor: string;
}

export const HelloWorld: React.FC<HelloWorldProps> = ({ titleText, titleColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 30], [0.8, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1a2e",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          color: titleColor,
          fontSize: 80,
          fontWeight: "bold",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        {titleText}
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 24,
          fontFamily: "sans-serif",
          marginTop: 20,
          opacity,
        }}
      >
        Frame {frame} / {durationInFrames}
      </div>
    </AbsoluteFill>
  );
};
