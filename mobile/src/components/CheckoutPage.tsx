import React, { useState } from "react";
import { ChevronLeft, MapPin, Clock, CreditCard, Utensils, Bike, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { THEME } from "../config/theme";
import { cn } from "../lib/utils";

interface CheckoutPageProps {
  merchant: any;
  cart: Record<number, number>;
  totalPrice: number;
  onBack: () => void;
  menu: any[];
}

export function CheckoutPage({ merchant, cart, totalPrice, onBack, menu }: CheckoutPageProps) {
  const [orderType, setOrderType] = useState<"dine-in" | "delivery">("dine-in");
  const [isPaying, setIsPaying] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("南区 3栋 402室");

  const addresses = [
    "南区 3栋 402室",
    "北区 1栋 101室",
    "东区 5栋 205室",
  ];

  const cartItems = Object.entries(cart)
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => {
      const item = menu.find((m) => m.id === Number(id));
      return { ...item, count };
    });

  const deliveryFee = orderType === "delivery" ? 2 : 0;
  const packageFee = 1;
  const finalPrice = totalPrice + packageFee + deliveryFee;

  const handlePay = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      alert("支付成功！");
      onBack();
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="absolute inset-0 bg-gray-50 z-[60] flex flex-col"
    >
      {/* Header */}
      <div 
        className="px-6 pt-6 pb-3 sticky top-0 z-10 shadow-sm flex items-center gap-4 text-white"
        style={{ backgroundColor: THEME.colors.primary }}
      >
        <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">确认订单</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Order Type Selection */}
          <div className="bg-white rounded-3xl p-1 flex shadow-sm border border-gray-100">
            <button
              onClick={() => setOrderType("dine-in")}
              className={cn(
                "flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-medium transition-all",
                orderType === "dine-in" ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <Utensils size={18} />
              食堂就餐
            </button>
            <button
              onClick={() => setOrderType("delivery")}
              className={cn(
                "flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-medium transition-all",
                orderType === "delivery" ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <Bike size={18} />
              外送回寝
            </button>
          </div>

          {/* Delivery Info */}
          <AnimatePresence mode="wait">
            {orderType === "delivery" ? (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onClick={() => setShowAddressModal(true)}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{selectedAddress}</div>
                    <div className="text-sm text-gray-500 mt-0.5">干饭王 138****8888</div>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-gray-400 rotate-180" />
              </motion.div>
            ) : (
              <motion.div
                key="dine-in"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 overflow-hidden"
              >
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">预计 15 分钟后可取餐</div>
                  <div className="text-sm text-gray-500 mt-0.5">请留意取餐通知</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order Details */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">{merchant.name}</h2>
            
            <div className="space-y-4">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-900">{item.name}</span>
                      <span className="font-bold text-gray-900">¥{item.price}</span>
                    </div>
                    <span className="text-sm text-gray-500">x{item.count}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>打包费</span>
                <span>¥{packageFee}</span>
              </div>
              {orderType === "delivery" && (
                <div className="flex justify-between text-gray-600">
                  <span>外送费</span>
                  <span>¥{deliveryFee}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-lg pt-2">
                <span>小计</span>
                <span style={{ color: THEME.colors.primary }}>¥{finalPrice}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <CreditCard className="text-gray-400" size={20} />
              <span className="font-medium text-gray-900">支付方式</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">校园卡支付</span>
              <ChevronLeft size={16} className="text-gray-400 rotate-180" />
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">合计 </span>
            <span className="text-2xl font-bold" style={{ color: THEME.colors.primary }}>¥{finalPrice}</span>
          </div>
          <button
            onClick={handlePay}
            disabled={isPaying}
            className="text-white px-8 py-3 rounded-full font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
            style={{ backgroundColor: THEME.colors.primary }}
          >
            {isPaying ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                支付中...
              </>
            ) : (
              "确认支付"
            )}
          </button>
        </div>
      </div>

      {/* Address Selection Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-[70] flex flex-col justify-end"
            onClick={() => setShowAddressModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl p-6 pb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">选择收货地址</h2>
                <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600">
                  <ChevronLeft size={24} className="rotate-180" />
                </button>
              </div>
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <button
                    key={addr}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setShowAddressModal(false);
                    }}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all",
                      selectedAddress === addr ? "border-[#FF6B6B] bg-red-50" : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={20} className={selectedAddress === addr ? "text-[#FF6B6B]" : "text-gray-400"} />
                      <span className={cn("font-medium", selectedAddress === addr ? "text-[#FF6B6B]" : "text-gray-700")}>
                        {addr}
                      </span>
                    </div>
                    {selectedAddress === addr && (
                      <div className="w-5 h-5 rounded-full bg-[#FF6B6B] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
