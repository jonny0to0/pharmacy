export const dashboardConfig: Record<string, { components: string[] }> = {
  PHARMACY: {
    components: ['QuickSummary', 'POS', 'ExpiryAlerts', 'InventoryStatus', 'RecentSales'],
  },
  HOSPITAL: {
    components: ['QuickSummary', 'PatientManagement', 'DoctorSchedule', 'BillingOverview', 'BedAvailability'],
  },
  WHOLESALER: {
    components: ['QuickSummary', 'BulkOrders', 'SupplierRelations', 'WarehouseStatus', 'RecentPurchases'],
  },
  RETAILER: {
    components: ['QuickSummary', 'POS', 'CustomerLoyalty', 'InventoryStatus', 'DailyReports'],
  },
  DISTRIBUTOR: {
    components: ['QuickSummary', 'LogisticsTracking', 'BulkInventory', 'SupplierLedger', 'RevenueTrends'],
  },
  MEDICAL_STORE: {
    components: ['QuickSummary', 'InventoryStatus', 'ExpiryAlerts', 'RecentSales', 'CustomerDirectory'],
  },
};
