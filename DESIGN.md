To align with shadcn/ui and a professional fintech aesthetic, we are moving away from custom CSS/heavy borders and toward a Radix UI-based architecture. This approach uses standard tokens, high-quality iconography, and a focus on accessibility.Monaradi Design System (v3.0)Framework: Vue.js 3 + Tailwind CSSComponent Library: shadcn/ui (Radix Vue)Iconography: Lucide-Vue-Next1. Visual LanguageAesthetic: High-density, minimalist, corporate fintech.Spacing: Strict 4px (1 unit) grid system. Consistent p-4, p-6, or p-8.Radius: rounded-md (6px) for a sharp, professional look. Avoid rounded-xl.Borders: Use border-input or border-border with a opacity of 50-80% for a "light" feel.2. Color Tokens (Shadcn Compatible)Using a Slate/Blue hybrid for trust and clarity.VariableLight ModeDark ModePurposeBackground#FFFFFF#020617Main canvasMuted#F8FAFC#1E293BSidebars & subtle backgroundsPrimary#2563EB#3B82F6Main CTA and active statesForeground#0F172A#F8FAFCHeadings & primary textAccent#F1F5F9#1E293BHover states3. Component ArchitectureA. Navigation (Sidebar)Library: ScrollArea (shadcn)UX: Use a fixed-width 240px sidebar.Active State: No background color change; instead, use a vertical blue bar on the left and a weight change to the text.Icons: Lucide 20px with stroke-width="1.5".B. Stat Cards (Metrics)Library: Card (shadcn)Layout: Vertical stacking. Label at the top in text-muted-foreground (12px), large bold value in the center, and a secondary metric at the bottom (e.g., area in $m^2$).Icon: Place a single, monochromatic Lucide icon in the top right corner of the card.C. Data Tables (The Core)Library: Table (shadcn)Rule: Remove all vertical borders. Use only horizontal 1px borders.Alignment: * Text (Names/Status): LeftMeasurements ($m^2$): CenterFinancials (TND): Right (Monospace font recommended: font-mono)4. Iconography Map (Lucide)Standardize your icons to ensure the UI feels cohesive.Dashboard: LayoutDashboardTerrains: Map or LandPlotClients: UsersContracts: FileTextDocuments: FolderOpenActions: MoreHorizontal, Pencil, Trash2, Plus5. Technical Implementation ExampleModern Stat Card ComponentCode snippet<script setup>
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Landmark } from 'lucide-vue-next'
</script>

<template>
  <Card class="shadow-none border-border/60">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium text-muted-foreground uppercase tracking-tight">
        Revenu Total
      </CardTitle>
      <Landmark class="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold tracking-tight">15,129 TND</div>
      <p class="text-xs text-muted-foreground mt-1">+12% par rapport au mois dernier</p>
    </CardContent>
  </Card>
</template>
Table Status BadgeCode snippet<template>
  <div class="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
    <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
    Disponible
  </div>
</template>
6. Layout StrategyTop Header: Global search (Command + K pattern) and a User Profile dropdown using shadcn DropdownMenu.Empty States: When "Aucun contrat" is found, use a centered Ghost button with a Plus icon, surrounded by a dashed border (border-dashed).Transitions: Use standard Vue <Transition> for page loads and shadcn AnimatePresence for modals to keep the feeling "snappy" but fluid.