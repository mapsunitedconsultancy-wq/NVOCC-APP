export interface RouteInfo {
  view: string;
  param?: string;
}

export const VIEW_TO_PATH: Record<string, string> = {
  dashboard: '/dashboard',
  shipments: '/shipments',
  hbl: '/hbl',
  mbl: '/mbl',
  delivery_orders: '/delivery-orders',
  consolidation: '/consolidation',
  container_control: '/container-control',
  quotes: '/rates',
  quotation_pipeline: '/pipeline',
  invoicing: '/invoicing',
  agent_accounting: '/accounting',
  crm: '/parties',
  vault: '/documents', // Links appear as /documents
  customer_portal: '/customer-portal',
  communication: '/communication',
  reports: '/reports',
  settings: '/settings',
  intelligence: '/intelligence',
  export_manifest: '/export-manifest',
  import_manifest: '/import-manifest',
  shipping_instructions: '/shipping-instructions',
  cha_tracker: '/cha-tracker',
  trucking_jobs: '/trucking',
  dangerous_goods: '/dangerous-goods',
  public_tracking: '/track',
  ccontrol_public: '/ccontrol',
  login: '/login',
  register: '/register',
  landing_page: '/landing',
};

export const PATH_TO_VIEW: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/shipments': 'shipments',
  '/hbl': 'hbl',
  '/mbl': 'mbl',
  '/delivery-orders': 'delivery_orders',
  '/delivery_orders': 'delivery_orders',
  '/consolidation': 'consolidation',
  '/container-control': 'container_control',
  '/container_control': 'container_control',
  '/rates': 'quotes',
  '/quotes': 'quotes',
  '/pipeline': 'quotation_pipeline',
  '/quotation-pipeline': 'quotation_pipeline',
  '/quotation_pipeline': 'quotation_pipeline',
  '/invoicing': 'invoicing',
  '/invoices': 'invoicing',
  '/accounting': 'agent_accounting',
  '/agent-accounting': 'agent_accounting',
  '/agent_accounting': 'agent_accounting',
  '/parties': 'crm',
  '/crm': 'crm',
  '/documents': 'vault', // Links appear as /documents
  '/vault': 'vault',
  '/customer-portal': 'customer_portal',
  '/customer_portal': 'customer_portal',
  '/communication': 'communication',
  '/reports': 'reports',
  '/settings': 'settings',
  '/intelligence': 'intelligence',
  '/export-manifest': 'export_manifest',
  '/export_manifest': 'export_manifest',
  '/import-manifest': 'import_manifest',
  '/import_manifest': 'import_manifest',
  '/shipping-instructions': 'shipping_instructions',
  '/shipping_instructions': 'shipping_instructions',
  '/cha-tracker': 'cha_tracker',
  '/cha_tracker': 'cha_tracker',
  '/trucking': 'trucking_jobs',
  '/trucking-jobs': 'trucking_jobs',
  '/trucking_jobs': 'trucking_jobs',
  '/dangerous-goods': 'dangerous_goods',
  '/dangerous_goods': 'dangerous_goods',
  '/track': 'public_tracking',
  '/public-tracking': 'public_tracking',
  '/public_tracking': 'public_tracking',
  '/ccontrol': 'ccontrol_public',
  '/login': 'login',
  '/register': 'register',
  '/landing': 'landing_page',
  '/landing_page': 'landing_page',
  '/': 'landing_page',
};

/**
 * Returns the URL path string for a given view and optional param
 */
export function getPathForView(view: string, param?: string): string {
  // Parameterized routes
  if (view === 'shipments' && param && !param.startsWith('filter:')) {
    return `/shipments/${encodeURIComponent(param)}`;
  }
  if (view === 'public_tracking' && param) {
    return `/track/${encodeURIComponent(param)}`;
  }
  if (view === 'ccontrol_public' && param) {
    return `/ccontrol/${encodeURIComponent(param)}`;
  }

  return VIEW_TO_PATH[view] || '/dashboard';
}

/**
 * Resolves view and param from browser pathname
 */
export function getViewForPath(pathname: string): RouteInfo {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // Check sub-routes: /shipments/:id
  const shipmentMatch = cleanPath.match(/^\/shipments\/(.+)$/);
  if (shipmentMatch) {
    return { view: 'shipments', param: decodeURIComponent(shipmentMatch[1]) };
  }

  // Check sub-routes: /track/:id
  const trackMatch = cleanPath.match(/^\/track\/(.+)$/);
  if (trackMatch) {
    return { view: 'public_tracking', param: decodeURIComponent(trackMatch[1]) };
  }

  // Check sub-routes: /ccontrol/:container
  const ccontrolMatch = cleanPath.match(/^\/ccontrol\/(.+)$/);
  if (ccontrolMatch) {
    return { view: 'ccontrol_public', param: decodeURIComponent(ccontrolMatch[1]) };
  }

  const directView = PATH_TO_VIEW[cleanPath.toLowerCase()];
  if (directView) {
    return { view: directView };
  }

  return { view: 'dashboard' };
}

