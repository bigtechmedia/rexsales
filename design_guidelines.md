{
  "brand": {
    "name": "Rex Botanix",
    "attributes": [
      "trustworthy",
      "field-ready",
      "calmly bold",
      "data-rich",
      "industrial-agro (refined, not rustic)",
      "mobile-first for reps; desktop-dense for admin/owner"
    ],
    "visual_personality": {
      "style_fusion": [
        "Minimal shell + dense dashboard cards (enterprise SaaS)",
        "Agro-tech split views (metrics panel + map/visual panel)",
        "WhatsApp-familiar messaging, but with CRM context tags"
      ],
      "avoid": [
        "cliché farm illustrations",
        "neon greens",
        "heavy gradients",
        "centered landing-page layouts"
      ]
    },
    "logo_mark_concept": {
      "treatment": "Wordmark 'Rex Botanix' in a sturdy grotesk; small seedling/leaf glyph as a dot over the 'i' in Botanix OR as a leading icon in the sidebar header.",
      "glyph_geometry": "Single-stroke leaf with a midrib cut (negative space). Keep it 1.5px stroke at 24px size; rounded caps.",
      "color": "Use solid --primary (deep forest) on light mode; in dark mode use --primary (mint-tint) on dark surfaces. No gradients.",
      "placement": "Sidebar top-left + login card header. Optional compact glyph-only for collapsed sidebar."
    }
  },

  "inspiration_refs": {
    "notes": "Use these as directional references (layout density, split views, mobile cards).",
    "urls": [
      {
        "url": "https://rondesignlab.com/cases/agridflow-farming-saas-ux-ui-design",
        "takeaways": [
          "Mobile-first cards with clear status chips",
          "Simple navigation; real-time data emphasis",
          "Calm palette + strong hierarchy"
        ]
      },
      {
        "url": "https://contra.com/p/LmWsNMNP-agrotech-dashboard",
        "takeaways": [
          "Split-view: metrics panel + map/visual panel",
          "Color used for state recognition",
          "Dense but readable left panel"
        ]
      }
    ]
  },

  "color_system": {
    "goal": "Refined agro palette: deep forest + sage surfaces + clay accent. Light mode primary; dark mode optional.",
    "tokens_index_css": {
      "light": {
        "--background": "48 33% 98%",
        "--foreground": "162 18% 12%",

        "--card": "0 0% 100%",
        "--card-foreground": "162 18% 12%",

        "--popover": "0 0% 100%",
        "--popover-foreground": "162 18% 12%",

        "--primary": "158 42% 22%",
        "--primary-foreground": "48 33% 98%",

        "--secondary": "150 22% 94%",
        "--secondary-foreground": "158 42% 22%",

        "--muted": "150 18% 92%",
        "--muted-foreground": "160 10% 38%",

        "--accent": "28 55% 92%",
        "--accent-foreground": "162 18% 12%",

        "--destructive": "6 72% 52%",
        "--destructive-foreground": "0 0% 98%",

        "--border": "150 14% 86%",
        "--input": "150 14% 86%",
        "--ring": "158 42% 22%",

        "--chart-1": "158 42% 32%",
        "--chart-2": "186 44% 34%",
        "--chart-3": "28 62% 52%",
        "--chart-4": "84 34% 42%",
        "--chart-5": "210 38% 42%",

        "--radius": "0.75rem"
      },
      "dark": {
        "--background": "162 22% 8%",
        "--foreground": "48 20% 96%",

        "--card": "162 22% 10%",
        "--card-foreground": "48 20% 96%",

        "--popover": "162 22% 10%",
        "--popover-foreground": "48 20% 96%",

        "--primary": "150 34% 78%",
        "--primary-foreground": "162 22% 10%",

        "--secondary": "162 18% 14%",
        "--secondary-foreground": "48 20% 96%",

        "--muted": "162 16% 14%",
        "--muted-foreground": "150 10% 70%",

        "--accent": "28 28% 18%",
        "--accent-foreground": "48 20% 96%",

        "--destructive": "6 58% 42%",
        "--destructive-foreground": "0 0% 98%",

        "--border": "162 14% 18%",
        "--input": "162 14% 18%",
        "--ring": "150 34% 78%",

        "--chart-1": "150 34% 62%",
        "--chart-2": "186 40% 56%",
        "--chart-3": "28 54% 58%",
        "--chart-4": "84 30% 56%",
        "--chart-5": "210 34% 58%",

        "--radius": "0.75rem"
      }
    },
    "semantic_usage": {
      "surfaces": {
        "app_background": "--background (warm off-white)",
        "sidebar": "use bg-secondary/60 with backdrop blur on desktop; solid bg-secondary on mobile",
        "cards": "bg-card with subtle shadow",
        "tables": "bg-card; header row bg-muted"
      },
      "accents": {
        "success": "use primary family (forest/sage)",
        "warning": "use accent family (clay) sparingly for badges",
        "danger": "destructive"
      }
    },
    "gradients_and_texture": {
      "rule": "Gradients only as decorative section background overlays (<=20% viewport).",
      "allowed_examples": [
        "Hero/login backdrop: radial-gradient(900px circle at 10% 10%, hsl(150 22% 94% / 0.9), transparent 55%), radial-gradient(700px circle at 90% 20%, hsl(28 55% 92% / 0.7), transparent 60%)",
        "Owner analytics header strip: linear-gradient(90deg, hsl(150 22% 94% / 0.9), transparent)"
      ],
      "noise_overlay": {
        "css": "background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.06\"/></svg>');",
        "usage": "Apply to app background wrapper only (not cards) via a pseudo-element; keep opacity <= 0.06."
      }
    }
  },

  "typography": {
    "google_fonts": {
      "heading": {
        "family": "Space Grotesk",
        "weights": ["500", "600", "700"],
        "why": "Bold, technical, modern—good for dashboards without feeling generic."
      },
      "body": {
        "family": "Figtree",
        "weights": ["400", "500", "600"],
        "why": "High readability on mobile forms; friendly but professional."
      },
      "mono_optional": {
        "family": "IBM Plex Mono",
        "weights": ["400", "500"],
        "usage": "IDs, SKU codes, timestamps in tables."
      }
    },
    "tailwind_mapping": {
      "implementation_note": "Add font families in tailwind.config.js (fontFamily.sans + fontFamily.display). Use className='font-display' for headings.",
      "scale": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight leading-[1.05]",
        "h2": "text-base md:text-lg text-muted-foreground leading-relaxed",
        "section_title": "text-lg md:text-xl font-display font-semibold tracking-tight",
        "kpi_value": "text-2xl md:text-3xl font-display font-semibold tabular-nums",
        "body": "text-sm md:text-base leading-6",
        "small": "text-xs text-muted-foreground"
      }
    }
  },

  "layout_grid": {
    "app_shell": {
      "desktop": {
        "sidebar_width": "272px (w-68)",
        "collapsed": "72px (w-18)",
        "topbar_height": "56px",
        "content_max_width": "1440px (max-w-[1440px])",
        "gutter": "px-4 md:px-6 lg:px-8",
        "grid": "12-col mental model; implement with CSS grid: grid-cols-12 gap-4 md:gap-6"
      },
      "mobile": {
        "nav": "Bottom nav OR hamburger Sheet; prefer Sheet for CRM density.",
        "content_padding": "px-4 py-4",
        "sticky_actions": "Primary submit button sticky at bottom for long forms (safe-area aware)."
      }
    },
    "breakpoints": {
      "sm": "640",
      "md": "768",
      "lg": "1024",
      "xl": "1280",
      "2xl": "1536"
    },
    "page_patterns": {
      "list_pages": "Header row (title + filters) -> table/card list -> pagination.",
      "detail_pages": "Two-column on lg+: left main timeline (8 cols), right context panel (4 cols). On mobile: tabs (Timeline / Details / Files).",
      "messages": "Three-pane on xl: threads (3 cols) + chat (6 cols) + context (3 cols). On mobile: threads list -> chat view (back button)."
    }
  },

  "component_path": {
    "shadcn_primary": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "checkbox": "/app/frontend/src/components/ui/checkbox.jsx",
      "switch": "/app/frontend/src/components/ui/switch.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "dropdown_menu": "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "popover": "/app/frontend/src/components/ui/popover.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx",
      "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "sonner_toast": "/app/frontend/src/components/ui/sonner.jsx",
      "avatar": "/app/frontend/src/components/ui/avatar.jsx",
      "breadcrumb": "/app/frontend/src/components/ui/breadcrumb.jsx",
      "pagination": "/app/frontend/src/components/ui/pagination.jsx",
      "resizable": "/app/frontend/src/components/ui/resizable.jsx",
      "command": "/app/frontend/src/components/ui/command.jsx"
    },
    "recommended_new_components_to_create": [
      {
        "path": "/app/frontend/src/components/KpiCard.js",
        "purpose": "KPI tile with delta, sparkline slot, and status dot"
      },
      {
        "path": "/app/frontend/src/components/DataToolbar.js",
        "purpose": "Search + filters + date range + export button row"
      },
      {
        "path": "/app/frontend/src/components/AttachmentGrid.js",
        "purpose": "Image/document preview grid with lightbox dialog"
      },
      {
        "path": "/app/frontend/src/components/ChatLayout.js",
        "purpose": "Threads + chat pane + context panel responsive layout"
      },
      {
        "path": "/app/frontend/src/components/ApprovalCard.js",
        "purpose": "Approval queue item with quick actions"
      },
      {
        "path": "/app/frontend/src/components/Timeline.js",
        "purpose": "Dealer/report timeline with grouped days and event types"
      }
    ]
  },

  "component_guidelines": {
    "buttons": {
      "style": "Professional / Corporate with refined rounding",
      "tokens": {
        "radius": "rounded-xl",
        "primary": "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        "secondary": "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        "ghost": "hover:bg-muted",
        "press": "active:scale-[0.98]",
        "focus": "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      },
      "do": [
        "Use icon+label for primary actions on desktop; label-only on mobile if space tight",
        "Use destructive variant only for irreversible actions"
      ],
      "data_testid_examples": [
        "data-testid=\"login-submit-button\"",
        "data-testid=\"dealer-create-button\"",
        "data-testid=\"report-save-draft-button\""
      ]
    },

    "kpi_cards": {
      "composition": "Card -> header row (label + status dot) -> value -> delta badge -> optional sparkline slot",
      "tailwind": {
        "card": "rounded-2xl border bg-card shadow-[0_1px_0_hsl(var(--border))]",
        "header": "flex items-center justify-between gap-3",
        "label": "text-xs font-medium text-muted-foreground uppercase tracking-wide",
        "value": "mt-2 text-2xl md:text-3xl font-display font-semibold tabular-nums",
        "delta": "mt-3 inline-flex items-center gap-1 text-xs",
        "sparkline_slot": "mt-3 h-10"
      },
      "states": {
        "good": "dot bg-[hsl(var(--chart-4))]",
        "warn": "dot bg-[hsl(var(--chart-3))]",
        "bad": "dot bg-destructive"
      },
      "data_testid": "kpi-card-<metric-name>"
    },

    "charts_recharts": {
      "principles": [
        "Prefer small multiples: 2–3 compact charts instead of one huge chart",
        "Use muted gridlines (stroke='hsl(var(--border))')",
        "Use tabular-nums for axis ticks",
        "Always include empty state when no data"
      ],
      "card_wrapper": "Card with p-4 md:p-6; header includes timeframe Select",
      "colors": {
        "primary_series": "hsl(var(--chart-1))",
        "secondary_series": "hsl(var(--chart-2))",
        "warning_series": "hsl(var(--chart-3))"
      },
      "data_testid": {
        "chart": "dashboard-sales-trend-chart",
        "timeframe": "dashboard-timeframe-select"
      }
    },

    "data_tables": {
      "use": "Dealers list, reports list, approvals list, products list",
      "composition": "DataToolbar -> Table -> Pagination",
      "table_styles": {
        "header": "bg-muted/60 text-xs uppercase tracking-wide",
        "row": "hover:bg-muted/40",
        "cell": "py-3",
        "sticky_header": "Use sticky top-0 within ScrollArea for long lists"
      },
      "mobile_pattern": "Switch to card list on <md: each row becomes Card with key fields + actions.",
      "data_testid": {
        "search": "table-search-input",
        "filter": "table-filter-button",
        "row": "dealers-table-row-<id>"
      }
    },

    "forms_and_inputs": {
      "principles": [
        "Mobile-first: large tap targets (min-h-11)",
        "Use Form (react-hook-form shadcn) for consistent errors",
        "Group fields into Cards with section titles",
        "Use Calendar for date picking; never native date input"
      ],
      "layout": "Single column on mobile; 2 columns on lg for non-critical fields.",
      "field_spacing": "space-y-4 within sections; space-y-6 between sections",
      "input_classes": "h-11 rounded-xl",
      "textarea_classes": "min-h-28 rounded-xl",
      "helper_text": "text-xs text-muted-foreground",
      "error_text": "text-xs text-destructive",
      "data_testid_examples": [
        "data-testid=\"report-type-select\"",
        "data-testid=\"dealer-name-input\"",
        "data-testid=\"expense-amount-input\"",
        "data-testid=\"leave-start-date-button\""
      ]
    },

    "uploads_base64": {
      "pattern": "Dropzone-like area (Button + Input[type=file]) -> preview grid -> lightbox Dialog",
      "preview_grid": "grid grid-cols-3 sm:grid-cols-4 gap-2",
      "preview_tile": "relative aspect-square overflow-hidden rounded-xl border bg-muted",
      "doc_tile": "flex items-center gap-2 rounded-xl border bg-card p-3",
      "lightbox": "Dialog with darkened overlay; image uses object-contain max-h-[75vh]",
      "actions": "Each tile has top-right ghost IconButton for remove",
      "data_testid": {
        "upload_input": "attachment-upload-input",
        "image_tile": "attachment-image-tile-<index>",
        "remove": "attachment-remove-button-<index>"
      }
    },

    "approvals_cards": {
      "composition": "Card -> requester + type badge -> summary -> amount/dates -> actions row",
      "actions": "Approve (primary) + Reject (secondary/destructive outline) + View details (ghost)",
      "density": "Keep to 2 lines summary; details in Dialog",
      "data_testid": {
        "card": "approval-card-<id>",
        "approve": "approval-approve-button-<id>",
        "reject": "approval-reject-button-<id>"
      }
    },

    "messaging_whatsapp_style": {
      "layout": {
        "desktop": "ResizablePanelGroup: threads | chat | context",
        "mobile": "Threads list -> Chat view (Sheet for context details)"
      },
      "thread_row": {
        "styles": "flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50",
        "unread": "font-medium + unread dot + Badge count",
        "meta": "Right side: time + status chip",
        "tags": "Use Badge variant='secondary' for 'Dealer X' tag"
      },
      "chat_bubbles": {
        "incoming": "max-w-[78%] rounded-2xl rounded-tl-md bg-muted px-3 py-2",
        "outgoing": "max-w-[78%] rounded-2xl rounded-tr-md bg-primary text-primary-foreground px-3 py-2",
        "timestamp": "mt-1 text-[11px] text-muted-foreground",
        "attachments": "Inside bubble: AttachmentGrid compact mode"
      },
      "composer": {
        "container": "sticky bottom-0 bg-background/80 backdrop-blur border-t p-3",
        "input": "h-11 rounded-2xl",
        "actions": "Attach (paperclip icon) + quick templates (Command) + send"
      },
      "crm_context": {
        "dealer_tag": "Chip above composer: 'For: Dealer Name' removable",
        "message_templates": "Command palette for templates: 'Request stock', 'Schedule visit', 'Share price list'"
      },
      "data_testid": {
        "thread_search": "messages-thread-search-input",
        "thread_row": "messages-thread-row-<id>",
        "message_input": "messages-composer-input",
        "send": "messages-send-button",
        "attach": "messages-attach-button"
      }
    },

    "timeline_dealer_detail": {
      "pattern": "Vertical timeline grouped by day; each event is a Card with icon + type badge + attachments",
      "event_types": [
        "dealer onboarded",
        "sales requirement",
        "farm visit",
        "dealer visit",
        "field report",
        "area status",
        "message summary"
      ],
      "tailwind": {
        "rail": "relative pl-6 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-border",
        "dot": "absolute left-[5px] mt-2 h-3 w-3 rounded-full bg-primary",
        "event_card": "rounded-2xl border bg-card p-4"
      },
      "data_testid": {
        "timeline": "dealer-timeline",
        "event": "dealer-timeline-event-<id>"
      }
    }
  },

  "dashboards": {
    "owner": {
      "above_the_fold": [
        "KPI strip: Total sales (MTD), Revenue (MTD), Active dealers, Visits this week",
        "Trend chart: Weekly sales vs last period",
        "Top reps table (rank, sales, visits, conversion)",
        "Alerts: low coverage regions / overdue approvals"
      ],
      "below_fold": [
        "Team breakdown (stacked bar)",
        "Regional view placeholder (future map) using split-view pattern",
        "Recent high-value dealer enquiries"
      ],
      "layout": "12-col: KPIs (12), charts (8) + alerts (4), tables (12)"
    },
    "admin_manager": {
      "above_the_fold": [
        "Approval queue (expense/leave/travel) with quick actions",
        "Team activity feed (visits + reports)",
        "Coverage KPI: reps active today, overdue reports"
      ],
      "below_fold": [
        "Team performance chart",
        "Dealer onboarding funnel",
        "Team management shortcuts"
      ],
      "layout": "Approvals (5) + Activity (7) on desktop; stacked on mobile"
    },
    "sales_rep": {
      "above_the_fold": [
        "Today plan: assigned area + next dealers",
        "Quick actions: New report, New dealer, New enquiry, Message manager",
        "My KPIs: visits this week, enquiries, approvals pending"
      ],
      "below_fold": [
        "Recent drafts",
        "My requests status",
        "Offline-friendly hint: 'Saved locally' badge when draft"
      ],
      "layout": "Mobile-first cards; sticky primary action button for 'New report'"
    },
    "dealer": {
      "above_the_fold": [
        "My enquiries status (open/in progress/closed)",
        "Quick: New product enquiry, Message rep",
        "Recent messages"
      ],
      "below_fold": [
        "Product catalog highlights",
        "Documents shared (price list, brochures)"
      ],
      "layout": "Simple 1-col; minimal admin controls"
    }
  },

  "empty_loading_error": {
    "empty_states": {
      "tone": "Helpful, action-oriented, no jokes.",
      "patterns": [
        "Empty list: show 1-line explanation + primary CTA + secondary 'Import/Refresh'",
        "Empty chart: show placeholder grid + 'No data for selected range'"
      ],
      "examples": {
        "dealers": "No dealers yet. Add your first dealer to start tracking visits.",
        "reports": "No reports match these filters. Clear filters or create a new report.",
        "messages": "No conversations. Start a thread with a dealer or your manager."
      },
      "data_testid": {
        "empty": "empty-state",
        "empty_cta": "empty-state-primary-cta"
      }
    },
    "loading": {
      "use": "Skeleton component for cards, tables, chat bubbles",
      "patterns": [
        "KPI skeleton: label line + big number line + small line",
        "Table skeleton: 6 rows x 5 cols",
        "Chat skeleton: alternating bubble widths"
      ],
      "data_testid": "loading-skeleton"
    },
    "errors": {
      "pattern": "Inline Alert for recoverable errors; Dialog for destructive confirmations.",
      "retry": "Always provide Retry button for network errors.",
      "data_testid": {
        "alert": "error-alert",
        "retry": "error-retry-button"
      }
    }
  },

  "motion_micro_interactions": {
    "principles": [
      "Subtle and fast: 120–180ms for hover, 180–240ms for enter",
      "Use transform only for press feedback; avoid layout shifts",
      "Respect prefers-reduced-motion"
    ],
    "recommended_library": {
      "name": "framer-motion",
      "install": "npm i framer-motion",
      "usage": "Use for page transitions (fade/slide), KPI card entrance stagger, and chat message appear animations. Keep it minimal."
    },
    "patterns": {
      "hover": "Buttons: hover:bg... + shadow-sm -> shadow; Cards: hover:shadow-md",
      "press": "active:scale-[0.98]",
      "list_row": "hover:bg-muted/40; selected row uses bg-muted/70 + left border indicator",
      "toast": "Use sonner for success/error; keep copy short"
    }
  },

  "accessibility": {
    "wcag": "AA",
    "rules": [
      "All focusable elements must have visible focus ring (ring-ring + ring-offset-background)",
      "Use tabular-nums for KPIs and tables",
      "Don’t rely on color alone for status: pair Badge text + icon",
      "Minimum touch target 44px height on mobile",
      "Provide aria-label for icon-only buttons"
    ],
    "keyboard": {
      "tables": "Row actions accessible via Tab; avoid hover-only actions",
      "command_palette": "Use Command component for quick actions and templates"
    }
  },

  "image_urls": {
    "login_background_optional": [
      {
        "url": "https://images.unsplash.com/photo-1650000772760-9909ee2bcaee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxhZ3JpY3VsdHVyZSUyMGZpZWxkJTIwYWVyaWFsJTIwbWluaW1hbHxlbnwwfHx8Z3JlZW58MTc3NzcyOTc4MXww&ixlib=rb-4.1.0&q=85",
        "description": "Aerial field geometry; use as subtle blurred backdrop on /login only (opacity 0.12, grayscale 20%)."
      }
    ],
    "dashboard_header_optional": [
      {
        "url": "https://images.unsplash.com/photo-1548941489-4a9f8b8230b0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxhZ3JpY3VsdHVyZSUyMGZpZWxkJTIwYWVyaWFsJTIwbWluaW1hbHxlbnwwfHx8Z3JlZW58MTc3NzcyOTc4MXww&ixlib=rb-4.1.0&q=85",
        "description": "Optional owner dashboard header image strip (max height 120px) behind title; keep readability."
      }
    ],
    "empty_state_illustration_optional": [
      {
        "url": "https://images.unsplash.com/photo-1651638972101-02bda4fc9259?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMGZpZWxkJTIwYWVyaWFsJTIwbWluaW1hbHxlbnwwfHx8Z3JlZW58MTc3NzcyOTc4MXww&ixlib=rb-4.1.0&q=85",
        "description": "Use as faint empty-state background in cards (not required)."
      }
    ]
  },

  "instructions_to_main_agent": {
    "index_css": [
      "Replace current :root and .dark tokens in /app/frontend/src/index.css with the HSL values above.",
      "Remove default body font stack and set to Figtree; add .font-display utility for Space Grotesk.",
      "Do NOT add .App { text-align:center } or universal transitions."
    ],
    "app_shell": [
      "Implement a responsive sidebar using Sheet on mobile and fixed sidebar on desktop.",
      "Use Breadcrumb in topbar for deep pages (dealer detail, report detail).",
      "Add Notifications bell + user menu (DropdownMenu) in topbar; both must have data-testid."
    ],
    "dashboards": [
      "Use KpiCard component across all roles; keep consistent spacing and typography.",
      "Use Recharts inside Card; keep charts lightweight and memoized for performance.",
      "Owner/Admin dashboards should default to last 7 days with a timeframe Select."
    ],
    "messaging": [
      "Use ResizablePanelGroup for desktop 3-pane messages; on mobile use Tabs or route-based navigation.",
      "Add CRM context chip 'For: Dealer' above composer; store dealerId in thread metadata.",
      "Composer supports attachments; preview before sending."
    ],
    "testing": [
      "Add data-testid to every interactive element and key info (KPI values, chart containers, table rows, empty/error states).",
      "Use kebab-case and role-based naming (e.g., owner-dashboard-total-sales-kpi)."
    ]
  }
}


<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
