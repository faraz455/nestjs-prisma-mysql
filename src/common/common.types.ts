export type saleReturnItemType = {
  product_id: string;
  item_id: string;
  item_index: number;
  quantity: number;
  remarks: string;
  total_amount: number;
  price: number;
  batch_no: string;
  expiry_date: bigint;
  unit_cost: number;
  actual_price: number;
};

export type saleDataType = {
  bank_account_id?: string;
  customer_id?: string;
  doctor_license?: string;
  doctor_name?: string;
  invoice_date: bigint;
  payment_mode: string;
  received_amount: number;
  tz_offset: number;
  remarks?: string;
  store_id: string;
  store: { id: string; name: string };
  updated_by_id: string;
};

export type getTestRequireDataReturnType = {
  entry: object;
  services: any;
  ac_discount: string;
  ac_receivable: string;
  ac_unearned_income: string;
  ac_payable: string;
  ac_income: string;
  ac_cos: string;
  ac_inventory: string;
  clinicId: string;
  clinicName: string;
  cusId: string;
  cusName: string;
  serviceId: string;
  serviceName: string;
  deptId: string;
  deptName: string;
  roomId: string;
  roomName: string;
  empId: string;
  empName: string;
};

export type getTransactionRequiredDataType = {
  entry: object;
  deptId: string;
  deptName: string;
  acReceivable: string;
  acCash: string;
  acExpense: string;
  acPayable: string;
  acInventory: string;
  acIncome: string;
  acCos: string;
  acDiscount: string;
};

export type creditPurchaseItemsType = {
  product_id: string;
  quantity: number;
  pack_size: number;
  price: number;
  sale_price: number;
  loose_packing: boolean;
  discount: number;
  return_quantity: number | null;
  batch_no: string;
  expiry_date: number;
  unit_cost: number;
  remarks: string;
  item_id: string;
  item_index: number;
  actual_amount: number;
  discounted_amount: number;
};

export type purchaseReturnItemsType = {
  product_id: string;
  quantity: number;
  price: number;
  batch_no: string;
  expiry_date: bigint;
  item_id: string;
  item_index: number;
  total_amount: number;
  remarks: string;
  reason: string;
};

export type fileObjectType = {
  file_id: string;
  file_name: string;
  file_ext: string;
  file_size: number;
  content_type: string;
  file_path: string;
  file_url: string;
};

export type infoType = {
  company_name: string;
  phone?: string;
  street_address?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  top_margin?: string;
  bottom_margin?: string;
  country?: string;
  logo?: fileObjectType;
  logo_url?: string;
  letter_head?: fileObjectType;
  letter_url?: string;
};

export type expiringItems = {
  supplier_id: string;
  items: {
    supplier_id: string;
    items: [oneExpiringItem];
    store_id: string;
    store_name: string;
  };
  store_id: string;
  store_name: string;
};

export type oneExpiringItem = {
  item_id: string;
  product_id: string;
  product_name: string;
  strength: string;
  stock_quantity: number;
  quantity: number;
  discounted_amount: number;
  unit_price: number;
  batch_no: string;
  expiry_date: bigint;
};
