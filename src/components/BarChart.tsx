import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';
import { useThemeContext } from '@theme/theme.context';

export interface BarChartDatum {
  label: string;
  value: number;
  maxValue: number;
  isOver: boolean;
}

interface Props {
  data: BarChartDatum[];
  height?: number;
  goalLineValue?: number;
}

const BAR_WIDTH = 28;
const BAR_GAP = 12;
const LABEL_HEIGHT = 30;
const TOP_PADDING = 24;
const BOTTOM_PADDING = 8;

export default function BarChart({ data, height = 180, goalLineValue }: Props) {
  const { theme } = useThemeContext();
  const styles = useTheme(themeStyles);
  if (data.length === 0) return null;

  const chartWidth = data.length * (BAR_WIDTH + BAR_GAP) + BAR_GAP;
  const chartHeight = height - LABEL_HEIGHT - TOP_PADDING - BOTTOM_PADDING;
  const globalMax = Math.max(
    ...data.map((d) => d.maxValue),
    ...data.map((d) => d.value),
    1,
  );

  const scaleY = (v: number) => (v / globalMax) * chartHeight;

  const goalLineY =
    goalLineValue != null
      ? TOP_PADDING + chartHeight - scaleY(goalLineValue)
      : null;

  return (
    <View style={styles.container}>
      <Svg
        width={chartWidth}
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
      >
        {/* Goal line */}
        {goalLineY != null && (
          <>
            <Line
              x1={0}
              y1={goalLineY}
              x2={chartWidth}
              y2={goalLineY}
              stroke={theme.color.warningColor}
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            <SvgText
              x={chartWidth - 4}
              y={goalLineY - 4}
              fontSize={10}
              fill={theme.color.warningColor}
              textAnchor="end"
            >
              {goalLineValue}
            </SvgText>
          </>
        )}

        {/* Baseline */}
        <Line
          x1={0}
          y1={TOP_PADDING + chartHeight}
          x2={chartWidth}
          y2={TOP_PADDING + chartHeight}
          stroke={theme.color.border}
          strokeWidth={1}
        />

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = Math.max(scaleY(d.value), 2);
          const x = BAR_GAP + i * (BAR_WIDTH + BAR_GAP);
          const y = TOP_PADDING + chartHeight - barHeight;
          const color = d.isOver ? theme.color.errorDark : theme.color.primary;

          return (
            <React.Fragment key={d.label}>
              <Rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                rx={4}
                fill={color}
              />
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={y - 6}
                fontSize={10}
                fill={theme.color.subText}
                textAnchor="middle"
              >
                {d.value}
              </SvgText>
              <SvgText
                x={x + BAR_WIDTH / 2}
                y={TOP_PADDING + chartHeight + 16}
                fontSize={10}
                fill={theme.color.placeholder}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const themeStyles = (_theme: ITheme) => {
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
  });
  return styles;
};
