'use client';

import { useState, useRef, useEffect } from 'react';
import { OrderStatus, FulfillmentMethod } from '@/lib/types';
import FulfillmentBadge from './FulfillmentBadge';
import OrderAge from './OrderAge';

interface OrderCardProps {
  id: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  customerName: string;
  itemCount: number;
  total: number;
  createdAt: string;
  onClick: (orderId: string) => void;
  onQuickTransition: (orderId: string, toStatus: OrderStatus) => void;
  onTransitionWithModal: (orderId: string, fromStatus: OrderStatus, toStatus: OrderStatus, fulfillmentMethod: string) => void;
}

interface PrimaryAction {
  label: string;
  toStatus: OrderStatus;
  needsModal: boolean;
}

function getPrimaryAction(status: OrderStatus, fulfillment: FulfillmentMethod): PrimaryAction | null {
  switch (status) {
    case 'confirmed':
      return { label: 'Start Processing', toStatus: 'processing', needsModal: false };
    case 'processing':
      if (fulfillment === 'pickup') {
        return { label: 'Mark Ready', toStatus: 'ready', needsModal: false };
      }
      return { label: 'Mark Shipped', toStatus: 'shipped', needsModal: true };
    case 'ready':
      return { label: 'Complete', toStatus: 'completed', needsModal: false };
    case 'shipped':
      return { label: 'Complete', toStatus: 'completed', needsModal: false };
    default:
      return null;
  }
}

function getSecondaryActions(status: OrderStatus): { label: string; toStatus: OrderStatus }[] {
  const actions: { label: string; toStatus: OrderStatus }[] = [];
  if (status !== 'on_hold' && status !== 'completed' && status !== 'cancelled') {
    actions.push({ label: 'Put On Hold', toStatus: 'on_hold' });
    actions.push({ label: 'Cancel Order', toStatus: 'cancelled' });
  }
  if (status === 'on_hold') {
    actions.push({ label: 'Resume to Queue', toStatus: 'confirmed' });
    actions.push({ label: 'Resume Processing', toStatus: 'processing' });
    actions.push({ label: 'Cancel Order', toStatus: 'cancelled' });
  }
  return actions;
}

export default function OrderCard({
  id,
  status,
  fulfillmentMethod,
  customerName,
  itemCount,
  total,
  createdAt,
  onClick,
  onQuickTransition,
  onTransitionWithModal,
}: OrderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const primary = getPrimaryAction(status, fulfillmentMethod);
  const secondary = getSecondaryActions(status);

  const handlePrimary = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!primary) return;
    if (primary.needsModal) {
      onTransitionWithModal(id, status, primary.toStatus, fulfillmentMethod);
    } else {
      onQuickTransition(id, primary.toStatus);
    }
  };

  const handleSecondary = (e: React.MouseEvent, toStatus: OrderStatus) => {
    e.stopPropagation();
    setMenuOpen(false);
    onTransitionWithModal(id, status, toStatus, fulfillmentMethod);
  };

  return (
    <div
      onClick={() => onClick(id)}
      className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
    >
      {/* Top row: customer name + overflow menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{customerName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <FulfillmentBadge method={fulfillmentMethod} />
            <OrderAge createdAt={createdAt} />
          </div>
        </div>

        {secondary.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20 min-w-[160px]">
                {secondary.map((action) => (
                  <button
                    key={action.toStatus}
                    onClick={(e) => handleSecondary(e, action.toStatus)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                      action.toStatus === 'cancelled'
                        ? 'text-red-600 hover:bg-red-50'
                        : action.toStatus === 'on_hold'
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom row: items + total + primary action */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          <span className="font-medium text-gray-900">${(total / 100).toFixed(2)}</span>
        </div>

        {primary && (
          <button
            onClick={handlePrimary}
            className="px-2.5 py-1 rounded text-xs font-medium bg-sage-600 text-white hover:bg-sage-700 transition-colors"
          >
            {primary.label}
          </button>
        )}
      </div>
    </div>
  );
}
