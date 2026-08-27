# Component checklist

GENERATED from `design-system/projects/kinnijije-v2/components.md`.
Rebuild with `python3 docs/build-checklist.py`.

**418 of 418 ticked — 0 to build.**

The manifest declares 500 entries; this parses 437 of them. The ~60 it misses
are ones written as prose asides rather than in a `·` run — they are covered by
the section counts in `GAP-AUDIT.md` and none is a whole component family.

A tick means a component with a matching name is exported from `src/ui`. It does
NOT mean every state in the spec is covered — that is a separate audit (step 7).

---

## Consumer — 241/241

### Phase 2 — Pantry & stock — 14/14

- [x] Stock item
- [x] Stock level
- [x] Stock count
- [x] Freshness
- [x] Expiry chip
- [x] Storage tag
- [x] Row stock
- [x] Row low stock
- [x] Row market
- [x] Stock group
- [x] Stock summary
- [x] Restock suggestion
- [x] Shelf life
- [x] Stock empty

### Phase 2 — AI chat — 10/10

- [x] Chat user
- [x] Chat ai
- [x] Chat thinking
- [x] Chat composer
- [x] Chat suggestion
- [x] Chat citation
- [x] Chat meal
- [x] Chat stock
- [x] Chat error
- [x] Chat disclaimer

### Phase 2 — Insight — 8/8

- [x] Insight card
- [x] Insight evidence
- [x] Nutrition balance
- [x] Week strip
- [x] Streak
- [x] Spend estimate
- [x] Repeat meal
- [x] Variety meter

### Phase 2 — Planning — 6/6

- [x] Mood picker
- [x] Constraint chip
- [x] Meal slot
- [x] Day column
- [x] Plan summary
- [x] Portion scaler

### Phase 2 — Email — 5/5

- [x] Email shell
- [x] Email header
- [x] Email button
- [x] Email card
- [x] Email footer

### Actions — 18/18

- [x] Button
- [x] Button icon-only
- [x] Button pill
- [x] Button group
- [x] Button dock
- [x] Filter chip
- [x] Segmented control
- [x] Link nav
- [x] Link action
- [x] Link menu
- [x] Suggest-meals CTA
- [x] Quick-reply chip
- [x] FAB
- [x] Press-state spec
- [x] Loading-button cross-fade
- [x] Continue bar
- [x] Hold-to-confirm button
- [x] Icon-button with badge

### Inputs — 32/32

- [x] Text
- [x] Search
- [x] Textarea
- [x] Stepper
- [x] Number
- [x] Select/dropdown
- [x] Combobox
- [x] Multi-select
- [x] Checkbox
- [x] Checkbox group
- [x] Radio
- [x] Radio group
- [x] Switch
- [x] Chip input
- [x] Voice capture
- [x] Photo capture
- [x] Multi-shot tray
- [x] File upload
- [x] Rating
- [x] Date
- [x] Time
- [x] Date-range
- [x] OTP
- [x] Password
- [x] Password-strength bar
- [x] Form+Field wrapper
- [x] Slider
- [x] Cuisine picker
- [x] Difficulty picker
- [x] Measurement toggle
- [x] Portion stepper
- [x] Ingredient quantity editor

### Data display — 46/46

- [x] Stat standard
- [x] Stat compact
- [x] Stat icon-led
- [x] Key-value inline
- [x] Data split
- [x] Title+value
- [x] Meal card
- [x] Meal card compact
- [x] Meal card horizontal
- [x] Recipe hero
- [x] Ingredient card
- [x] Recent card
- [x] Match line
- [x] Have/need split
- [x] Honesty bar
- [x] Avatar
- [x] Avatar group
- [x] Chart bar
- [x] Chart line
- [x] Sparkline
- [x] Progress-with-content
- [x] Table
- [x] Title+description
- [x] Title+metadata
- [x] Overline+title
- [x] Header label
- [x] Header trailing
- [x] Byline
- [x] Content caption
- [x] Sentiment icon+text
- [x] Metadata group
- [x] Collection summary
- [x] Summary tags
- [x] Accordion
- [x] Media container
- [x] Media item
- [x] Banner
- [x] Timeline
- [x] Step list
- [x] Nutrition strip
- [x] Cook-time breakdown
- [x] Serves adjuster readout
- [x] Cuisine tag group
- [x] Last-refreshed line
- [x] Empty-list inline
- [x] Rating summary

### Status & lifecycle — 18/18

- [x] Recipe source
- [x] Recipe status
- [x] Hero image kind
- [x] Difficulty
- [x] Difficulty floor
- [x] Match strength
- [x] Approximate marker
- [x] Have/need
- [x] User status
- [x] User role
- [x] Feedback status
- [x] Feedback target kind
- [x] AI call kind
- [x] AI call status
- [x] Extraction kind
- [x] Feature-flag state
- [x] Measurement system
- [x] Verified badge

### Feedback & overlays — 30/30

- [x] Badge
- [x] Tag
- [x] Notification callout
- [x] Notification banner
- [x] Toast
- [x] Feedback message
- [x] Progress linear
- [x] Progress circular
- [x] Progress stepper
- [x] Cooking-pot loader
- [x] Empty state
- [x] Empty state — filtered
- [x] Error state — cold
- [x] Error state — warm
- [x] Inline field error
- [x] Status message
- [x] Countdown timer
- [x] Tooltip
- [x] Popover
- [x] Modal — confirm
- [x] Modal — irreversible
- [x] Modal — form
- [x] Modal — session timeout
- [x] Bottom sheet
- [x] Side sheet
- [x] Full-screen takeover
- [x] Success moment
- [x] Congratulatory takeover
- [x] Offline banner
- [x] Feature-disabled state

### Navigation — 14/14

- [x] App bar
- [x] App bar scroll-aware
- [x] Bottom tab bar
- [x] Sidebar nav
- [x] Breadcrumb
- [x] Tabs
- [x] Menu
- [x] Cursor pager
- [x] Page control
- [x] Back link
- [x] Section header
- [x] Screen shell
- [x] Tab-switch transition
- [x] Skip link

### Structure & rows — 29/29

- [x] Card
- [x] Card — promotional
- [x] Carousel
- [x] Drawer
- [x] List container
- [x] Listbox
- [x] Prompt hero
- [x] Tile
- [x] Divider
- [x] Flex/Stack
- [x] Grid
- [x] Toolbar
- [x] Dish  + Photo/Provenance/Match/Meta/Actions slots
- [x] Row — recipe
- [x] Row — saved-recipe
- [x] Row — ingredient-have
- [x] Row — ingredient-need
- [x] Row — step
- [x] Row — substep
- [x] Row — person
- [x] Row — notification
- [x] Row — cuisine
- [x] Row — recent-search
- [x] Row — market-item
- [x] Row — feedback
- [x] Row — extraction
- [x] Row — session
- [x] Row — nutrition
- [x] Row — timer

### Scenes — 11/11

- [x] Kitchen input — the three methods
- [x] The three-suggestion reveal
- [x] Recipe detail — have/need split, steps, action bar
- [x] Cook mode with a timer running
- [x] Favourites — saved, cooked-again, unsave
- [x] Settings — prefs, measurement, delete account
- [x] Onboarding — cuisines, difficulty, confirm
- [x] Auth — landing, sign-up, log-in
- [x] Offline: cached favourites, blocked suggest
- [x] Empty kitchen → first suggestion
- [x] Extraction failure → typed fallback

## Admin — 110/110

### Actions — 9/9

- [x] Button
- [x] Icon button
- [x] Button group
- [x] Bulk-action bar
- [x] Filter chip
- [x] Segmented range
- [x] Export button
- [x] Danger action
- [x] Row action menu

### Inputs — 17/17

- [x] Text
- [x] Search
- [x] Select
- [x] Multi-select
- [x] Date-range
- [x] Number
- [x] Textarea
- [x] Checkbox
- [x] Radio
- [x] Switch
- [x] Filter tabs
- [x] Column settings
- [x] Markdown editor
- [x] Reason/rejection input
- [x] Ingredient row editor
- [x] Step row editor
- [x] JSON editor

### Data display — 24/24

- [x] KPI cell
- [x] KPI strip
- [x] Data table
- [x] Table cell — avatar+name
- [x] Table cell — amount
- [x] Table cell — status
- [x] Table cell — date
- [x] Table cell — ref
- [x] Table cell — actions
- [x] Cursor pagination
- [x] Detail drawer
- [x] Detail row
- [x] Info card
- [x] Line chart
- [x] Bar chart
- [x] Sparkline
- [x] Stat delta
- [x] JSON inspector
- [x] Diff view
- [x] Audit entry
- [x] Timeline
- [x] Metric tile
- [x] Cost ledger line
- [x] Empty-or-error

### Status & lifecycle — 10/10

- [x] One unified status component + 9 lifecycle mappings
- [x] Status mapping — recipe
- [x] Status mapping — recipe-source
- [x] Status mapping — user
- [x] Status mapping — role
- [x] Status mapping — feedback
- [x] Status mapping — feedback-target
- [x] Status mapping — ai-kind
- [x] Status mapping — ai-result
- [x] Status mapping — flag

### Feedback & overlays — 14/14

- [x] Toast
- [x] Banner
- [x] Callout
- [x] Modal
- [x] Modal — publish
- [x] Modal — prompt version
- [x] Confirm modal
- [x] Form modal
- [x] Drawer
- [x] Popover
- [x] Tooltip
- [x] Progress
- [x] Skeleton
- [x] Error state

### Navigation — 11/11

- [x] Admin shell
- [x] Sidebar
- [x] Topbar
- [x] Global search
- [x] Breadcrumb
- [x] Tabs
- [x] Page header
- [x] Back link
- [x] Nav badge
- [x] Operator footer
- [x] Section nav

### Structure & rows — 15/15

- [x] Card
- [x] Panel
- [x] Section header
- [x] Split layout
- [x] List+detail+aside
- [x] Divider
- [x] Grid
- [x] Stack
- [x] Toolbar
- [x] Filter rail
- [x] Board row — recipe
- [x] Board row — user
- [x] Board row — ai-audit
- [x] Board row — feedback
- [x] Board row — flag

### Scenes — 10/10

- [x] Recipe review → edit → publish
- [x] Prompt editor with the version diff and the platform-wide warning
- [x] AI audit detail — went-in / came-out
- [x] Dashboard: KPI strip, AI spend, seed coverage
- [x] Recipe board with filter tabs and cursor pagination
- [x] Feedback queue → the flagged step in context → correction
- [x] User detail with suspend behind a typed confirm
- [x] Feature flags with impact notices
- [x] Empty states across all four boards
- [x] Extraction viewer — the photo the cook uploaded and what the AI read

## Site — 67/67

### Scenes — 3/3

- [x] The full landing page, assembled from the recommended variant of each family
- [x] The pricing page
- [x] About / trust page

### Header / nav — 6/6

- [x] transparent-over-hero
- [x] solid
- [x] centred logo
- [x] with CTA
- [x] mega-menu
- [x] mobile drawer

### Hero — 7/7

- [x] centred colossal
- [x] split with app shot
- [x] with the kitchen-input demo live
- [x] video
- [x] blobatar-led
- [x] testimonial-led
- [x] low-key for returning visitors

### Problem / agitation — 5/5

- [x] three-panel
- [x] before/after
- [x] stat-led
- [x] quote-led
- [x] the-fridge-photo

### How it works — 6/6

- [x] 3-step horizontal
- [x] vertical timeline
- [x] sticky-scroll
- [x] tabbed
- [x] animated demo
- [x] numbered cards

### Feature showcase — 7/7

- [x] alternating rows
- [x] bento grid
- [x] carousel
- [x] tabbed
- [x] icon grid
- [x] big-screenshot
- [x] comparison

### Social proof — 6/6

- [x] logo wall
- [x] testimonial cards
- [x] single big quote
- [x] star summary
- [x] counter row
- [x] press strip

### Recipe gallery — 5/5

- [x] grid
- [x] carousel
- [x] masonry
- [x] category tabs
- [x] search-preview

### Pricing — 6/6

- [x] two-tier
- [x] three-tier
- [x] single free-tier
- [x] comparison table
- [x] toggle monthly/yearly
- [x] FAQ-adjacent

### FAQ — 5/5

- [x] accordion
- [x] two-column
- [x] categorised
- [x] search-first
- [x] inline-with-CTA

### Final CTA — 6/6

- [x] full-bleed sky
- [x] centred card
- [x] split
- [x] with app-store badges
- [x] newsletter
- [x] blobatar-led

### Footer — 5/5

- [x] full sitemap
- [x] minimal
- [x] with newsletter
- [x] with app badges
- [x] legal-heavy
