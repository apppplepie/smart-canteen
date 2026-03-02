/** 提供给 AI 助手的今日菜单上下文（用于 system prompt） */
export const aiAssistantMenuContext = `
今日菜单推荐上下文：
一食堂：
- 招牌红烧肉 (18元, 推荐指数 4.8)
- 清炒时蔬 (8元, 推荐指数 4.5)
- 糖醋排骨 (16元, 推荐指数 4.7)
二食堂：
- 脆皮烤鸭 (22元, 推荐指数 4.9)
- 麻婆豆腐 (10元, 推荐指数 4.6)
- 番茄炒蛋 (9元, 推荐指数 4.5)
特色小吃：
- 兰州拉面 (12元)
- 重庆小面 (10元)
- 煎饼果子 (8元)
`;

/** AI 助手首次打开时的欢迎语 */
export const aiAssistantInitialMessage = {
  role: 'ai' as const,
  text: '你好！我是你的专属食堂AI助手。想知道今天有什么好吃的吗？',
};
