# Triforge TD - System Architecture

> Godot 4 tower defense with merge-2 upgrading, hero abilities, augment system, and gacha progression.
> Mobile-first (768x1280 portrait). ~39k lines of GDScript across 56 files.

---

## High-Level System Overview

```mermaid
graph TB
    subgraph Core["Core Game Loop"]
        GM[GameManager<br/>Battle Orchestrator]
        WM[WaveManager<br/>Enemy Spawning]
        Grid[GridManager<br/>12x12 Grid + Placement]
        GR[GridRenderer3D<br/>3D Visualization]
    end

    subgraph Combat["Combat Systems"]
        TB[TowerBase<br/>8 Tower Types]
        Proj[Projectile<br/>On-Hit + Augment Procs]
        EB[EnemyBase<br/>17 Enemy Types]
        HT[HeroTower<br/>6 Heroes + Abilities]
        HP[HeroProjectile<br/>Hero Visuals]
        Min[Minion<br/>Summoner Units]
    end

    subgraph Progression["Progression Layer"]
        PM[ProgressionManager<br/>Save/Load + All Player Data]
        ST[Skill Trees<br/>Global + Hero + Items]
        Equip[Equipment System<br/>11-14 Slots per Hero]
        Gacha[Gacha System<br/>Tower/Hero/Item Pulls]
    end

    subgraph Content["Content Data"]
        AD[AugmentData<br/>86 Augments]
        CD[CampaignData<br/>63 Themes x 5 Levels]
        HD[HeroData<br/>6 Hero Configs]
        ID[ItemData<br/>29 Affixes + Sets]
        IG[ItemGenerator<br/>Procedural Items]
    end

    subgraph UI["UI Layer (26 Screens)"]
        MM[MainMenu]
        ES[EquipmentScreen]
        GS[GachaScreens]
        STS[SkillTreeScreen]
        CMS[CampaignMapScreen]
        MS[MineScreen]
    end

    GM --> WM
    GM --> Grid
    Grid --> GR
    GM --> TB
    GM --> HT
    TB --> Proj
    Proj --> EB
    HT --> HP
    HT --> Min
    WM --> EB

    PM --> GM
    PM --> HT
    PM --> TB
    ST --> PM
    Equip --> PM
    Gacha --> PM

    AD --> TB
    AD --> Proj
    CD --> GM
    CD --> WM
    HD --> HT
    ID --> IG
    IG --> PM

    MM --> GM
    ES --> PM
    GS --> PM
    STS --> PM
    CMS --> CD
    MS --> GM
```

---

## Battle Data Flow

The core gameplay loop from wave start to enemy death:

```mermaid
sequenceDiagram
    participant U as Player
    participant GM as GameManager
    participant WM as WaveManager
    participant E as EnemyBase
    participant T as TowerBase
    participant P as Projectile
    participant H as HeroTower

    U->>GM: Start Wave
    GM->>WM: start_wave(wave_num)
    WM->>WM: Build spawn queue (type mix)

    loop Every spawn_interval
        WM->>E: spawn_enemy(type, hp, speed)
        E->>E: Follow path waypoints
    end

    loop Every frame
        T->>T: _try_shoot() - find target in range
        T->>P: _spawn_projectile(target, damage, augment_data)
        P->>P: Fly toward target
        P->>E: _arrive() -> take_damage(amount)
        E-->>E: Apply debuffs (slow, burn, poison)
    end

    loop Ability timers
        H->>H: Check cooldowns
        H->>E: Execute ability (AoE, buff, summon)
    end

    alt Enemy HP <= 0
        E-->>WM: enemy_killed signal
        WM-->>GM: enemy_defeated(gold_reward)
        GM->>GM: add_gold(amount)
    else Enemy reaches end
        E-->>WM: enemy_reached_end signal
        WM-->>GM: enemy_leaked(lives_cost)
        GM->>GM: lose_lives(amount)
    end

    WM-->>GM: wave_completed / all_waves_complete
    GM->>GM: Check victory or next wave
```

---

## Tower Damage Pipeline

```mermaid
flowchart LR
    A[Base Damage] --> B[x Rarity Mult<br/>1.0 - 1.6]
    B --> C[x Level Bonus<br/>1 + level*0.05]
    C --> D[x Tier Scaling<br/>1.9^tier-1]
    D --> E[x Skill Tree Bonus<br/>ProgressionManager]
    E --> F[x Augment Modifiers]
    F --> G[Spawn Projectile]
    G --> H{On Hit}
    H --> I[Apply Damage]
    H --> J[Augment Procs<br/>Ricochet / Napalm / Pierce]
    H --> K[Apply Debuffs<br/>Slow / Burn / Poison / Stun]
```

### Tower Types & Specializations

| Tower | Mechanic | Key Augments |
|-------|----------|-------------|
| Archer | Single target, fast | Ricochet (bounce), Poison Quiver (DoT) |
| Cannon | Splash AoE | Grapeshot (cone), Napalm (fire zone) |
| Mage | Chain bounce | Arcane Orb (pierce), Spell Echo (repeat) |
| Sniper | High single damage | Reload (charge up), Headshot (execute) |
| Frost | Freeze AoE | Glacial Aura (zone), Permafrost (stack) |
| Laser | Continuous beam | Pulse Mode (rapid), Overcharge (ramp) |
| Summoner | Spawn minions | Soul Harvest (on-kill), Swarm (count) |
| Poison | Cloud AoE | Toxic Cloud (persist), Plague (spread) |

---

## Hero Ability Pipeline

```mermaid
flowchart TB
    Setup[HeroTower.setup] --> ReadEquip[Read Equipment<br/>from ProgressionManager]
    ReadEquip --> ReadSkill[Read Skill Tree Bonuses<br/>Hero + Items paths]
    ReadSkill --> Stats[Compiled Stats<br/>crit, ability_dmg, CDR, etc.]

    Stats --> Timer{Ability Timer<br/>Reached 0?}
    Timer -->|Yes| Execute[Execute Ability]
    Execute --> Damage[Calculate Damage<br/>base x equip_mult x skill_mult]
    Damage --> VFX[Spawn VFX<br/>VfxHelper.spawn_oneshot/continuous]
    Damage --> Effect[Apply Effect<br/>AoE / Buff / Debuff / Summon]
    Timer -->|No| Timer

    subgraph Heroes
        Pal[Paladin<br/>Aura +dmg, Holy Shield<br/>Consecrate, Divine Storm]
        Ran[Ranger<br/>Mark vulnerability<br/>Multishot, Rain of Arrows]
        Arc[Archmage<br/>Mage synergy<br/>Mana Surge, Meteor]
        Nec[Necromancer<br/>Soul harvest<br/>Raise Skeleton, Death Nova]
        Eng[Engineer<br/>Cost reduction<br/>Overclock, Turret Deploy]
        Sha[Shadow<br/>Debuff resist down<br/>Poison Blade, Shadow Step]
    end
```

---

## Equipment & Item Flow

```mermaid
flowchart LR
    subgraph Generation
        Pull[Gacha Pull<br/>100 gems] --> IG[ItemGenerator<br/>Roll rarity + affixes]
        IG --> Item[Item Created<br/>slot, rarity, ilvl<br/>2-6 affixes from 29 pool]
    end

    subgraph Storage
        Item --> Inv[ProgressionManager<br/>.item_inventory]
        Inv --> Recom[Recombinator<br/>3 same items -> level up<br/>or rarity upgrade]
        Recom --> Inv
    end

    subgraph Equipping
        Inv --> ES[EquipmentScreen<br/>Compare stats]
        ES --> HE[hero_equipment<br/>hero_id -> slot -> item_id]
    end

    subgraph Application
        HE --> HT[HeroTower.setup<br/>Sum all affix values]
        HT --> Bonus[Equipment Bonuses<br/>crit, ability_dmg, CDR<br/>gold_on_kill, extra_lives]
        Bonus --> Combat[Applied in Combat<br/>Every damage calc]
    end
```

### Affix Categories

| Category | Affixes |
|----------|---------|
| **Offense** | flat_damage, pct_damage, atk_speed, crit_chance, crit_damage, boss_damage |
| **Ability** | ability_damage, cooldown_red, ability_duration, ability_area |
| **Debuff** | debuff_duration, slow_effect, dot_damage, dot_tick_speed |
| **Proc** | pierce_chance, stun_chance, multi_hit, splash_damage, splash_radius |
| **Summon** | summon_damage, aura_range |
| **Economy** | ore_yield, xp_bonus, gold_on_kill, gold_per_wave, starting_gold, extra_lives |
| **Tower** | tower_damage, pct_range |

---

## Progression & Persistence

```mermaid
flowchart TB
    subgraph PlayerData["ProgressionManager (Singleton)"]
        XP[XP & Level<br/>Skill Points]
        TC[Tower Collection<br/>type x rarity -> count, level]
        HC[Hero Collection<br/>hero_id -> stars 0-6]
        Items[Item Inventory<br/>All generated items]
        HEquip[Hero Equipment<br/>hero -> slot -> item_id]
        Skills[Purchased Skills<br/>Global + Hero + Items trees]
        Pity[Gacha Pity Counters]
        Progress[Campaign Progress<br/>Stars + Saved Runs]
    end

    subgraph Save["Save System"]
        Local[Local Save<br/>user://player_progress.dat<br/>Encrypted]
    end

    subgraph Readers["Systems That Read"]
        R1[GameManager<br/>Skill bonuses, lives, gold]
        R2[TowerBase<br/>Tower collection level]
        R3[HeroTower<br/>Equipment bonuses]
        R4[All UI Screens<br/>Display player state]
        R5[WaveManager<br/>Campaign mode config]
    end

    PlayerData --> Local
    Local --> PlayerData
    PlayerData --> R1
    PlayerData --> R2
    PlayerData --> R3
    PlayerData --> R4
    PlayerData --> R5
```

### Skill Tree Paths (5 tabs)

```
GOLD -------- Tower cost reduction, starting gold, gold per wave, gold on kill
TOWER ------- Damage, attack speed, range, crit for all tower types
DEFENSE ----- Extra lives, enemy slow, damage reduction
MINE -------- Ore yield, mine slots, auto-deploy, premium ore bonuses
ITEMS ------- Equipment stat boosts + 3 keystone nodes unlock Ring slots 3/4/5
```

---

## Campaign Structure

```mermaid
flowchart TB
    subgraph Ch1["Chapter 1 - Base Themes (7)"]
        F[Forest] & D[Desert] & T[Tundra] & V[Volcanic] & M[Mystic] & Vo[Void] & E[Elder]
    end

    subgraph Ch2["Chapter 2 - Two-Combos (21)"]
        C2[Forest+Desert<br/>Forest+Tundra<br/>... all pairs]
    end

    subgraph Ch3["Chapter 3 - Three-Combos (35)"]
        C3[Forest+Desert+Tundra<br/>... all triples]
    end

    Ch1 -->|60% stars| Ch2
    Ch2 -->|60% stars| Ch3

    subgraph Level["Per Theme: 5 Levels"]
        L1[L1: 3-5 waves] --> L2[L2: 4-6 waves]
        L2 --> L3[L3: Mid-Boss<br/>+ Augment Pick]
        L3 --> L4[L4: 5-8 waves]
        L4 --> L5[L5: Final Boss<br/>+ Boss Reward]
    end

    subgraph Gimmicks["Terrain Gimmicks"]
        G1[Forest: Enemy regen + vine entangle]
        G2[Desert: 10% tower miss chance]
        G3[Tundra: -15% tower fire rate]
        G4[Volcanic: +20% enemy DR, +25% gold]
        G5[Mystic: Periodic enemy splits]
        G6[Void: Random mine, death clones]
    end
```

### Augment Pick Schedule

| Chapter | Picks | Levels |
|---------|-------|--------|
| Ch1 | 2 | L1, L3 |
| Ch2 | 3 | L1, L3, L4 |
| Ch3 | 4 | L1, L3, L4, L5 |

Later picks offer L6 upgrades of already-chosen augments (weighted).

---

## Economy Flow

```mermaid
flowchart LR
    subgraph Sources["Gold Sources"]
        Kill[Enemy Kills<br/>base * type_mult * wave_scale]
        Mine[Mine Ore Sales<br/>Silver / Iron / Premium]
        Eng[Engineer Passive<br/>+0.5g per hit]
        Start[Starting Gold<br/>20 + skill + equip bonus]
        Boss[Boss Kill Reward<br/>+dmg / +ore / free tower]
    end

    subgraph Pool["Gold Pool"]
        Gold((Gold))
    end

    subgraph Sinks["Gold Sinks"]
        Tower[Tower Placement<br/>10 * 2^tier-1]
        Merge[Merge -> Higher Tier<br/>Indirect cost]
    end

    Sources --> Gold
    Gold --> Sinks

    subgraph Premium["Premium Currency (Gems)"]
        Gacha[Gacha Pulls<br/>100/900 gems]
        Shop[Shop Purchases]
        Reset[Skill Tree Reset<br/>5 gems]
    end

    subgraph MineDetail["Mine System"]
        Silver[Silver Ore<br/>2 waves, $2-4]
        Iron[Iron Ore<br/>3 waves, $3-6]
        Prem[Premium Ore<br/>4 waves, $6-13<br/>Themed per terrain]
    end

    MineDetail --> Mine
```

---

## Signal & Event Architecture

```mermaid
flowchart TB
    subgraph Input["Player Input"]
        Tap[Tap Grid Cell]
        Build[Build Tower Button]
        MergeBtn[Merge Button]
        StartWave[Start Wave Button]
    end

    subgraph Signals["Signal Flow"]
        Tap --> GridClick[GridManager.cell_clicked]
        Build --> GMBuild[GameManager._on_build_tower_pressed]
        MergeBtn --> MMMerge[MergeManager.perform_merge]
        StartWave --> GMWave[GameManager._do_start_wave]
    end

    subgraph Updates["State Updates"]
        GMBuild --> PlaceTower[GridManager.place_tower]
        PlaceTower --> TowerPlaced[tower_placed signal]
        TowerPlaced --> Render[GridRenderer3D.render_tower]

        MMMerge --> MergeOcc[merge_occurred signal]
        MergeOcc --> RenderMerge[GridRenderer3D.update_tower]

        GMWave --> WMStart[WaveManager.start_wave]
        WMStart --> WaveStarted[wave_started signal]
    end

    subgraph Feedback["UI Feedback"]
        GoldChanged[gold_changed signal] --> GoldLabel[HUD Gold Label]
        LivesChanged[lives_changed signal] --> LivesLabel[HUD Lives Label]
        WaveStarted --> WaveLabel[HUD Wave Label]
        AchUnlocked[achievement_unlocked signal] --> Toast[Toast Notification]
    end
```

---

## File Dependency Map

```
game_manager.gd (5,670 lines) ─── Master orchestrator
  ├── GridManager ─── 12x12 grid, cell types, coordinate conversion
  │   └── GridRenderer3D ─── 3D terrain + tower mesh rendering
  ├── WaveManager ─── Wave spawning, enemy queue, boss cycling
  ├── MergeManager ─── 2-merge system (2 towers -> 1 higher tier)
  ├── HeroTower ─── Hero placement + ability dispatch
  ├── TowerBase (3,744 lines) ─── 8 tower types, targeting, augment checks
  │   ├── Projectile (1,507 lines) ─── Flight, on-hit, augment procs
  │   └── Minion ─── Summoner-spawned units
  ├── EnemyBase (1,812 lines) ─── 17 enemy types, debuffs, death procs
  └── ProgressionManager (3,100 lines) ─── All persistent player data
      ├── ItemData ─── Enums, affix pools, set definitions
      ├── ItemGenerator ─── Procedural item generation
      ├── HeroData ─── 6 hero config dicts
      ├── AugmentData (1,388 lines) ─── 86 augment definitions
      ├── CampaignData ─── 63 themes, gimmicks, level scheduling
      └── GachaData ─── Pull rates, pity, rarity scaling
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Engine | Godot 4.x |
| Language | GDScript |
| Rendering | 3D (Forward+) |
| Target | Mobile (Android/iOS), 768x1280 portrait |
| Save System | Encrypted local file (AES) |
| Audio | SfxManager singleton, .ogg/.wav |
| VFX | Custom particle scenes + Binbun VFX pack |
| Models | KayKit character/weapon packs, custom .glb |
| Analytics | Firebase |
| Ads | AdMob |
| Auth | Firebase Authentication |
