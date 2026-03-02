export const barData = [
  { name: '周一', food: 12, service: 5, env: 3, other: 1 },
  { name: '周二', food: 15, service: 8, env: 4, other: 2 },
  { name: '周三', food: 10, service: 4, env: 2, other: 0 },
  { name: '周四', food: 18, service: 6, env: 5, other: 3 },
  { name: '周五', food: 22, service: 10, env: 6, other: 2 },
  { name: '周六', food: 8, service: 3, env: 1, other: 1 },
  { name: '周日', food: 5, service: 2, env: 1, other: 0 },
];

export const latestFeedbacks = [
  {
    id: 1,
    type: '菜品建议',
    time: '2026-02-26 12:30',
    content: '希望第二食堂能增加一些低脂低卡的健康餐选项，现在的菜品稍微有点油腻。',
    reply: '感谢您的建议！我们已经收到您的反馈，下周起将在第二食堂增设“健康轻食专窗”，欢迎届时品尝。',
    status: 'replied',
    theme: 'cyan'
  },
  {
    id: 2,
    type: '环境卫生',
    time: '2026-02-26 10:15',
    content: '第一食堂的空调温度太低了，中午吃饭的时候感觉有点冷，希望能调高一点。',
    reply: '收到反馈，已通知后勤部门将一食堂空调温度统一上调至26度，给您带来不便敬请谅解。',
    status: 'replied',
    theme: 'emerald'
  },
  {
    id: 3,
    type: '服务态度',
    time: '2026-02-26 08:45',
    content: '早餐的豆浆有时候不够热，希望能改善一下保温措施。',
    reply: null,
    status: 'pending',
    theme: 'violet'
  },
  {
    id: 4,
    type: '其他',
    time: '2026-02-25 18:20',
    content: '三食堂的红烧肉非常好吃！希望能多出一些类似的硬菜。',
    reply: '感谢您的认可！厨师长表示很开心，我们会继续保持并推出更多美味佳肴。',
    status: 'replied',
    theme: 'amber'
  }
];
