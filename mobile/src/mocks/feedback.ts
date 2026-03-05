/** 问题反馈 - 历史记录假数据 */
export interface FeedbackHistoryMock {
  id: number;
  type: string;
  content: string;
  status: string;
  time: string;
  reply?: string;
}

export const feedbackHistoryMock: FeedbackHistoryMock[] = [
  {
    id: 1,
    type: "环境卫生",
    content: "二楼靠窗的桌子有些油腻，希望能加强清理频率。",
    status: "已解决",
    time: "昨天 12:30",
    reply: "感谢您的反馈，我们已安排保洁人员增加该区域的清洁频次。",
  },
  {
    id: 2,
    type: "菜品质量",
    content: "今天中午一楼的红烧肉有点咸了。",
    status: "处理中",
    time: "今天 13:15",
    reply: "已通知后厨主管，我们会注意调整口味。",
  },
];
