/**
 * HUD (Heads-Up Display) Component
 *
 * Game HUD showing:
 * - HP bars for both fighters
 * - Gauge bars for both fighters
 * - Current rank display
 * - Special move announcement
 */

import React from 'react';
import { usePlayer, useOpponent, useBattlePhase, useSpecialPriority } from '../../state/gameStore';
import { useRankingStore, RANK_NAMES, WINS_REQUIRED } from '../../state/rankingStore';
import './HUD.css';

export interface HUDProps {
  className?: string;
}

/**
 * HP Display Component
 */
function HPBar({ hp, maxHp, label }: { hp: number; maxHp: number; label: string }) {
  return (
    <div className="hp-container">
      <div className="hp-label">{label}</div>
      <div className="hp-hearts">
        {Array.from({ length: maxHp }, (_, i) => (
          <span key={i} className={`hp-heart ${i < hp ? 'hp-heart--full' : 'hp-heart--empty'}`}>
            {i < hp ? '♥' : '♡'}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Gauge Display Component
 */
function GaugeBar({ gauge, label, isCharging }: { gauge: number; label: string; isCharging: boolean }) {
  const gaugeClass = gauge >= 100 ? 'gauge-bar--full' : gauge >= 70 ? 'gauge-bar--high' : '';

  return (
    <div className="gauge-container">
      <div className="gauge-label">{label}</div>
      <div className="gauge-track">
        <div
          className={`gauge-bar ${gaugeClass} ${isCharging ? 'gauge-bar--charging' : ''}`}
          style={{ width: `${Math.min(100, gauge)}%` }}
        />
      </div>
      <div className="gauge-percent">{Math.floor(gauge)}%</div>
    </div>
  );
}

/**
 * Rank Display Component
 */
function RankDisplay() {
  const { currentRank, consecutiveWins } = useRankingStore();
  const rankName = RANK_NAMES[currentRank];
  const winsNeeded = WINS_REQUIRED[currentRank];
  const isMaxRank = currentRank === 5;

  return (
    <div className="rank-display">
      <div className="rank-title">番付</div>
      <div className="rank-name">{rankName}</div>
      {!isMaxRank && winsNeeded > 1 && (
        <div className="rank-progress">
          昇進まで {consecutiveWins}/{winsNeeded}勝
        </div>
      )}
    </div>
  );
}

/**
 * Special Move Announcement
 */
function SpecialAnnouncement() {
  const battlePhase = useBattlePhase();
  const priority = useSpecialPriority();
  const player = usePlayer();
  const opponent = useOpponent();

  if (battlePhase !== 'special') return null;

  const moveNames: Record<string, string> = {
    harite: '張り手',
    tsuppari: '突っ張り',
    buchikami: 'ぶちかまし',
  };

  return (
    <div className="special-announcement">
      {player.isExecutingSpecial && (
        <div className="special-text special-text--player">
          {moveNames[player.specialMove || 'harite']}！
        </div>
      )}
      {opponent.isExecutingSpecial && (
        <div className="special-text special-text--opponent">
          {moveNames[opponent.specialMove || 'harite']}！
        </div>
      )}
      {priority === 'simultaneous' && (
        <div className="special-text special-text--clash">相殺！</div>
      )}
    </div>
  );
}

/**
 * Complete HUD Component
 */
export default function HUD({ className = '' }: HUDProps) {
  const player = usePlayer();
  const opponent = useOpponent();
  const battlePhase = useBattlePhase();
  const isCharging = battlePhase === 'charging';

  return (
    <div className={`hud-overlay ${className}`}>
      {/* Rank Display (top center) */}
      <div className="hud-top-center">
        <RankDisplay />
      </div>

      {/* Fighter Stats Row */}
      <div className="hud-stats-row">
        {/* Player Stats (left) */}
        <div className="hud-fighter-stats">
          <HPBar hp={player.hp} maxHp={3} label="あなた" />
          <GaugeBar gauge={player.gauge} label="気合" isCharging={isCharging} />
        </div>

        {/* VS */}
        <div className="hud-vs">VS</div>

        {/* Opponent Stats (right) */}
        <div className="hud-fighter-stats">
          <HPBar hp={opponent.hp} maxHp={3} label="あいて" />
          <GaugeBar gauge={opponent.gauge} label="気合" isCharging={isCharging} />
        </div>
      </div>

      {/* Special Move Announcement (center) */}
      <SpecialAnnouncement />
    </div>
  );
}
