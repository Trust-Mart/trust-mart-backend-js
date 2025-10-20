export const PaymentStatus = {
  pending: 'pending',       // Created, not yet on blockchain
  submitted: 'submitted',   // Submitted to blockchain
  confirmed: 'confirmed',   // Confirmed on blockchain
  failed: 'failed',         // Transaction failed
  cancelled: 'cancelled',   // Cancelled by user/system
}

export const TransactionType = {
  escrow_create: 'escrow_create',
  escrow_release: 'escrow_release',
  escrow_refund: 'escrow_refund',
  escrow_dispute: 'escrow_dispute',
  direct_transfer: 'direct_transfer'
}

export const TokenSymbols = {
    USDC: 'USDC',
    USDT: 'USDT',
    ETH: "ETH"
}

export const InvoiceStatus = {
  draft: 'draft',
  sent: 'sent',
  viewed: 'viewed',
  partial: 'partial_paid',
  paid: 'paid',
  overdue: 'overdue',
  cancelled: 'cancelled'
};

export const InvoiceType = {
  oneTime: 'one_time',
  recurring: 'recurring'
};

export const RecurrenceInterval = {
  weekly: 'weekly',
  monthly: 'monthly',
  quarterly: 'quarterly',
  yearly: 'yearly'
};

export const DiscountType = {
  percentage: 'percentage',
  fixed: 'fixed'
}

export const CurrencyType = {
  NGN: "NGN",
  USD: "USD"
}

export const UserRoles = {
  buyer: 'buyer',
  seller: 'seller',
  admin: 'admin',
  sub_admin: 'sub_admin',

}

export const ProductStatus = {
  active: 'active',
  sold_out: 'sold_out',
  under_review: 'under_review',
  paused: 'paused',
  flagged: 'flagged'
}

export const DeliveryStatus = {
  pending: 'pending', 
  in_transit:'in_transit', 
  delivered: 'delivered', 
  disputed: 'disputed'
}

export const OrderStatus = {
  pending: 'pending',
  paid: 'paid',
  shipped: 'shipped',
  delivered: 'delivered',
  completed: 'completed',
  cancelled: 'cancelled',
  disputed: 'disputed',
  refunded: 'refunded'
}

export const SocialMediaProviders = {
  twitter: 'twitter',
  instagram: 'instagram',
  facebook: 'facebook',
  email: 'email',
  linkedin: 'linkedin',
}