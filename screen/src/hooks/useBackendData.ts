/**
 * 各页面数据 hooks：优先请求后端 API，失败或未配置时使用 mock
 */
import React, { useState, useEffect } from 'react';
import { ShieldCheck, FlaskConical, Microscope, TestTube, Beaker, ScanSearch, Leaf } from 'lucide-react';
import { apiGet, isApiConfigured } from '../api';
import type { VendorDto, MenuItemDto, QueueEntryDto, TestReportDto, RetainedSampleDto, SensorLogDto, PostDto, AllergenDisclosureDto, FoundItemDto, LostItemDto } from '../api/types';
import {
  menuItemsToDishes,
  buildDashboardWindow,
  queueEntriesToCalling,
  testReportToDisplay,
  retainedSampleToDisplay,
  sensorLogsToTimeSeries,
  postToFeedbackItem,
  foundItemsToDisplay,
  lostItemsToDisplay,
} from '../api/adapters';
import type { Dish } from '../components/menu/DishCardModal';
import { menuCategories, mockDishes } from '../mocks/menu';
import { statusConfig, initialJustServed, initialWaiting, generateInitialWindows } from '../mocks/dashboard';
import { generateTempData } from '../mocks/foodSafety';
import { foodSafetyReports, foodSafetySamples, foodSafetyAllergens, allergenDisclosuresToDisplay } from '../mocks/foodSafety';
import { barData, latestFeedbacks } from '../mocks/feedback';
import { foundItems as mockFoundItems, lostItems as mockLostItems } from '../mocks/lostFound';

/** 检测机构名称（lab_name）-> 公示卡片图标，按关键词匹配 */
const LAB_ICON_MAP: Array<{ keyword: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { keyword: '第三方检测所', Icon: FlaskConical },
  { keyword: '华测检测', Icon: Microscope },
  { keyword: '谱尼测试', Icon: TestTube },
  { keyword: '中检集团', Icon: Beaker },
  { keyword: '天祥检测', Icon: ScanSearch },
  { keyword: '方圆检测', Icon: Leaf },
];

const LAB_ICON_CLASS = 'w-6 h-6 text-emerald-400';

function getLabIcon(agency: string): React.ReactNode {
  const name = (agency ?? '').trim();
  const entry = LAB_ICON_MAP.find(({ keyword }) => name.includes(keyword));
  const Icon = entry?.Icon ?? ShieldCheck;
  return React.createElement(Icon, { className: LAB_ICON_CLASS });
}

// ---------- Menu ----------
export function useMenu(): {
  dishes: Dish[];
  categories: typeof menuCategories;
  loading: boolean;
  error: string | null;
  isFromApi: boolean;
} {
  const [dishes, setDishes] = useState<Dish[]>(mockDishes);
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const [isFromApi, setIsFromApi] = useState(false);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([apiGet<VendorDto[]>('/api/vendors'), apiGet<MenuItemDto[]>('/api/menu-items')])
      .then(([vendors, items]) => {
        if (cancelled) return;
        const list = menuItemsToDishes(items, vendors);
        if (list.length > 0) {
          setDishes(list);
          setIsFromApi(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '请求失败');
          setDishes(mockDishes);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { dishes, categories: menuCategories, loading, error, isFromApi };
}

// ---------- Dashboard (windows = vendors + queue counts) ----------
export type DashboardWindow = ReturnType<typeof buildDashboardWindow>;

export function useDashboard(): {
  windows: DashboardWindow[];
  setWindows: React.Dispatch<React.SetStateAction<DashboardWindow[]>>;
  statusConfig: typeof statusConfig;
  initialJustServed: typeof initialJustServed;
  initialWaiting: typeof initialWaiting;
  justServed: { id: string; win: string }[];
  waiting: string[];
  loading: boolean;
  error: string | null;
  isFromApi: boolean;
} {
  const [windows, setWindows] = useState<DashboardWindow[]>(() => generateInitialWindows());
  const [justServed, setJustServed] = useState<{ id: string; win: string }[]>(initialJustServed);
  const [waiting, setWaiting] = useState<string[]>(initialWaiting);
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const [isFromApi, setIsFromApi] = useState(false);

  const fetchDashboard = React.useCallback(() => {
    if (!isApiConfigured()) return;
    return Promise.all([
      apiGet<VendorDto[]>('/api/vendors'),
      apiGet<QueueEntryDto[]>('/api/queue-entries'),
    ]).then(([vendors, entries]) => {
      const waitingByVendor = new Map<number, number>();
      entries.forEach((e) => {
        if (e.status === 'waiting' || !e.status) {
          const v = e.vendorId ?? 0;
          waitingByVendor.set(v, (waitingByVendor.get(v) ?? 0) + 1);
        }
      });
      const list = vendors.map((v) =>
        buildDashboardWindow(v, waitingByVendor.get(v?.id ?? 0) ?? 0)
      );
      if (list.length > 0) {
        setWindows(list);
        setIsFromApi(true);
      }
      const { justServed: js, waiting: w } = queueEntriesToCalling(entries);
      setJustServed(js);
      setWaiting(w);
    });
  }, []);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchDashboard()
      .catch(() => {
        if (!cancelled) setLoading(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDashboard]);

  // 接数据库时轮询排队/叫号数据，保持实时
  useEffect(() => {
    if (!isFromApi || !isApiConfigured()) return;
    const timer = setInterval(() => {
      apiGet<QueueEntryDto[]>('/api/queue-entries').then((entries) => {
        const { justServed: js, waiting: w } = queueEntriesToCalling(entries);
        setJustServed(js);
        setWaiting(w);
        const waitingByVendor = new Map<number, number>();
        entries.forEach((e) => {
          if (e.status === 'waiting' || !e.status) {
            const v = e.vendorId ?? 0;
            waitingByVendor.set(v, (waitingByVendor.get(v) ?? 0) + 1);
          }
        });
        apiGet<VendorDto[]>('/api/vendors').then((vendors) => {
          const list = vendors.map((v) =>
            buildDashboardWindow(v, waitingByVendor.get(v?.id ?? 0) ?? 0)
          );
          if (list.length > 0) setWindows(list);
        });
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [isFromApi]);

  return {
    windows,
    setWindows,
    statusConfig,
    initialJustServed,
    initialWaiting,
    justServed,
    waiting,
    loading,
    error,
    isFromApi,
  };
}

// ---------- FoodSafety ----------
export function useFoodSafety(): {
  tempData: { time: string; temp: number; ppm: number }[];
  reports: Array<{ id: number; type: string; result: string; agency: string; time: string; icon?: React.ReactNode }>;
  samples: Array<{ id: string; meal: string; time: string; loc: string; status: string; operator: string; vendor: string; category: string }>;
  allergens: typeof foodSafetyAllergens;
  loading: boolean;
  error: string | null;
  isFromApi: boolean;
} {
  const [tempData, setTempData] = useState(generateTempData);
  const [reports, setReports] = useState(foodSafetyReports);
  const [samples, setSamples] = useState(foodSafetySamples);
  const [allergens, setAllergens] = useState(foodSafetyAllergens);
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const [isFromApi, setIsFromApi] = useState(false);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiGet<SensorLogDto[]>('/api/sensor-logs'),
      apiGet<TestReportDto[]>('/api/test-reports'),
      apiGet<RetainedSampleDto[]>('/api/retained-samples'),
      apiGet<VendorDto[]>('/api/vendors').catch(() => []),
      apiGet<AllergenDisclosureDto[]>('/api/allergen-disclosures').catch(() => []),
    ])
      .then(([sensorLogs, testReports, retainedSamples, vendors, allergenList]) => {
        if (cancelled) return;
        const ts = sensorLogsToTimeSeries(sensorLogs);
        if (ts.length > 0) setTempData(ts);
        const rep = testReports.map(testReportToDisplay).map((r) => ({
          ...r,
          icon: getLabIcon(r.agency),
        }));
        if (rep.length > 0) setReports(rep as typeof foodSafetyReports);
        const vendorMap = new Map((vendors ?? []).map((v) => [v.id, v.name ?? '']));
        const sam = retainedSamples.map((r) =>
          retainedSampleToDisplay({ ...r, vendorName: r.vendorName ?? vendorMap.get(r.vendorId ?? 0) })
        );
        if (sam.length > 0) setSamples(sam);
        if (allergenList && allergenList.length > 0) {
          setAllergens(allergenDisclosuresToDisplay(allergenList));
          setIsFromApi(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    tempData,
    reports,
    samples,
    allergens,
    loading,
    error,
    isFromApi,
  };
}

// ---------- Feedback (posts as feedback list) ----------
export function useFeedback(): {
  barData: typeof barData;
  latestFeedbacks: Array<{
    id: number;
    type: string;
    time: string;
    content: string;
    reply: string | null;
    status: 'pending' | 'ai_replied' | 'replied';
    statusLabel: string;
    aiSuggestion: string | null;
    theme: string;
  }>;
  loading: boolean;
  error: string | null;
  isFromApi: boolean;
  refetch: () => Promise<void>;
} {
  const [feedbacks, setFeedbacks] = useState(latestFeedbacks);
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const [isFromApi, setIsFromApi] = useState(false);

  const fetchPosts = React.useCallback(() => {
    if (!isApiConfigured()) return Promise.resolve();
    setLoading(true);
    setError(null);
    return apiGet<PostDto[]>('/api/posts')
      .then((posts) => {
        if (posts.length > 0) {
          setFeedbacks(posts.map((p, i) => postToFeedbackItem(p, i)));
          setIsFromApi(true);
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : '请求失败');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    barData,
    latestFeedbacks: feedbacks,
    loading,
    error,
    isFromApi,
    refetch: fetchPosts,
  };
}

// ---------- LostFound（寻物/招领） ----------
export type FoundDisplayItem = ReturnType<typeof foundItemsToDisplay>[number];
export type LostDisplayItem = ReturnType<typeof lostItemsToDisplay>[number];

export function useLostFound(): {
  foundItems: FoundDisplayItem[];
  lostItems: LostDisplayItem[];
  loading: boolean;
  error: string | null;
  isFromApi: boolean;
} {
  const [foundItems, setFoundItems] = useState<FoundDisplayItem[]>(mockFoundItems);
  const [lostItems, setLostItems] = useState<LostDisplayItem[]>(mockLostItems);
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const [isFromApi, setIsFromApi] = useState(false);

  useEffect(() => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiGet<FoundItemDto[]>('/api/found-items').catch(() => []),
      apiGet<LostItemDto[]>('/api/lost-items').catch(() => []),
    ])
      .then(([found, lost]) => {
        if (cancelled) return;
        if (found.length > 0) {
          setFoundItems(foundItemsToDisplay(found));
          setIsFromApi(true);
        }
        if (lost.length > 0) {
          setLostItems(lostItemsToDisplay(lost));
          setIsFromApi(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { foundItems, lostItems, loading, error, isFromApi };
}
