/**
 * RewardsSection Component
 *
 * Displays XP and coins earned this round.
 */

import React from 'react';
import { UICard } from '../ui';
import { XP_STRINGS } from '../../constants/xpStrings';
import { RewardsEarned } from './types';

interface RewardsSectionProps {
  rewards: RewardsEarned;
}

export const RewardsSection: React.FC<RewardsSectionProps> = ({ rewards }) => {
  if (rewards.xp.total <= 0 && rewards.coins.total <= 0) {
    return null;
  }

  return (
    <section className="animate-fadeInUp delay-150" aria-label="Round rewards" role="region">
      <UICard
        variant="bordered"
        className="bg-skin-success border-2 border-skin-success"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* XP Section */}
          <div
            className="flex items-center gap-3"
            role="group"
            aria-label="Experience points earned"
          >
            <span className="text-3xl" aria-hidden="true">
              ✨
            </span>
            <div>
              <h4
                className="text-sm font-semibold text-skin-success"
                id="xp-label"
              >
                {XP_STRINGS.XP_EARNED}
              </h4>
              <div
                className="text-2xl font-black text-skin-success"
                aria-labelledby="xp-label"
              >
                +{rewards.xp.total} XP
              </div>
            </div>
          </div>

          {/* Coins Section */}
          <div
            className="flex items-center gap-3 sm:border-l sm:border-skin-success sm:pl-4"
            role="group"
            aria-label="Coins earned"
          >
            <span className="text-3xl" aria-hidden="true">
              🪙
            </span>
            <div>
              <h4
                className="text-sm font-semibold text-skin-warning"
                id="coins-label"
              >
                {XP_STRINGS.COINS_EARNED}
              </h4>
              <div
                className="text-2xl font-black text-skin-warning"
                aria-labelledby="coins-label"
              >
                +{rewards.coins.total}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div
            className="text-right text-xs space-y-1 border-t sm:border-t-0 sm:border-l border-skin-success pt-3 sm:pt-0 sm:pl-4"
            aria-label="Reward breakdown"
          >
            <div className="text-skin-success">
              {rewards.xp.breakdown.tricks > 0 && (
                <div>
                  {rewards.tricksWon} tricks = +{rewards.xp.breakdown.tricks} XP
                </div>
              )}
              {rewards.xp.breakdown.bet > 0 && (
                <div>Bet won = +{rewards.xp.breakdown.bet} XP</div>
              )}
              {rewards.xp.breakdown.redZeros > 0 && (
                <div>
                  {rewards.redZerosCollected} red 0s = +{rewards.xp.breakdown.redZeros} XP
                </div>
              )}
            </div>
            <div className="text-skin-warning">
              {rewards.coins.breakdown.round > 0 && (
                <div>Round = +{rewards.coins.breakdown.round} coins</div>
              )}
              {rewards.coins.breakdown.redZeros > 0 && (
                <div>Red 0s = +{rewards.coins.breakdown.redZeros} coins</div>
              )}
            </div>
          </div>
        </div>
      </UICard>
    </section>
  );
};
