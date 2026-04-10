import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Star,
  Clock,
  MapPin,
  Plus,
  Minus,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { CheckoutPage } from "./CheckoutPage";
import { listMenuItemsByVendor } from "../api/menuItems";
import { getBaseUrl, isApiConfigured } from "../api/client";
import { merchantMenuFallbackMock } from "../mocks/merchantMenu";
import { InlineNoticeModal } from "./InlineNoticeModal";
import { dispatchOrdersUpdated } from "../lib/ordersEvents";

type MenuItemRow = {
  id: number;
  name: string;
  price: number;
  desc: string;
  image: string;
  popular: boolean;
};

interface MerchantPageProps {
  merchant: { id: number; name: string; image?: string; rating?: number; time?: string; distance?: string };
  onBack: () => void;
  user?: { userId?: number } | null;
  onRequireLogin?: () => void;
  key?: string;
}

export function MerchantPage({ merchant, onBack, user, onRequireLogin }: MerchantPageProps) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [activeCategory, setActiveCategory] = useState("招牌");
  const [showCheckout, setShowCheckout] = useState(false);
  const [menu, setMenu] = useState<MenuItemRow[]>(merchantMenuFallbackMock);
  const [menuLoading, setMenuLoading] = useState(isApiConfigured());
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    const base = getBaseUrl();
    if (!isApiConfigured() || !merchant?.id) {
      setMenuLoading(false);
      setMenu(merchantMenuFallbackMock);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await listMenuItemsByVendor(merchant.id);
        if (cancelled) return;
        const baseNorm = base.replace(/\/$/, "");
        const mapped: MenuItemRow[] = list
          .filter((m) => m.isAvailable !== false)
          .map((m) => {
            const image =
              m.imageUrl
                ? baseNorm + (m.imageUrl.startsWith("/") ? m.imageUrl : "/" + m.imageUrl)
                : `https://picsum.photos/seed/d${m.id}/200/200`;
            return {
              id: m.id,
              name: m.name,
              price: Number(m.price),
              desc: m.description ?? "",
              image,
              popular: false,
            };
          });
        setMenu(mapped.length ? mapped : merchantMenuFallbackMock);
      } catch {
        if (!cancelled) setMenu(merchantMenuFallbackMock);
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [merchant.id]);

  const updateCart = (id: number, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const totalItems = Object.values(cart).reduce(
    (a: number, b: number) => a + b,
    0,
  ) as number;
  const totalPrice = Object.entries(cart).reduce(
    (total: number, [id, count]) => {
      const item = menu.find((m) => m.id === Number(id));
      return total + (item?.price || 0) * (count as number);
    },
    0,
  ) as number;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed inset-0 bg-white z-50 flex flex-col"
    >
      {/* Header Image & Info */}
      <div className="relative h-64 md:h-80 shrink-0 w-full">
        <img
          src={merchant.image ?? `https://picsum.photos/seed/m${merchant.id}/800/400`}
          alt={merchant.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <button
          onClick={onBack}
          className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="absolute bottom-6 left-6 right-6 text-white max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{merchant.name}</h1>
          <div className="flex items-center gap-4 text-sm md:text-base text-white/90">
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />{" "}
              {merchant.rating ?? 4.5}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {merchant.time ?? "10-15 min"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {merchant.distance ?? "食堂"}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Area */}
      <div className="flex-1 flex overflow-hidden bg-gray-50 rounded-t-3xl md:rounded-t-none -mt-4 md:mt-0 relative z-10 w-full">
        <div className="flex w-full max-w-7xl mx-auto bg-white md:bg-transparent">
          {/* Sidebar */}
          <div className="w-24 md:w-48 bg-gray-50 overflow-y-auto no-scrollbar py-4 border-r border-gray-100">
            {["招牌", "热菜", "凉菜", "主食", "饮品"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "w-full py-4 md:py-5 md:px-6 text-sm md:text-base font-medium transition-all relative text-center md:text-left",
                  activeCategory === cat
                    ? "text-gray-900 bg-white md:shadow-sm md:rounded-l-2xl"
                    : "text-gray-500 hover:bg-gray-100",
                )}
              >
                {activeCategory === cat && (
                  <motion.div
                    layoutId="active-cat"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#FF6B6B] rounded-r-full"
                  />
                )}
                <span className="block">{cat}</span>
              </button>
            ))}
          </div>

          {/* Dishes */}
          <div className="flex-1 bg-white overflow-y-auto no-scrollbar p-4 md:p-8 pb-32">
            <h2 className="font-bold text-gray-900 mb-6 text-xl">{activeCategory}</h2>
            {menuLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-[#FF6B6B]" />
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {menu.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-white p-2 rounded-2xl hover:shadow-md transition-shadow border border-transparent hover:border-gray-100"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-bold text-gray-900 md:text-lg">
                        {item.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-[#FF6B6B] text-lg md:text-xl">
                        ¥{item.price}
                      </span>
                      <div className="flex items-center gap-3">
                        {(cart[item.id] || 0) > 0 && (
                          <>
                            <button
                              onClick={() => updateCart(item.id, -1)}
                              className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">
                              {cart[item.id]}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => updateCart(item.id, 1)}
                          className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#FF6B6B] flex items-center justify-center text-white hover:bg-[#FF8E8E] shadow-sm shadow-red-200"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Bar */}
      <AnimatePresence>
        {totalItems > 0 && !showCheckout && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-6 left-6 right-6 bg-gray-900 rounded-full p-2 pr-6 flex items-center justify-between shadow-2xl z-20"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700">
                <ShoppingBag className="text-white" size={20} />
                <span className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">
                  {totalItems}
                </span>
              </div>
              <div>
                <div className="text-white font-bold text-lg">
                  ¥{totalPrice}
                </div>
                <div className="text-gray-400 text-xs">另需打包费 ¥1</div>
              </div>
            </div>
            <button 
              onClick={() => {
                if (isApiConfigured() && user?.userId == null) {
                  setLoginPromptOpen(true);
                  return;
                }
                setShowCheckout(true);
              }}
              className="bg-[#FF6B6B] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#FF8E8E] transition-colors shadow-sm shadow-red-500/30"
            >
              去结算
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckout && (
          <CheckoutPage
            merchant={merchant}
            cart={cart}
            totalPrice={totalPrice}
            onBack={() => setShowCheckout(false)}
            onCheckoutSuccess={() => {
              setCart({});
              setShowCheckout(false);
              dispatchOrdersUpdated();
            }}
            menu={menu}
            userId={user?.userId}
          />
        )}
      </AnimatePresence>

      <InlineNoticeModal
        open={loginPromptOpen}
        title="需要登录"
        message="请先登录后再下单。是否前往「我的」登录？"
        confirmLabel="去登录"
        onConfirm={() => {
          setLoginPromptOpen(false);
          onRequireLogin?.();
        }}
      />
    </motion.div>
  );
}
