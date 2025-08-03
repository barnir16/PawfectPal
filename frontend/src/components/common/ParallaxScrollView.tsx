import React, { useState, useEffect, useRef } from "react";

const HEADER_HEIGHT = 250;

type Props = {
  headerImage: React.ReactNode;
  headerBackgroundColor: { dark: string; light: string };
  colorScheme: "light" | "dark";
  children: React.ReactNode;
};

export function ParallaxScrollView({
  headerImage,
  headerBackgroundColor,
  colorScheme,
  children,
}: Props) {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollY(containerRef.current.scrollTop);
    }
  };

  const translateY = Math.min(
    Math.max(-HEADER_HEIGHT / 2, -scrollY / 2),
    HEADER_HEIGHT * 0.75
  );
  const scale = scrollY < 0 ? 2 : 1;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: headerBackgroundColor[colorScheme],
      }}
    >
      <div
        style={{
          height: HEADER_HEIGHT,
          overflow: "hidden",
          transform: `translateY(${translateY}px) scale(${scale})`,
          transition: "transform 0.1s linear",
        }}
      >
        {headerImage}
      </div>
      <div style={{ padding: 32 }}>{children}</div>
    </div>
  );
}
