/**
 * 各页面数据 hooks：优先请求后端 API，失败或未配置时使用 mock
 */
import React, { useState, useEffect } from 'react';
import { apiGet, isApiConfigured } from '../api';
import type { VendorDto, MenuItemDto, QueueEntryDto, TestReportDto, RetainedSampleDto, SensorLogDto, PostDto, AllergenDisclosureDto } from '../api/types';
import {
  menuItemsToDishes,
  buildDashboardWindow,
  testReportToDisplay,
  retainedSampleToDisplay,
  sensorLogsToTimeSeries,
  postToFeedbackItem,
} from '../api/adapters';
import type { Dish } from '../components/menu/DishCardModal';
import { menuCategories, mockDishes } from '../mocks/menu';
import { statusConfig, initialJustServed, initialWaiting, generateInitialWindows } from '../mocks/dashboard';
import { generateTempData } from '../mocks/foodSafety';
import { foodSafetyReports, foodSafetySamples, foodSafetyAllergens, allergenDisclosuresToDisplay } from '../mocks/foodSafety';
import { barData, latestFeedbacks } from '../mocks/feedback';

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
  loading: boolean;
  error: string | null;
  isFromApi: boolean;
} {
  const [windows, setWindows] = useState<DashboardWindow[]>(() => generateInitialWindows());
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
      apiGet<VendorDto[]>('/api/vendors'),
      apiGet<QueueEntryDto[]>('/api/queue-entries'),
    ])
      .then(([vendors, entries]) => {
        if (cancelled) return;
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
    windows,
    setWindows,
    statusConfig,
    initialJustServed,
    initialWaiting,
    loading,
    error,
    isFromApi,
  };
}

// ---------- FoodSafety ----------
export function useFoodSafety(): {
  tempData: { time: string; temp: number; ppm: number }[];
  reports: Array<{ id: number; type: string; result: string; agency: string; time: string; icon?: React.ReactNode }>;
  samples: Array<{ id: string; meal: string; time: string; loc: string; status: string; operator: string }>;
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
      apiGet<AllergenDisclosureDto[]>('/api/allergen-disclosures').catch(() => []),
    ])
      .then(([sensorLogs, testReports, retainedSamples, allergenList]) => {
        if (cancelled) return;
        const ts = sensorLogsToTimeSeries(sensorLogs);
        if (ts.length > 0) setTempData(ts);
        const rep = testReports.map(testReportToDisplay).map((r, i) => ({
          ...r,
          icon: foodSafetyReports[i]?.icon,
        }));
        if (rep.length > 0) setReports(rep as typeof foodSafetyReports);
        const sam = retainedSamples.map(retainedSampleToDisplay);
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
    status: 'replied' | 'pending';
    theme: string;
  }>;
  loading: boolean;
  error: string | null;
  isFromApi: boolean;
} {
  const [feedbacks, setFeedbacks] = useState(latestFeedbacks);
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
    apiGet<PostDto[]>('/api/posts')
      .then((posts) => {
        if (cancelled) return;
        if (posts.length > 0) {
          setFeedbacks(posts.map((p, i) => postToFeedbackItem(p, i)));
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
    barData,
    latestFeedbacks: feedbacks,
    loading,
    error,
    isFromApi,
  };
}
