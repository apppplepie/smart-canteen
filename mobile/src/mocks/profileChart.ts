/** 个人中心 - 排队/等待趋势图假数据（暂无统计接口时使用） */
export interface ProfileChartPoint {
  time: string;
  wait: number;
  queue: number;
}

export const profileChartDataMock: ProfileChartPoint[] = [
  { time: "11:00", wait: 5, queue: 10 },
  { time: "11:30", wait: 15, queue: 35 },
  { time: "12:00", wait: 25, queue: 80 },
  { time: "12:30", wait: 20, queue: 60 },
  { time: "13:00", wait: 10, queue: 20 },
];
