# Component checklist

GENERATED from `design-system/projects/kinnijije-v2/components.md`.
Rebuild with `python3 docs/build-checklist.py`.

**151 of 437 ticked — 286 to build.**

The manifest declares 500 entries; this parses 437 of them. The ~60 it misses
are ones written as prose asides rather than in a `·` run — they are covered by
the section counts in `GAP-AUDIT.md` and none is a whole component family.

A tick means a component with a matching name is exported from `src/ui`. It does
NOT mean every state in the spec is covered — that is a separate audit (step 7).

---

## Consumer — 111/256

### Phase 2 — Pantry & stock — 6/14

- [x] Stock item
- [x] Stock level
- [ ] Stock count
- [x] Freshness
- [ ] Expiry chip
- [x] Storage tag
- [ ] Row stock
- [ ] Row low stock
- [x] Row market
- [ ] Stock group
- [ ] Stock summary
- [x] Restock suggestion
- [ ] Shelf life
- [ ] Stock empty

### Phase 2 — AI chat — 7/10

- [x] Chat user
- [x] Chat ai
- [x] Chat thinking
- [x] Chat composer
- [ ] Chat suggestion
- [x] Chat citation
- [ ] Chat meal
- [ ] Chat stock
- [x] Chat error
- [x] Chat disclaimer

### Phase 2 — Insight — 5/8

- [x] Insight card
- [x] Insight evidence
- [ ] Nutrition balance
- [x] Week strip
- [x] Streak
- [ ] Spend estimate
- [ ] Repeat meal
- [x] Variety meter

### Phase 2 — Planning — 4/6

- [x] Mood picker
- [x] Constraint chip
- [x] Meal slot
- [ ] Day column
- [ ] Plan summary
- [x] Portion scaler

### Phase 2 — Email — 5/5

- [x] Email shell
- [x] Email header
- [x] Email button
- [x] Email card
- [x] Email footer

### Actions — 9/18

- [x] Button
- [ ] Button icon-only
- [x] Button pill
- [x] Button group
- [ ] Button dock
- [x] Filter chip
- [ ] Segmented control
- [x] Link nav
- [x] Link action
- [x] Link menu
- [ ] Suggest-meals CTA
- [ ] Quick-reply chip
- [x] FAB
- [ ] Press-state spec
- [ ] Loading-button cross-fade
- [x] Continue bar
- [ ] Hold-to-confirm button
- [ ] Icon-button with badge

### Inputs — 24/32

- [x] Text
- [ ] Search
- [x] Textarea
- [x] Stepper
- [x] Number
- [ ] Select/dropdown
- [x] Combobox
- [x] Multi-select
- [x] Checkbox
- [ ] Checkbox group
- [x] Radio
- [x] Radio group
- [x] Switch
- [x] Chip input
- [x] Voice capture
- [x] Photo capture
- [ ] Multi-shot tray
- [x] File upload
- [x] Rating
- [x] Date
- [x] Time
- [x] Date-range
- [x] OTP
- [x] Password
- [ ] Password-strength bar
- [ ] Form+Field wrapper
- [x] Slider
- [x] Cuisine picker
- [x] Difficulty picker
- [x] Measurement toggle
- [ ] Portion stepper
- [ ] Ingredient quantity editor

### Data display — 14/46

- [ ] Stat standard
- [ ] Stat compact
- [ ] Stat icon-led
- [ ] Key-value inline
- [x] Data split
- [ ] Title+value
- [x] Meal card
- [ ] Meal card compact
- [ ] Meal card horizontal
- [ ] Recipe hero
- [ ] Ingredient card
- [ ] Recent card
- [ ] Match line
- [ ] Have/need split
- [x] Honesty bar
- [x] Avatar
- [ ] Avatar group
- [x] Chart bar
- [x] Chart line
- [x] Sparkline
- [x] Progress-with-content
- [x] Table
- [ ] Title+description
- [ ] Title+metadata
- [ ] Overline+title
- [ ] Header label
- [ ] Header trailing
- [ ] Byline
- [ ] Content caption
- [ ] Sentiment icon+text
- [x] Metadata group
- [ ] Collection summary
- [ ] Summary tags
- [x] Accordion
- [x] Media container
- [ ] Media item
- [x] Banner
- [x] Timeline
- [ ] Step list
- [ ] Nutrition strip
- [ ] Cook-time breakdown
- [ ] Serves adjuster readout
- [ ] Cuisine tag group
- [ ] Last-refreshed line
- [ ] Empty-list inline
- [ ] Rating summary

### Status & lifecycle — 2/18

- [ ] Recipe source
- [ ] Recipe status
- [ ] Hero image kind
- [x] Difficulty
- [ ] Difficulty floor
- [ ] Match strength
- [ ] Approximate marker
- [x] Have/need
- [ ] User status
- [ ] User role
- [ ] Feedback status
- [ ] Feedback target kind
- [ ] AI call kind
- [ ] AI call status
- [ ] Extraction kind
- [ ] Feature-flag state
- [ ] Measurement system
- [ ] Verified badge

### Feedback & overlays — 15/30

- [x] Badge
- [x] Tag
- [ ] Notification callout
- [ ] Notification banner
- [x] Toast
- [ ] Feedback message
- [ ] Progress linear
- [x] Progress circular
- [ ] Progress stepper
- [ ] Cooking-pot loader
- [x] Empty state
- [x] Empty state
- [x] Error state
- [x] Error state
- [ ] Inline field error
- [ ] Status message
- [ ] Countdown timer
- [x] Tooltip
- [x] Popover
- [x] Modal
- [x] Modal
- [x] Modal
- [x] Modal
- [ ] Bottom sheet
- [ ] Side sheet
- [ ] Full-screen takeover
- [x] Success moment
- [ ] Congratulatory takeover
- [ ] Offline banner
- [ ] Feature-disabled state

### Navigation — 5/14

- [x] App bar
- [ ] App bar scroll-aware
- [ ] Bottom tab bar
- [ ] Sidebar nav
- [ ] Breadcrumb
- [x] Tabs
- [x] Menu
- [x] Cursor pager
- [ ] Page control
- [ ] Back link
- [x] Section header
- [ ] Screen shell
- [ ] Tab-switch transition
- [ ] Skip link

### Structure & rows — 15/44

- [x] Card
- [x] Card
- [ ] Carousel
- [x] Drawer
- [ ] List container
- [ ] Listbox
- [ ] Prompt hero
- [ ] Tile
- [ ] Divider
- [ ] Flex/Stack
- [ ] Grid
- [ ] Toolbar
- [ ] Dish  + Photo/Provenance/Match/Meta/Actions slots
- [ ] saved-recipe
- [x] ingredient-have
- [x] ingredient-need
- [x] step
- [ ] substep
- [x] person
- [ ] notification
- [x] cuisine
- [ ] recent-search
- [ ] market-item
- [ ] feedback
- [x] extraction
- [ ] session
- [ ] nutrition
- [x] timer
- [x] Row — recipe
- [ ] Row — saved-recipe
- [x] Row — ingredient-have
- [x] Row — ingredient-need
- [x] Row — step
- [ ] Row — substep
- [x] Row — person
- [ ] Row — notification
- [ ] Row — cuisine
- [ ] Row — recent-search
- [ ] Row — market-item
- [ ] Row — feedback
- [ ] Row — extraction
- [ ] Row — session
- [ ] Row — nutrition
- [ ] Row — timer

### Scenes — 0/11

- [ ] Kitchen input — the three methods
- [ ] The three-suggestion reveal
- [ ] Recipe detail — have/need split, steps, action bar
- [ ] Cook mode with a timer running
- [ ] Favourites — saved, cooked-again, unsave
- [ ] Settings — prefs, measurement, delete account
- [ ] Onboarding — cuisines, difficulty, confirm
- [ ] Auth — landing, sign-up, log-in
- [ ] Offline: cached favourites, blocked suggest
- [ ] Empty kitchen → first suggestion
- [ ] Extraction failure → typed fallback

## Admin — 37/114

### Actions — 4/9

- [x] Button
- [x] Icon button
- [x] Button group
- [ ] Bulk-action bar
- [x] Filter chip
- [ ] Segmented range
- [ ] Export button
- [ ] Danger action
- [ ] Row action menu

### Inputs — 9/17

- [x] Text
- [ ] Search
- [x] Select
- [x] Multi-select
- [x] Date-range
- [x] Number
- [x] Textarea
- [x] Checkbox
- [x] Radio
- [x] Switch
- [ ] Filter tabs
- [ ] Column settings
- [ ] Markdown editor
- [ ] Reason/rejection input
- [ ] Ingredient row editor
- [ ] Step row editor
- [ ] JSON editor

### Data display — 6/24

- [ ] KPI cell
- [ ] KPI strip
- [ ] Data table
- [ ] Table cell
- [ ] Table cell
- [ ] Table cell
- [ ] Table cell
- [ ] Table cell
- [ ] Table cell
- [ ] Cursor pagination
- [ ] Detail drawer
- [ ] Detail row
- [ ] Info card
- [x] Line chart
- [x] Bar chart
- [x] Sparkline
- [ ] Stat delta
- [x] JSON inspector
- [x] Diff view
- [ ] Audit entry
- [x] Timeline
- [ ] Metric tile
- [ ] Cost ledger line
- [ ] Empty-or-error

### Status & lifecycle — 0/10

- [ ] One unified status component + 9 lifecycle mappings
- [ ] Status mapping — recipe
- [ ] Status mapping — recipe-source
- [ ] Status mapping — user
- [ ] Status mapping — role
- [ ] Status mapping — feedback
- [ ] Status mapping — feedback-target
- [ ] Status mapping — ai-kind
- [ ] Status mapping — ai-result
- [ ] Status mapping — flag

### Feedback & overlays — 12/14

- [x] Toast
- [x] Banner
- [x] Callout
- [x] Modal
- [x] Modal
- [x] Modal
- [ ] Confirm modal
- [ ] Form modal
- [x] Drawer
- [x] Popover
- [x] Tooltip
- [x] Progress
- [x] Skeleton
- [x] Error state

### Navigation — 2/11

- [ ] Admin shell
- [x] Sidebar
- [ ] Topbar
- [ ] Global search
- [ ] Breadcrumb
- [x] Tabs
- [ ] Page header
- [ ] Back link
- [ ] Nav badge
- [ ] Operator footer
- [ ] Section nav

### Structure & rows — 4/19

- [x] Card
- [x] Panel
- [x] Section header
- [ ] Split layout
- [ ] List+detail+aside
- [ ] Divider
- [ ] Grid
- [ ] Stack
- [ ] Toolbar
- [ ] Filter rail
- [x] user
- [ ] ai-audit
- [ ] feedback
- [ ] flag
- [ ] Board row — recipe
- [ ] Board row — user
- [ ] Board row — ai-audit
- [ ] Board row — feedback
- [ ] Board row — flag

### Scenes — 0/10

- [ ] Recipe review → edit → publish
- [ ] Prompt editor with the version diff and the platform-wide warning
- [ ] AI audit detail — went-in / came-out
- [ ] Dashboard: KPI strip, AI spend, seed coverage
- [ ] Recipe board with filter tabs and cursor pagination
- [ ] Feedback queue → the flagged step in context → correction
- [ ] User detail with suspend behind a typed confirm
- [ ] Feature flags with impact notices
- [ ] Empty states across all four boards
- [ ] Extraction viewer — the photo the cook uploaded and what the AI read

## Site — 3/67

### Scenes — 0/3

- [ ] The full landing page, assembled from the recommended variant of each family
- [ ] The pricing page
- [ ] About / trust page

### Header / nav — 1/6

- [ ] transparent-over-hero
- [ ] solid
- [ ] centred logo
- [x] with CTA
- [ ] mega-menu
- [ ] mobile drawer

### Hero — 0/7

- [ ] centred colossal
- [ ] split with app shot
- [ ] with the kitchen-input demo live
- [ ] video
- [ ] blobatar-led
- [ ] testimonial-led
- [ ] low-key for returning visitors

### Problem / agitation — 0/5

- [ ] three-panel
- [ ] before/after
- [ ] stat-led
- [ ] quote-led
- [ ] the-fridge-photo

### How it works — 0/6

- [ ] 3-step horizontal
- [ ] vertical timeline
- [ ] sticky-scroll
- [ ] tabbed
- [ ] animated demo
- [ ] numbered cards

### Feature showcase — 0/7

- [ ] alternating rows
- [ ] bento grid
- [ ] carousel
- [ ] tabbed
- [ ] icon grid
- [ ] big-screenshot
- [ ] comparison

### Social proof — 0/6

- [ ] logo wall
- [ ] testimonial cards
- [ ] single big quote
- [ ] star summary
- [ ] counter row
- [ ] press strip

### Recipe gallery — 0/5

- [ ] grid
- [ ] carousel
- [ ] masonry
- [ ] category tabs
- [ ] search-preview

### Pricing — 0/6

- [ ] two-tier
- [ ] three-tier
- [ ] single free-tier
- [ ] comparison table
- [ ] toggle monthly/yearly
- [ ] FAQ-adjacent

### FAQ — 1/5

- [x] accordion
- [ ] two-column
- [ ] categorised
- [ ] search-first
- [ ] inline-with-CTA

### Final CTA — 1/6

- [ ] full-bleed sky
- [ ] centred card
- [x] split
- [ ] with app-store badges
- [ ] newsletter
- [ ] blobatar-led

### Footer — 0/5

- [ ] full sitemap
- [ ] minimal
- [ ] with newsletter
- [ ] with app badges
- [ ] legal-heavy
