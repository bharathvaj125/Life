import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { CyberCard, CyberBadge, CyberButton } from '../ui/CyberComponents';
import {
  ShoppingBag,
  Cpu,
  Glasses,
  Monitor,
  BatteryCharging,
  Shield,
  Zap,
  Bot,
  Award,
  Check,
  Coins,
  AlertCircle,
} from 'lucide-react';

const SHOP_ICON_MAP = {
  cpu: Cpu,
  glasses: Glasses,
  monitor: Monitor,
  'battery-charging': BatteryCharging,
  shield: Shield,
  zap: Zap,
  bot: Bot,
  award: Award,
};

export function BlackMarketShop() {
  const { user } = useAuth();
  const { shopItems, inventory, buyItem, equipItem, loadingShop } = useGame();
  const [purchasingId, setPurchasingId] = useState(null);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'inventory'
  const [statusMsg, setStatusMsg] = useState(null);

  const userCredits = user?.credits ?? 0;

  const handleBuy = async (item) => {
    setStatusMsg(null);
    setPurchasingId(item.id);
    try {
      await buyItem(item.id);
      setStatusMsg({ type: 'success', text: `Acquisition authorized: "${item.name}" registered to inventory.` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Grid transaction rejected.' });
    } finally {
      setPurchasingId(null);
    }
  };

  const handleEquip = async (itemId) => {
    setStatusMsg(null);
    try {
      await equipItem(itemId);
      setStatusMsg({ type: 'success', text: 'Hardware/Theme firmware active and equipped.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to equip item.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Black Market Header Bar */}
      <div className="bg-[#0D121F] border border-[#223254] p-5 cyber-cut flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00F0FF]" />
            <h2 className="font-display text-lg font-black tracking-wider uppercase text-white">
              Underground Black Market
            </h2>
          </div>
          <p className="text-xs font-telemetry tracking-wide text-[#94A3B8] mt-1">
            Exchange verified Credits for neural cyberware implants, tactical themes, and streak fail-safes.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#07090E] border border-[#FFB800]/50 px-4 py-2 cyber-cut-sm flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-[#FFB800]" />
            <div>
              <span className="text-[10px] font-telemetry uppercase text-[#94A3B8] block">Available Credits</span>
              <span className="font-mono-cyber text-lg font-bold text-[#FFB800] leading-none">
                {userCredits}
              </span>
            </div>
          </div>

          <div className="flex bg-[#07090E] border border-[#223254] p-1">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-telemetry uppercase tracking-wider font-semibold cursor-pointer ${
                activeTab === 'catalog' ? 'bg-[#00F0FF] text-[#07090E]' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 text-xs font-telemetry uppercase tracking-wider font-semibold cursor-pointer ${
                activeTab === 'inventory' ? 'bg-[#00F0FF] text-[#07090E]' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Locker ({inventory.length})
            </button>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 text-xs font-telemetry border flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-[#00FF9D]/15 border-[#00FF9D]/40 text-[#00FF9D]'
              : 'bg-[#FF0055]/15 border-[#FF0055]/40 text-[#FF85A2]'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Catalog View */}
      {activeTab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopItems.map((item) => {
            const Icon = SHOP_ICON_MAP[item.icon] || Cpu;
            const canAfford = userCredits >= item.cost;
            const missingCredits = item.cost - userCredits;
            const isOwned = item.owned;

            return (
              <CyberCard
                key={item.id}
                className={`p-5 flex flex-col justify-between space-y-4 border ${
                  isOwned
                    ? 'border-[#00FF9D]/40 bg-[#07090E]/60'
                    : 'border-[#223254] hover:border-[#00F0FF]/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-[#07090E] border border-[#00F0FF]/30 cyber-cut-sm flex items-center justify-center text-[#00F0FF]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <CyberBadge variant={isOwned ? 'emerald' : 'cyan'}>
                        {item.category}
                      </CyberBadge>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-sm font-bold text-white tracking-wide">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#94A3B8] font-sans mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#223254] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-telemetry uppercase text-[#64748B]">Cost</span>
                    <div className="flex items-center gap-1 font-mono-cyber font-bold text-sm text-[#FFB800]">
                      <Coins className="w-4 h-4" />
                      <span>{item.cost} Credits</span>
                    </div>
                  </div>

                  {isOwned ? (
                    <div className="w-full py-2 bg-[#00FF9D]/10 border border-[#00FF9D]/30 text-[#00FF9D] text-xs font-telemetry uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Acquired
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <CyberButton
                        variant={canAfford ? 'primary' : 'secondary'}
                        size="sm"
                        disabled={!canAfford || purchasingId === item.id}
                        onClick={() => handleBuy(item)}
                        className="w-full"
                      >
                        {purchasingId === item.id
                          ? 'Authorizing...'
                          : canAfford
                          ? 'Purchase Cyberware'
                          : `Locked: Insufficient Credits`}
                      </CyberButton>

                      {!canAfford && (
                        <p className="text-[10px] text-center font-telemetry text-[#FF85A2]">
                          Requires <span className="font-mono-cyber font-bold text-[#FFB800]">{missingCredits}</span> more credits
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CyberCard>
            );
          })}
        </div>
      ) : (
        /* Inventory Locker View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed border-[#223254] bg-[#0D121F]/40 cyber-cut space-y-2">
              <ShoppingBag className="w-8 h-8 text-[#64748B] mx-auto" />
              <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                Locker Storage Empty
              </h4>
              <p className="text-xs text-[#94A3B8]">Acquire implants or themes from the catalog above.</p>
            </div>
          ) : (
            inventory.map((inv) => {
              const Icon = SHOP_ICON_MAP[inv.icon] || Cpu;
              const isEquipped = inv.equipped === 1;

              return (
                <CyberCard
                  key={inv.id}
                  className={`p-5 flex flex-col justify-between space-y-4 border ${
                    isEquipped ? 'border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'border-[#223254]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 bg-[#07090E] border border-[#00F0FF]/30 cyber-cut-sm flex items-center justify-center text-[#00F0FF]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <CyberBadge variant={isEquipped ? 'cyan' : 'slate'}>
                        {isEquipped ? 'EQUIPPED' : inv.category}
                      </CyberBadge>
                    </div>

                    <div>
                      <h3 className="font-display text-sm font-bold text-white tracking-wide">
                        {inv.name}
                      </h3>
                      <p className="text-xs text-[#94A3B8] font-sans mt-1">
                        {inv.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#223254]">
                    <CyberButton
                      variant={isEquipped ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={isEquipped}
                      onClick={() => handleEquip(inv.item_id)}
                      className="w-full"
                    >
                      {isEquipped ? 'Active Firmware' : 'Equip Implant / Theme'}
                    </CyberButton>
                  </div>
                </CyberCard>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
