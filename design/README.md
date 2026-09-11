# Design system — LB’XMB mobile

Référence des tokens et composants de l’application. Tout est typé dans `ui/theme` et
`ui/components` : **aucune couleur, taille ou police ne doit être écrite en dur** dans un
écran.

## Sources

Deux maquettes ont servi de référence à l’implémentation et sont à redéposer ici :

| Fichier | Contenu |
|---|---|
| `lbxmb.png` | Écran de bienvenue / consentement (`app/bienvenue.tsx`) |
| `navbar.png` | Barre de navigation flottante à 4 onglets (`components/layout/TabBar.tsx`) |

Le langage visuel reprend celui de [Papillon](https://github.com/PapillonApp/Papillon) :
fond sombre profond, cartes aérées bordées d’un filet clair, coins très arrondis en
`continuous`, typographie affirmée et animations ressort discrètes.

## Assets générés

Tous dérivés du logo LB’XMB :

| Fichier | Format | Usage |
|---|---|---|
| `assets/images/icon.png` | 1024×1024, **sans alpha** | Icône iOS et Android historique |
| `assets/images/adaptive-icon.png` | 1024×1024, alpha | Avant-plan Android, logo à 60 % pour la zone sûre |
| `assets/images/splash-icon.png` | 720×418, alpha | Écran de lancement, affiché à 220 dp |
| `assets/images/logo.png` | 640×372, alpha | Wordmark dans l’application |
| `design/store/feature-graphic.png` | 1024×500, sans alpha | Bannière Google Play |

L’icône iOS ne doit **jamais** avoir de canal alpha : le fond `#07080B` y est
aplati. L’avant-plan adaptatif Android, lui, garde sa transparence et réserve le
tiers extérieur, masqué par le système.

## Couleurs

Définies dans `ui/theme/palette.ts`, alignées sur les tokens du site
(`web/src/app/globals.css`). Deux palettes complètes : `dark` (par défaut) et `light`.

| Token | Sombre | Clair | Usage |
|---|---|---|---|
| `background` | `#07080B` | `#FFFFFF` | Fond d’écran |
| `overground` | `#0B0D12` | `#F3F5F9` | Fond de feuille / section groupée |
| `card` | `#11131A` | `#FFFFFF` | Cartes et listes |
| `item` | `#161923` | `#FFFFFF` | Lignes, champs, boutons ronds |
| `glass` | `rgba(255,255,255,.06)` | `rgba(10,11,15,.04)` | Surfaces translucides |
| `primary` | `#3B82F6` | `#1D63D8` | Accent interactif |
| `accent` | `#F97316` | `#EA6A0C` | Accent secondaire (catalogue) |
| `text` | `#FFFFFF` | `#0A0B0F` | Texte principal |
| `textSecondary` | 58 % | 58 % | Texte secondaire |
| `textTertiary` | 38 % | 38 % | Métadonnées, libellés |
| `border` | 9 % | 9 % | Bordures |
| `success` / `warning` / `danger` | `#22C55E` / `#F59E0B` / `#FF4D4D` | assombris | États |

### Couleurs de console

`platformColor(platform)` associe une plateforme à sa couleur de marque, comme les tokens
`--color-brand-*` du site :

| Famille | Couleur |
|---|---|
| PlayStation (PS2 → PS5, PSP, PS Vita) | `#0072CE` |
| Xbox (360, One, Series) | `#107C10` |
| Nintendo (Switch, Wii, DS, 3DS) | `#E60012` |
| Windows / PC | `#0F8AE0` |
| Autre | `#7C7F8A` |

Elles teintent les pastilles de plateforme, les bordures de carte, le halo d’en-tête et le
bouton de téléchargement de la fiche ressource.

## Typographie

Deux familles, comme sur le site : **Syne** porte la marque, **Inter** assure la lisibilité
des textes longs.

| Variante | Police | Taille | Usage |
|---|---|---|---|
| `display` | Syne ExtraBold | 32 | Titre de l’écran de bienvenue |
| `h1` | Syne Bold | 26 | Titre d’écran |
| `h2` | Syne Bold | 21 | Titre de section |
| `h3` | Syne SemiBold | 17 | Titre de carte |
| `title` | Syne SemiBold | 15.5 | Ligne de liste |
| `body` | Inter Regular | 15 | Paragraphe |
| `bodyStrong` | Inter SemiBold | 15 | Valeur mise en avant |
| `caption` | Inter Regular | 13 | Texte secondaire |
| `captionStrong` | Inter SemiBold | 13 | Pastille, libellé |
| `label` | Syne Bold | 11 | Étiquette capitale espacée |
| `button` | Syne Bold | 16 | Bouton |
| `mono` | Inter Medium | 12 | Compteurs, versions |

## Espacements et rayons

```
spacing   xs 4 · sm 8 · md 12 · lg 16 · xl 20 · 2xl 24 · 3xl 32 · 4xl 44
radius    sm 8 · md 12 · lg 16 · xl 20 · 2xl 26 · pill 999
```

- Marge horizontale d’écran : `screenPadding` (16)
- Rayon de carte : `radius.xl` avec `borderCurve: 'continuous'`
- Boutons et pastilles : `radius.pill`
- Réserve basse pour la barre flottante : `tabBarHeight + tabBarInset + insets.bottom`

## Composants (`ui/components`)

| Composant | Rôle |
|---|---|
| `Screen` | Conteneur racine : fond + halo d’accent optionnel |
| `Typography` | Texte typé (`variant`, `color`, `align`) |
| `Stack` | Helper flexbox (`direction`, `gap`, `align`, `justify`) |
| `Card` | Surface élevée, variante `glass`, bordure d’accent |
| `List` / `List.Item` / `List.SectionTitle` | Listes groupées façon réglages iOS |
| `Button` | 5 variantes, 3 tailles, état de chargement |
| `Chip` | Pastille de filtre, plateforme ou tag (`uppercase`, `selected`) |
| `AnimatedPressable` | Retour tactile ressort + haptique |
| `Sheet` | Feuille basse avec poignée et glisser-pour-fermer |
| `SearchField` | Champ de recherche arrondi avec effacement |
| `SectionHeader` | Titre de section avec action « Tout voir » |
| `IconBadge` | Carré arrondi contenant une icône |
| `Skeleton` | Placeholder pulsé |
| `EmptyState` / `ErrorState` | États vides et erreurs réseau |
| `Divider` | Filet de séparation |

## Animations

Centralisées dans `ui/animation.ts`.

| Preset | Réglage | Usage |
|---|---|---|
| `spring` | damping 20, stiffness 300 | Défaut des transitions de layout |
| `list` | 240 ms, `Easing.out(exp)` | Apparition / réorganisation de listes |
| `smooth` | damping 24, stiffness 220 | Contenus dépliables |

Conventions :

- Apparition de liste : `FadeIn` avec un délai de 35–50 ms par ligne, plafonné
  (`staggerDelay`)
- Écran de bienvenue : `FadeInDown` en cascade sur le héros puis les cartes de choix
- Appui : réduction à 0.97 et opacité 0.75, plus une impulsion haptique `Soft`
- Barre d’onglets : la pastille active glisse en ressort (damping 20, stiffness 240)

## Barre de navigation

Conformément à `navbar.png` : pastille flottante centrée, quatre onglets
(**Accueil**, **Catalogue**, **Recherche**, **Profil**), icônes Lucide `House`, `Box`,
`Search` et `UserPen`. Le flou (`expo-blur`) est doublé d’un fond semi-opaque pour rester
lisible au-dessus des visuels clairs, et l’onglet actif est marqué par une pastille
colorée animée.

## Règles

1. Passer par `useTheme()` / `useColors()` — jamais de littéral de couleur.
2. Utiliser les tokens `spacing` et `radius` pour toute géométrie.
3. Toujours associer `borderCurve: 'continuous'` à un rayon important.
4. Chaque écran prévoit ses trois états : chargement (squelette), erreur (`ErrorState`) et
   vide (`EmptyState`).
5. Les listes de plus de dix éléments passent par `FlashList`.
