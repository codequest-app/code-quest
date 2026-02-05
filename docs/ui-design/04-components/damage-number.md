# 傷害數字組件 (Damage Number Component)

**類別**: Battle Components
**版本**: v1.0

## 組件概述
戰鬥中顯示傷害、治療等數值的浮動動畫組件。

## 視覺示例
```
      -120  ↑ 向上飄動
             ↑ 淡出
           
敵人位置
      ⚔️
      
弱點攻擊:
      -180! ⭐ 更大、晃動
```

## 屬性定義
```typescript
interface DamageNumberProps {
  value: number;
  type: DamageType;
  position: { x: number; y: number };
  isWeakHit?: boolean;
  isCritical?: boolean;
}

type DamageType = 'damage' | 'heal' | 'mp' | 'shield';

function spawnDamageNumber(props: DamageNumberProps): void;
```

## 類型樣式
```css
.damage-number.damage { color: #ffffff; }
.damage-number.damage.weak { color: #ff0000; font-size: 28px; }
.damage-number.damage.critical { color: #ffd700; }
.damage-number.heal { color: #00ff00; }
.damage-number.mp { color: #00ccff; }
.damage-number.shield { color: #64b5f6; }
```

## 動畫
```css
@keyframes float-up {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-80px); opacity: 0; }
}

.damage-number {
  animation: float-up 1s ease-out forwards;
}

@keyframes float-wobble {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(-5deg); }
  75% { transform: translateY(-60px) rotate(5deg); }
}

.damage-number.weak {
  animation: float-wobble 1s ease-out forwards;
}
```

## 使用範例
```tsx
// 普通傷害
spawnDamageNumber({
  value: 120,
  type: 'damage',
  position: { x: enemyX, y: enemyY },
  isWeakHit: false,
  isCritical: false,
});

// 弱點傷害
spawnDamageNumber({
  value: 180,
  type: 'damage',
  position: { x: enemyX, y: enemyY },
  isWeakHit: true,
  isCritical: false,
});

// 治療
spawnDamageNumber({
  value: 50,
  type: 'heal',
  position: { x: playerX, y: playerY },
});
```

【參考：01-design-system/animation-timing.md】
【參考：02-screens/battle/battle-main.md】
