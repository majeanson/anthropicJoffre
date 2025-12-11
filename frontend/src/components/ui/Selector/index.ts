/**
 * Selector Components
 *
 * Reusable building blocks for selection interfaces (skins, themes, avatars, etc.)
 *
 * @example
 * import { SelectorCard, SelectorGrid, SelectorPreview, SelectorInfo } from './ui/Selector';
 *
 * <SelectorGrid columns={2}>
 *   {skins.map(skin => (
 *     <SelectorCard
 *       key={skin.id}
 *       isSelected={skin.id === selectedId}
 *       isLocked={!isUnlocked(skin.id)}
 *       lockInfo={{ level: skin.requiredLevel, currentLevel: playerLevel }}
 *       onSelect={() => selectSkin(skin.id)}
 *     >
 *       <SelectorPreview background={skin.preview} />
 *       <SelectorInfo
 *         title={skin.name}
 *         subtitle={skin.isDark ? 'Dark' : 'Light'}
 *         description={skin.description}
 *       />
 *     </SelectorCard>
 *   ))}
 * </SelectorGrid>
 */

export { SelectorCard, type SelectorCardProps, type SelectorCardLockInfo } from './SelectorCard';
export { SelectorGrid, type SelectorGridProps } from './SelectorGrid';
export { SelectorPreview, type SelectorPreviewProps } from './SelectorPreview';
export { SelectorInfo, type SelectorInfoProps } from './SelectorInfo';
