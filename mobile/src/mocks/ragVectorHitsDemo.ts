import type { PostVectorSearchHit } from "../api/postVectorSearch";

/**
 * 帖子向量检索失败、超时、空结果或未配置后端时的前端兜底数据（答辩演示用，非真实召回）。
 * postId 使用 99xxx 段，避免与常见自增主键冲突。
 */
export const MOCK_RAG_VECTOR_HITS_DEMO: PostVectorSearchHit[] = [
  {
    postId: 99101,
    title: "",
    content: "建议西区食堂夜宵档延长到 22:30，自习晚归经常没热食。",
    score: 0.8921,
    embeddingModel: "demo-mock",
  },
  {
    postId: 99102,
    title: "",
    content: "一楼麻辣烫今天汤底偏咸，师傅辛苦了能否调淡一点～",
    score: 0.8712,
    embeddingModel: "demo-mock",
  },
  {
    postId: 99103,
    title: "",
    content: "【反馈】二楼餐具消毒柜有时未开，请后勤帮忙盯一下。",
    score: 0.8544,
    embeddingModel: "demo-mock",
  },
  {
    postId: 99104,
    title: "",
    content: "轻食窗口牛油果上新好评，就是排队略长，建议增加一个打菜位。",
    score: 0.8398,
    embeddingModel: "demo-mock",
  },
  {
    postId: 99105,
    title: "",
    content: "咖喱饭窗口鸡块外酥里嫩，已安利给室友，求保持品控！",
    score: 0.821,
    embeddingModel: "demo-mock",
  },
];
