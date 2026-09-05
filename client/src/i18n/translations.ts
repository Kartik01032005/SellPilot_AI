export type SupportedLanguage = 'en' | 'kn' | 'hi' | 'ta' | 'te';

export interface TranslationDictionary {
  common: {
    loading: string;
    offline: string;
    healthy: string;
    connecting: string;
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    retry: string;
    status: string;
    action: string;
    success: string;
    error: string;
    warning: string;
    viewAll: string;
  };
  nav: {
    buyerDiscovery: string;
    merchantHub: string;
    myOrders: string;
    askAI: string;
    login: string;
    logout: string;
    cart: string;
    trackBadge: string;
    customerRole: string;
    merchantRole: string;
    adminRole: string;
  };
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    launchAssistant: string;
    exploreCatalog: string;
    searchPlaceholder: string;
    askAIBtn: string;
    tryRomanized: string;
    gatewayTitle: string;
    testModeBadge: string;
    hmacBadge: string;
    multilingualStream: string;
    responseSpeed: string;
    buyerSampleBadge: string;
    buyerSampleText: string;
    copilotBadge: string;
    copilotSampleText: string;
    verifiedStock: string;
    stockCount: string;
    guardrailPipeline: string;
    maxDiscountLabel: string;
    maxDiscountValue: string;
    stockDecrementLabel: string;
    stockDecrementValue: string;
    auditTrailLabel: string;
    auditTrailValue: string;
    openMerchantHub: string;
    merchantOnlyHub: string;
  };
  trust: {
    metric1Value: string;
    metric1Label: string;
    metric2Value: string;
    metric2Label: string;
    metric3Value: string;
    metric3Label: string;
    metric4Value: string;
    metric4Label: string;
    whyTitle: string;
    whySubtitle: string;
    card1Title: string;
    card1Desc: string;
    card2Title: string;
    card2Desc: string;
    card3Title: string;
    card3Desc: string;
    card4Title: string;
    card4Desc: string;
  };
  catalog: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    categoryAll: string;
    maxPriceLabel: string;
    inStock: string;
    outOfStock: string;
    unitsStock: string;
    addToCart: string;
    inCart: string;
    askCopilot: string;
    noProducts: string;
    resetFilters: string;
    categories: {
      shoes: string;
      laptops: string;
      phones: string;
      cameras: string;
      accessories: string;
      electronics: string;
      clothing: string;
    };
  };
  productModal: {
    keyFeatures: string;
    guaranteedAuthentic: string;
    guaranteedDesc: string;
    razorpayTestReady: string;
    razorpayTestDesc: string;
    askAboutProduct: string;
    close: string;
  };
  cart: {
    title: string;
    itemsCount: string;
    emptyTitle: string;
    emptySubtitle: string;
    subtotal: string;
    shipping: string;
    shippingFree: string;
    discount: string;
    total: string;
    checkoutBtn: string;
    clearCart: string;
    remove: string;
    outOfStock: string;
    verifiedCheckout: string;
  };
  checkout: {
    title: string;
    shippingAddress: string;
    fullName: string;
    email: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
    orderSummary: string;
    paymentMethod: string;
    razorpayOption: string;
    razorpayDesc: string;
    payBtn: string;
    processing: string;
    successTitle: string;
    successDesc: string;
    failureTitle: string;
    failureDesc: string;
    viewOrdersBtn: string;
    tryAgainBtn: string;
    closeBtn: string;
  };
  orders: {
    title: string;
    subtitle: string;
    noOrdersTitle: string;
    noOrdersSubtitle: string;
    orderNumber: string;
    orderDate: string;
    orderStatus: string;
    orderTotal: string;
    orderItems: string;
    cancelOrder: string;
    cancelConfirm: string;
    cancellationSuccess: string;
    cancellationFailed: string;
    viewDetails: string;
    statusPending: string;
    statusPaid: string;
    statusProcessing: string;
    statusCompleted: string;
    statusCancelled: string;
    statusFailed: string;
    statusHistory: string;
    shippingTo: string;
    paymentId: string;
    restockedNote: string;
    orderSummary: string;
  };
  auth: {
    welcomeBack: string;
    createAccount: string;
    loginSubtitle: string;
    registerSubtitle: string;
    nameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    roleLabel: string;
    customerRole: string;
    merchantRole: string;
    businessNameLabel: string;
    signInBtn: string;
    signUpBtn: string;
    noAccountPrompt: string;
    haveAccountPrompt: string;
    demoCustomerBtn: string;
    demoMerchantBtn: string;
    demoHeading: string;
  };
  merchant: {
    title: string;
    subtitle: string;
    gatedBadge: string;
    tabInsights: string;
    tabProducts: string;
    tabCampaigns: string;
    tabAudit: string;
    accessRestrictedTitle: string;
    accessRestrictedDesc: string;
    returnToDiscoveryBtn: string;
    bestOpportunityTitle: string;
    bestOpportunityBadge: string;
    topPromotionTitle: string;
    topPromotionBadge: string;
    categoryMomentumTitle: string;
    categoryMomentumBadge: string;
    revenueVelocityTitle: string;
    revenueVelocityBadge: string;
    addProductBtn: string;
    createCampaignBtn: string;
    discountValidationTitle: string;
    testDiscountPlaceholder: string;
    validateDiscountBtn: string;
    discountAllowed: string;
    discountRejected: string;
    productTableColName: string;
    productTableColCategory: string;
    productTableColPrice: string;
    productTableColStock: string;
    productTableColStatus: string;
    productTableColActions: string;
    activeStatus: string;
    inactiveStatus: string;
    noProductsMerchant: string;
    campaignTableColName: string;
    campaignTableColDiscount: string;
    campaignTableColStatus: string;
    campaignTableColActions: string;
    approveCampaign: string;
    activateCampaign: string;
    noCampaigns: string;
    auditLogTitle: string;
    auditLogColEvent: string;
    auditLogColActor: string;
    auditLogColStatus: string;
    auditLogColTimestamp: string;
    noAuditLogs: string;
    refreshData: string;
  };
  chat: {
    assistantTitle: string;
    agenticCommerce: string;
    languageLabel: string;
    buyerTab: string;
    merchantTab: string;
    inputPlaceholder: string;
    sendBtn: string;
    initialGreetingBuyer: string;
    initialGreetingMerchant: string;
    chip1Buyer: string;
    chip2Buyer: string;
    chip3Buyer: string;
    chip4Buyer: string;
    chip5Buyer: string;
    chip6Buyer: string;
    chip1Merchant: string;
    chip2Merchant: string;
    chip3Merchant: string;
    chip4Merchant: string;
    chip5Merchant: string;
    chip6Merchant: string;
    addToCartBtn: string;
    proceedCheckoutBtn: string;
    orderTotalReady: string;
  };
  recommendations: {
    upsellTitle: string;
    crossSellTitle: string;
    approveAndAdd: string;
    dismiss: string;
    moreDiff: string;
    upsellSuccess: string;
    crossSellSuccess: string;
  };
  testimonials: {
    tag: string;
    title: string;
    quote1: string;
    author1Name: string;
    author1Role: string;
    quote2: string;
    author2Name: string;
    author2Role: string;
    quote3: string;
    author3Name: string;
    author3Role: string;
  };
  faqs: {
    tag: string;
    title: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
  };
  footer: {
    track: string;
    bounded: string;
    testMode: string;
    copyright: string;
  };
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  // ========================== ENGLISH ==========================
  en: {
    common: {
      loading: 'Loading...',
      offline: 'Offline',
      healthy: 'Online',
      connecting: 'Connecting...',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      retry: 'Retry',
      status: 'Status',
      action: 'Action',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      viewAll: 'View All',
    },
    nav: {
      buyerDiscovery: 'Buyer Discovery',
      merchantHub: 'Merchant Hub',
      myOrders: 'My Orders',
      askAI: 'Ask SellPilot AI',
      login: 'Login',
      logout: 'Logout',
      cart: 'Cart',
      trackBadge: 'Track 01',
      customerRole: 'Customer',
      merchantRole: 'Merchant',
      adminRole: 'Admin',
    },
    hero: {
      badge: 'SellPilot AI 2.0 • Bounded Agentic Commerce & Razorpay Test Mode',
      titleLine1: 'Conversational Commerce,',
      titleLine2: 'Guarded by Deterministic Logic.',
      subtitle:
        'SellPilot AI empowers shoppers to search naturally in English or Romanized Indian languages (Hindi, Kannada, Tamil, Telugu), while providing merchants with AI growth opportunities protected by strict guardrails.',
      launchAssistant: 'Launch AI Assistant',
      exploreCatalog: 'Explore Catalog',
      searchPlaceholder: 'Search or ask: e.g. {sample}',
      askAIBtn: 'Ask AI',
      tryRomanized: 'Try Romanized:',
      gatewayTitle: 'SellPilot AI — Autonomous Guardrail Gateway',
      testModeBadge: 'Razorpay Test Mode',
      hmacBadge: 'HMAC-SHA256 Verified',
      multilingualStream: 'Multilingual Stream',
      responseSpeed: 'Response < 180ms',
      buyerSampleBadge: 'BUYER (Romanized Hindi)',
      buyerSampleText: '“Mujhe marathon ke liye badhiya running shoes dikhao ₹3000 ke andar”',
      copilotBadge: 'SELLPILOT COPILOT',
      copilotSampleText:
        'Found it! Pro Carbon Running Shoes are best for marathon running with carbon-plate cushioning and high energy return.',
      verifiedStock: 'Verified In Stock',
      stockCount: '12 units',
      guardrailPipeline: 'Guardrail Pipeline',
      maxDiscountLabel: 'Max Discount Limit',
      maxDiscountValue: '25% Max',
      stockDecrementLabel: 'Stock Decrement',
      stockDecrementValue: 'Post-Signature',
      auditTrailLabel: 'Audit Trail',
      auditTrailValue: 'Immutable',
      openMerchantHub: 'Open Merchant Hub',
      merchantOnlyHub: 'Merchant Hub (Merchants Only)',
    },
    trust: {
      metric1Value: '< 200ms',
      metric1Label: 'Deterministic Query Routing',
      metric2Value: '100%',
      metric2Label: 'Audit Trail Coverage',
      metric3Value: '25%',
      metric3Label: 'Hard Merchant Discount Ceiling',
      metric4Value: '0',
      metric4Label: 'Inventory Double-Deductions',
      whyTitle: 'Architected for High-Trust Agentic Commerce',
      whySubtitle:
        'Traditional generative AI hallucinates prices, invents phantom coupons, and creates inventory race conditions. SellPilot AI enforces hard boundaries.',
      card1Title: 'Deterministic Verification',
      card1Desc:
        'Prices, promo codes, and inventory counts are never generated by LLMs. Everything is calculated and verified server-side.',
      card2Title: 'Idempotent Stock Locks',
      card2Desc:
        'Inventory is only decremented after successful Razorpay HMAC-SHA256 signature verification with atomic locks.',
      card3Title: 'Multi-Language Reasoning',
      card3Desc:
        'Native understanding of Romanized Indian languages like Kannada, Hindi, Tamil, and Telugu mapped to catalog queries.',
      card4Title: 'Immutable Audit Trails',
      card4Desc:
        'Every AI conversation, price recommendation, discount validation, and payment event is permanently logged.',
    },
    catalog: {
      title: 'Live Verified Catalog',
      subtitle: 'All items are real-time synced with server stock and protected by deterministic price enforcement.',
      searchPlaceholder: 'Search products by name or features...',
      categoryAll: 'All',
      maxPriceLabel: 'Max Price:',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      unitsStock: '{count} in stock',
      addToCart: 'Add to Cart',
      inCart: 'In Cart',
      askCopilot: 'Ask Copilot',
      noProducts: 'No products match your filters.',
      resetFilters: 'Reset filters',
      categories: {
        shoes: 'Shoes',
        laptops: 'Laptops',
        phones: 'Phones',
        cameras: 'Cameras',
        accessories: 'Accessories',
        electronics: 'Electronics',
        clothing: 'Clothing',
      },
    },
    productModal: {
      keyFeatures: 'Key Features & Specs',
      guaranteedAuthentic: 'Guaranteed Authentic',
      guaranteedDesc: 'Backed by verified store inventory and atomic order locks.',
      razorpayTestReady: 'Razorpay Test Payment Ready',
      razorpayTestDesc: 'Instant HMAC-SHA256 signature verification in sandbox mode.',
      askAboutProduct: 'Ask AI About This Product',
      close: 'Close',
    },
    cart: {
      title: 'Your Cart',
      itemsCount: '{count} items selected',
      emptyTitle: 'Your cart is empty',
      emptySubtitle: 'Explore products or ask SellPilot AI for smart recommendations.',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      shippingFree: 'FREE',
      discount: 'Discount',
      total: 'Total Amount',
      checkoutBtn: 'Proceed to Checkout',
      clearCart: 'Clear Cart',
      remove: 'Remove',
      outOfStock: 'Out of stock',
      verifiedCheckout: 'Deterministic price verification enabled',
    },
    checkout: {
      title: 'Secure Checkout',
      shippingAddress: 'Shipping Address',
      fullName: 'Full Name',
      email: 'Email Address',
      street: 'Street Address',
      city: 'City',
      state: 'State',
      postalCode: 'Postal Code / PIN',
      phone: 'Phone Number',
      orderSummary: 'Order Summary',
      paymentMethod: 'Payment Method',
      razorpayOption: 'Razorpay Test Mode (Cards, UPI, NetBanking)',
      razorpayDesc: 'Zero real money is charged. Uses Razorpay Test Mode with automated signature verification.',
      payBtn: 'Pay with Razorpay',
      processing: 'Verifying & Initializing Razorpay...',
      successTitle: 'Order Placed Successfully!',
      successDesc: 'Payment verified via Razorpay HMAC signature and stock safely reserved.',
      failureTitle: 'Payment Verification Failed',
      failureDesc: 'Payment could not be verified or was cancelled. Your cart remains safe.',
      viewOrdersBtn: 'View My Orders',
      tryAgainBtn: 'Try Again',
      closeBtn: 'Close',
    },
    orders: {
      title: 'My Orders',
      subtitle: 'Track your order history, verified payments, and live status.',
      noOrdersTitle: 'No orders found',
      noOrdersSubtitle: 'You have not placed any orders yet. Explore our catalog or ask AI.',
      orderNumber: 'Order #',
      orderDate: 'Date',
      orderStatus: 'Status',
      orderTotal: 'Total',
      orderItems: 'Items',
      cancelOrder: 'Cancel Order',
      cancelConfirm: 'Are you sure you want to cancel this order? All items will be restocked to inventory.',
      cancellationSuccess: 'Order cancelled successfully and items restocked.',
      cancellationFailed: 'Failed to cancel order.',
      viewDetails: 'View Details',
      statusPending: 'Pending',
      statusPaid: 'Paid',
      statusProcessing: 'Processing',
      statusCompleted: 'Completed',
      statusCancelled: 'Cancelled',
      statusFailed: 'Failed',
      statusHistory: 'Status Timeline',
      shippingTo: 'Shipping Address',
      paymentId: 'Payment ID',
      restockedNote: 'All purchased items atomically restocked to merchant catalog.',
      orderSummary: 'Order Details',
    },
    auth: {
      welcomeBack: 'Welcome Back',
      createAccount: 'Create Account',
      loginSubtitle: 'Sign in to access your commerce account',
      registerSubtitle: 'Join SellPilot AI Platform',
      nameLabel: 'Full Name',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      roleLabel: 'Account Role',
      customerRole: 'Customer (Buyer)',
      merchantRole: 'Merchant (Seller)',
      businessNameLabel: 'Business / Store Name',
      signInBtn: 'Sign In',
      signUpBtn: 'Create Account',
      noAccountPrompt: "Don't have an account?",
      haveAccountPrompt: 'Already have an account?',
      demoCustomerBtn: 'Fill Demo Customer',
      demoMerchantBtn: 'Fill Demo Merchant',
      demoHeading: 'Or test with prefilled demo credentials:',
    },
    merchant: {
      title: 'Merchant Growth Hub',
      subtitle: 'Data-driven revenue growth, autonomous opportunity discovery, and discount limit guardrails.',
      gatedBadge: 'Gated & Bounded',
      tabInsights: 'AI Growth Insights',
      tabProducts: 'Catalog Management',
      tabCampaigns: 'Campaigns & Discounts',
      tabAudit: 'Immutable Audit Trail',
      accessRestrictedTitle: 'Access Restricted',
      accessRestrictedDesc:
        'The Merchant Hub is reserved for registered sellers and store administrators. You are currently logged in with a Customer account ({email}).',
      returnToDiscoveryBtn: 'Return to Buyer Discovery',
      bestOpportunityTitle: 'Best Opportunity Product',
      bestOpportunityBadge: 'High Upside',
      topPromotionTitle: 'Top Promotion Candidate',
      topPromotionBadge: 'Inventory Depth',
      categoryMomentumTitle: 'Category Momentum',
      categoryMomentumBadge: 'Active Focus',
      revenueVelocityTitle: 'Revenue Velocity',
      revenueVelocityBadge: 'Safe Margin',
      addProductBtn: 'Add Product',
      createCampaignBtn: 'Create Campaign',
      discountValidationTitle: 'Guardrail Discount Checker',
      testDiscountPlaceholder: 'Enter discount % (e.g. 15)',
      validateDiscountBtn: 'Check Guardrail',
      discountAllowed: 'Within Safe Ceiling (<= 25%)',
      discountRejected: 'Rejected: Exceeds 25% Guardrail Limit',
      productTableColName: 'Product Name',
      productTableColCategory: 'Category',
      productTableColPrice: 'Price',
      productTableColStock: 'Stock',
      productTableColStatus: 'Status',
      productTableColActions: 'Actions',
      activeStatus: 'Active',
      inactiveStatus: 'Inactive',
      noProductsMerchant: 'No products in your catalog yet. Add your first item.',
      campaignTableColName: 'Campaign Name',
      campaignTableColDiscount: 'Discount %',
      campaignTableColStatus: 'Status',
      campaignTableColActions: 'Actions',
      approveCampaign: 'Approve',
      activateCampaign: 'Activate',
      noCampaigns: 'No campaigns created yet.',
      auditLogTitle: 'Audit Trail Events',
      auditLogColEvent: 'Event Action',
      auditLogColActor: 'Actor',
      auditLogColStatus: 'Status',
      auditLogColTimestamp: 'Timestamp',
      noAuditLogs: 'No audit logs recorded yet.',
      refreshData: 'Refresh',
    },
    chat: {
      assistantTitle: 'SellPilot AI Assistant',
      agenticCommerce: 'Agentic Commerce',
      languageLabel: 'Language:',
      buyerTab: 'Buyer',
      merchantTab: 'Merchant',
      inputPlaceholder: 'Ask or search naturally in English, Kannada, Hindi, Tamil, Telugu...',
      sendBtn: 'Send',
      initialGreetingBuyer:
        'Hello! I am SellPilot AI. Tell me what product you are looking for, your budget, or desired features, and I will match verified catalog products with price bounds.',
      initialGreetingMerchant:
        'Welcome to SellPilot Merchant Hub. Ask me about product performance, promotion opportunities, upsells, or campaign discount ideas.',
      chip1Buyer: 'I need running shoes under 3000',
      chip2Buyer: 'nanage running shoes beku under 3000',
      chip3Buyer: 'mujhe running shoes chahiye under 2500',
      chip4Buyer: 'laptop under 50k with 16gb ram',
      chip5Buyer: 'Which is cheapest?',
      chip6Buyer: 'buy this now',
      chip1Merchant: 'What should I promote?',
      chip2Merchant: 'Which product has the best opportunity?',
      chip3Merchant: 'What should I cross-sell?',
      chip4Merchant: 'Suggest an upsell',
      chip5Merchant: 'Is a 15% discount safe?',
      chip6Merchant: 'Can I offer 30% discount?',
      addToCartBtn: 'Add to Cart',
      proceedCheckoutBtn: 'Proceed to Checkout',
      orderTotalReady: 'Your total is ready. Click below to continue to checkout.',
    },
    recommendations: {
      upsellTitle: 'Recommended Upgrade (Upsell)',
      crossSellTitle: 'Frequently Bought Together (Cross-Sell)',
      approveAndAdd: 'Approve & Add',
      dismiss: 'Dismiss',
      moreDiff: '+₹{diff} more',
      upsellSuccess: 'Upgrade added to your cart!',
      crossSellSuccess: 'Pairing item added to your cart!',
    },
    testimonials: {
      tag: 'Production Tested',
      title: 'Built for India-Scale Conversational Commerce',
      quote1:
        '“The Romanized multilingual reasoning is an absolute game-changer. Our Kannada and Hindi customers search in Roman script and get instant, accurate catalog matches without LLM price hallucinations.”',
      author1Name: 'Praveen Gowda',
      author1Role: 'Founder, Dakshin Retail',
      quote2:
        '“The Razorpay payment verification combined with zero double-deduction inventory locks makes this completely rock solid for production.”',
      author2Name: 'Ananya Sharma',
      author2Role: 'Head of Product, Apex Retail',
      quote3:
        '“The merchant growth insights automatically flagged excess stock and suggested bounded promotions that boosted our conversion rate by 34%.”',
      author3Name: 'Karthik R.',
      author3Role: 'E-Commerce Director, UrbanStyle',
    },
    faqs: {
      tag: 'Got Questions?',
      title: 'Frequently Asked Questions',
      q1: 'How does Romanized multilingual AI shopping work?',
      a1: 'SellPilot AI recognizes Romanized Indian scripts (such as "nanage shoes beku under 3000" in Kannada, Hinglish, Tanglish, and Telugu). It parses intent, extracts budget caps, and matches live inventory through deterministic server-side queries.',
      q2: 'What prevents AI hallucination on prices and discounts?',
      a2: 'The LLM never computes final prices or discounts. All pricing, promotional discounts (capped by merchant guardrails at max 25%), subtotal math, and stock deductions are executed entirely by deterministic server verification before checkout.',
      q3: 'How are inventory double-deductions prevented?',
      a3: 'Stock is only deducted after Razorpay HMAC-SHA256 signature verification succeeds on the server. Deductions use atomic database operations and an idempotent order-lifecycle lock that prevents double decrement even on concurrent retries.',
      q4: 'What happens when a customer cancels an order?',
      a4: 'When an eligible order (pending, paid, or processing) is cancelled, all purchased item quantities are atomically restocked into the active merchant catalog, and an immutable audit log is generated.',
    },
    footer: {
      track: 'Razorpay Track 01 (AI Growth & Agentic Commerce)',
      bounded: 'Bounded & Deterministic',
      testMode: 'Razorpay Test Mode',
      copyright: '© {year} SellPilot AI. Built with Manrope typography & bounded agentic commerce.',
    },
  },

  // ========================== KANNADA (ಕನ್ನಡ) ==========================
  kn: {
    common: {
      loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
      offline: 'ಆಫ್‌ಲೈನ್',
      healthy: 'ಆನ್‌ಲೈನ್',
      connecting: 'ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...',
      save: 'ಉಳಿಸಿ',
      cancel: 'ರದ್ದುಮಾಡಿ',
      confirm: 'ದೃಢೀಕರಿಸಿ',
      delete: 'ಅಳಿಸಿ',
      edit: 'ತಿದ್ದುಪಡಿ',
      close: 'ಮುಚ್ಚಿ',
      back: 'ಹಿಂದಕ್ಕೆ',
      retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
      status: 'ಸ್ಥಿತಿ',
      action: 'ಕ್ರಿಯೆ',
      success: 'ಯಶಸ್ವಿಯಾಗಿದೆ',
      error: 'ದೋಷ',
      warning: 'ಎಚ್ಚರಿಕೆ',
      viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
    },
    nav: {
      buyerDiscovery: 'ಖರೀದಿದಾರರ ಅನ್ವೇಷಣೆ',
      merchantHub: 'ವ್ಯಾಪಾರಿ ಕೇಂದ್ರ',
      myOrders: 'ನನ್ನ ಆದೇಶಗಳು',
      askAI: 'SellPilot AI ಕೇಳಿ',
      login: 'ಲಾಗಿನ್',
      logout: 'ಲಾಗ್‌ಔಟ್',
      cart: 'ಕಾರ್ಟ್',
      trackBadge: 'ಟ್ರ್ಯಾಕ್ 01',
      customerRole: 'ಗ್ರಾಹಕ',
      merchantRole: 'ವ್ಯಾಪಾರಿ',
      adminRole: 'ನಿರ್ವಾಹಕ',
    },
    hero: {
      badge: 'SellPilot AI 2.0 • ನಿರ್ಬಂಧಿತ ಏಜೆಂಟಿಕ್ ವಾಣಿಜ್ಯ & Razorpay ಟೆಸ್ಟ್ ಮೋಡ್',
      titleLine1: 'ಸಂಭಾಷಣಾತ್ಮಕ ವಾಣಿಜ್ಯ,',
      titleLine2: 'ಖಚಿತ ತರ್ಕದಿಂದ ಸಂರಕ್ಷಿತ.',
      subtitle:
        'SellPilot AI ಶಾಪರ್‌ಗಳಿಗೆ ಇಂಗ್ಲಿಷ್ ಅಥವಾ ರೋಮನೈಸ್ಡ್ ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ (ಕನ್ನಡ, ಹಿಂದಿ, ತಮಿಳು, ತೆಲುಗು) ಸ್ವಾಭಾವಿಕವಾಗಿ ಹುಡುಕಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ, ಮತ್ತು ವ್ಯಾಪಾರಿಗಳಿಗೆ ಸುರಕ್ಷಿತ ಮಾರ್ಗದರ್ಶಿಗಳೊಂದಿಗೆ AI ಬೆಳವಣಿಗೆಯ ಅವಕಾಶಗಳನ್ನು ನೀಡುತ್ತದೆ.',
      launchAssistant: 'AI ಸಹಾಯಕ ತೆರೆಯಿರಿ',
      exploreCatalog: 'ಕ್ಯಾಟಲಾಗ್ ಅನ್ವೇಷಿಸಿ',
      searchPlaceholder: 'ಹುಡುಕಿ ಅಥವಾ ಕೇಳಿ: ಉದಾ. {sample}',
      askAIBtn: 'AI ಕೇಳಿ',
      tryRomanized: 'ರೋಮನೈಸ್ಡ್ ಪ್ರಯತ್ನಿಸಿ:',
      gatewayTitle: 'SellPilot AI — ಸ್ವಾಯತ್ತ ಗಾರ್ಡ್‌ರೈಲ್ ಗೇಟ್‌ವೇ',
      testModeBadge: 'Razorpay ಟೆಸ್ಟ್ ಮೋಡ್',
      hmacBadge: 'HMAC-SHA256 ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
      multilingualStream: 'ಬಹುಭಾಷಾ ಸ್ಟ್ರೀಮ್',
      responseSpeed: 'ಪ್ರತಿಕ್ರಿಯೆ < 180ms',
      buyerSampleBadge: 'ಖರೀದಿದಾರ (ರೋಮನೈಸ್ಡ್ ಕನ್ನಡ)',
      buyerSampleText: '“nanage marathon ge running shoes beku 3000 olage”',
      copilotBadge: 'SELLPILOT ಕೋಪೈಲಟ್',
      copilotSampleText:
        'ಸಿಕ್ಕಿದೆ! Pro Carbon Running Shoes ಮ್ಯಾರಥಾನ್ ಓಟಕ್ಕೆ ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆಯಾಗಿದ್ದು ಕಾರ್ಬನ್-ಪ್ಲೇಟ್ ಕುಶನಿಂಗ್ ಹೊಂದಿದೆ.',
      verifiedStock: 'ಪರಿಶೀಲಿಸಿದ ದಾಸ್ತಾನು ಇದೆ',
      stockCount: '12 ಯೂನಿಟ್ಸ್',
      guardrailPipeline: 'ಗಾರ್ಡ್‌ರೈಲ್ ಪೈಪ್‌ಲೈನ್',
      maxDiscountLabel: 'ಗರಿಷ್ಠ ರಿಯಾಯಿತಿ ಮಿತಿ',
      maxDiscountValue: '25% ಗರಿಷ್ಠ',
      stockDecrementLabel: 'ದಾಸ್ತಾನು ಕಡಿತ',
      stockDecrementValue: 'ಸಹಿ ಪರಿಶೀಲನೆ ನಂತರ',
      auditTrailLabel: 'ಆಡಿಟ್ ಟ್ರಯಲ್',
      auditTrailValue: 'ಬದಲಾಯಿಸಲಾಗದ್ದು',
      openMerchantHub: 'ವ್ಯಾಪಾರಿ ಕೇಂದ್ರ ತೆರೆಯಿರಿ',
      merchantOnlyHub: 'ವ್ಯಾಪಾರಿ ಕೇಂದ್ರ (ವ್ಯಾಪಾರಿಗಳಿಗೆ ಮಾತ್ರ)',
    },
    trust: {
      metric1Value: '< 200ms',
      metric1Label: 'ಖಚಿತ ಕ್ವೆರಿ ರೂಟಿಂಗ್',
      metric2Value: '100%',
      metric2Label: 'ಆಡಿಟ್ ಟ್ರಯಲ್ ಕವರೇಜ್',
      metric3Value: '25%',
      metric3Label: 'ವ್ಯಾಪಾರಿ ರಿಯಾಯಿತಿ ಗರಿಷ್ಠ ಮಿತಿ',
      metric4Value: '0',
      metric4Label: 'ಡಬಲ್ ದಾಸ್ತಾನು ಕಡಿತವಿಲ್ಲ',
      whyTitle: 'ಉನ್ನತ ವಿಶ್ವಾಸಾರ್ಹ ಏಜೆಂಟಿಕ್ ವಾಣಿಜ್ಯಕ್ಕಾಗಿ ನಿರ್ಮಿತ',
      whySubtitle:
        'ಸಾಂಪ್ರದಾಯಿಕ ಜನರೇಟಿವ್ AI ಬೆಲೆಗಳನ್ನು ಕಲ್ಪಿಸುತ್ತದೆ ಮತ್ತು ತಪ್ಪು ಕೂಪನ್‌ಗಳನ್ನು ಸೃಷ್ಟಿಸುತ್ತದೆ. SellPilot AI ಕಟ್ಟುನಿಟ್ಟಾದ ಗಡಿಗಳನ್ನು ಜಾರಿಗೊಳಿಸುತ್ತದೆ.',
      card1Title: 'ಖಚಿತ ಪರಿಶೀಲನೆ',
      card1Desc:
        'ಬೆಲೆಗಳು, ಪ್ರೋಮೋ ಕೋಡ್‌ಗಳು ಮತ್ತು ದಾಸ್ತಾನು ಲೆಕ್ಕಗಳನ್ನು ಎಂದಿಗೂ LLM ನಿಂದ ಉತ್ಪಾದಿಸಲಾಗುವುದಿಲ್ಲ. ಎಲ್ಲವೂ ಸರ್ವರ್ ಬದಿಯಲ್ಲಿ ಲೆಕ್ಕಹಾಕಿ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.',
      card2Title: 'ಐಡೆಂಪೊಟೆಂಟ್ ಸ್ಟಾಕ್ ಲಾಕ್‌ಗಳು',
      card2Desc:
        'ಯಶಸ್ವಿ Razorpay HMAC-SHA256 ಸಹಿ ಪರಿಶೀಲನೆಯ ನಂತರ ಮಾತ್ರ ಅಟಾಮಿಕ್ ಲಾಕ್‌ಗಳೊಂದಿಗೆ ದಾಸ್ತಾನು ಕಡಿತಗೊಳಿಸಲಾಗುತ್ತದೆ.',
      card3Title: 'ಬಹುಭಾಷಾ ತಾರ್ಕಿಕತೆ',
      card3Desc:
        'ಕನ್ನಡ, ಹಿಂದಿ, ತಮಿಳು ಮತ್ತು ತೆಲುಗು ರೋಮನೈಸ್ಡ್ ಭಾಷೆಗಳ ನೈಸರ್ಗಿಕ ತಿಳುವಳಿಕೆಯನ್ನು ಕ್ಯಾಟಲಾಗ್ ಕ್ವೆರಿಗಳಿಗೆ ಮ್ಯಾಪ್ ಮಾಡಲಾಗುತ್ತದೆ.',
      card4Title: 'ಶಾಶ್ವತ ಆಡಿಟ್ ಟ್ರಯಲ್',
      card4Desc:
        'ಪ್ರತಿ AI ಸಂಭಾಷಣೆ, ಬೆಲೆ ಶಿಫಾರಸು, ರಿಯಾಯಿತಿ ಪರಿಶೀಲನೆ ಮತ್ತು ಪಾವತಿ ಘಟನೆಯು ಶಾಶ್ವತವಾಗಿ ದಾಖಲಾಗುತ್ತದೆ.',
    },
    catalog: {
      title: 'ಲೈವ್ ಪರಿಶೀಲಿತ ಕ್ಯಾಟಲಾಗ್',
      subtitle: 'ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು ಸರ್ವರ್ ಸ್ಟಾಕ್‌ನೊಂದಿಗೆ ನೈಜ-ಸಮಯದಲ್ಲಿ ಸಿಂಕ್ ಆಗಿದ್ದು ಖಚಿತ ಬೆಲೆಯೊಂದಿಗೆ ಸುರಕ್ಷಿತವಾಗಿವೆ.',
      searchPlaceholder: 'ಹೆಸರು ಅಥವಾ ವೈಶಿಷ್ಟ್ಯಗಳ ಮೂಲಕ ಹುಡುಕಿ...',
      categoryAll: 'ಎಲ್ಲವೂ',
      maxPriceLabel: 'ಗರಿಷ್ಠ ಬೆಲೆ:',
      inStock: 'ದಾಸ್ತಾನು ಇದೆ',
      outOfStock: 'ಖಾಲಿಯಾಗಿದೆ',
      unitsStock: '{count} ಲಭ್ಯವಿದೆ',
      addToCart: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
      inCart: 'ಕಾರ್ಟ್‌ನಲ್ಲಿದೆ',
      askCopilot: 'ಕೋಪೈಲಟ್ ಕೇಳಿ',
      noProducts: 'ಯಾವುದೇ ಉತ್ಪನ್ನಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.',
      resetFilters: 'ಫಿಲ್ಟರ್ ಮರುಹೊಂದಿಸಿ',
      categories: {
        shoes: 'ಶೂಗಳು',
        laptops: 'ಲ್ಯಾಪ್ಟಾಪ್‌ಗಳು',
        phones: 'ಮೊಬೈಲ್ ಫೋನ್‌ಗಳು',
        cameras: 'ಕ್ಯಾಮೆರಾಗಳು',
        accessories: 'ಪರಿಕರಗಳು',
        electronics: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್',
        clothing: 'ಉಡುಪುಗಳು',
      },
    },
    productModal: {
      keyFeatures: 'ಮುಖ್ಯ ವೈಶಿಷ್ಟ್ಯಗಳು & ವಿವರಗಳು',
      guaranteedAuthentic: 'ಅಸಲಿ ಉತ್ಪನ್ನದ ಖಾತರಿ',
      guaranteedDesc: 'ಪರಿಶೀಲಿತ ಅಂಗಡಿ ದಾಸ್ತಾನು ಮತ್ತು ಅಟಾಮಿಕ್ ಆರ್ಡರ್ ಲಾಕ್‌ಗಳಿಂದ ಸುರಕ್ಷಿತ.',
      razorpayTestReady: 'Razorpay ಟೆಸ್ಟ್ ಪಾವತಿಗೆ ಸಿದ್ಧವಾಗಿದೆ',
      razorpayTestDesc: 'ಸ್ಯಾಂಡ್‌ಬಾಕ್ಸ್ ಮೋಡ್‌ನಲ್ಲಿ ತಕ್ಷಣದ HMAC-SHA256 ಸಹಿ ಪರಿಶೀಲನೆ.',
      askAboutProduct: 'ಈ ಉತ್ಪನ್ನದ ಬಗ್ಗೆ AI ಕೇಳಿ',
      close: 'ಮುಚ್ಚಿ',
    },
    cart: {
      title: 'ನಿಮ್ಮ ಕಾರ್ಟ್',
      itemsCount: '{count} ಐಟಂಗಳು ಆಯ್ಕೆಯಾಗಿವೆ',
      emptyTitle: 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ',
      emptySubtitle: 'ಉತ್ಪನ್ನಗಳನ್ನು ಅನ್ವೇಷಿಸಿ ಅಥವಾ ಸ್ಮಾರ್ಟ್ ಶಿಫಾರಸುಗಳಿಗಾಗಿ SellPilot AI ಕೇಳಿ.',
      subtotal: 'ಉಪಮೊತ್ತ',
      shipping: 'ರವಾನೆ',
      shippingFree: 'ಉಚಿತ',
      discount: 'ರಿಯಾಯಿತಿ',
      total: 'ಒಟ್ಟು ಮೊತ್ತ',
      checkoutBtn: 'ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
      clearCart: 'ಕಾರ್ಟ್ ಖಾಲಿ ಮಾಡಿ',
      remove: 'ತೆಗೆದುಹಾಕಿ',
      outOfStock: 'ದಾಸ್ತಾನು ಇಲ್ಲ',
      verifiedCheckout: 'ಖಚಿತ ಬೆಲೆ ಪರಿಶೀಲನೆ ಸಕ್ರಿಯವಾಗಿದೆ',
    },
    checkout: {
      title: 'ಸುರಕ್ಷಿತ ಚೆಕ್‌ಔಟ್',
      shippingAddress: 'ರವಾನೆ ವಿಳಾಸ',
      fullName: 'ಪೂರ್ಣ ಹೆಸರು',
      email: 'ಇಮೇಲ್ ವಿಳಾಸ',
      street: 'ರಸ್ತೆ ವಿಳಾಸ',
      city: 'ನಗರ',
      state: 'ರಾಜ್ಯ',
      postalCode: 'ಪಿನ್‌ಕೋಡ್',
      phone: 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
      orderSummary: 'ಆದೇಶದ ಸಾರಾಂಶ',
      paymentMethod: 'ಪಾವತಿ ವಿಧಾನ',
      razorpayOption: 'Razorpay ಟೆಸ್ಟ್ ಮೋಡ್ (UPI / ಕಾರ್ಡ್ಸ್ / ನೆಟ್‌ಬ್ಯಾಂಕಿಂಗ್)',
      razorpayDesc: 'ಯಾವುದೇ ನೈಜ ಹಣ ಕಡಿತವಾಗುವುದಿಲ್ಲ. ಸ್ವಯಂಚಾಲಿತ ಸಹಿ ಪರಿಶೀಲನೆಯೊಂದಿಗೆ ಟೆಸ್ಟ್ ಮೋಡ್ ಬಳಸುತ್ತದೆ.',
      payBtn: 'Razorpay ಮೂಲಕ ಪಾವತಿಸಿ',
      processing: 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ & Razorpay ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...',
      successTitle: 'ಆದೇಶ ಯಶಸ್ವಿಯಾಗಿ ನೀಡಲಾಗಿದೆ!',
      successDesc: 'Razorpay HMAC ಸಹಿ ಮೂಲಕ ಪಾವತಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ದಾಸ್ತಾನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
      failureTitle: 'ಪಾವತಿ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ',
      failureDesc: 'ಪಾವತಿಯನ್ನು ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ ಅಥವಾ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಕಾರ್ಟ್ ಸುರಕ್ಷಿತವಾಗಿದೆ.',
      viewOrdersBtn: 'ನನ್ನ ಆದೇಶಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
      tryAgainBtn: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
      closeBtn: 'ಮುಚ್ಚಿ',
    },
    orders: {
      title: 'ನನ್ನ ಆದೇಶಗಳು',
      subtitle: 'ನಿಮ್ಮ ಆದೇಶದ ಇತಿಹಾಸ, ಪರಿಶೀಲಿಸಿದ ಪಾವತಿಗಳು ಮತ್ತು ನೇರ ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
      noOrdersTitle: 'ಯಾವುದೇ ಆದೇಶಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
      noOrdersSubtitle: 'ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಆದೇಶಗಳನ್ನು ನೀಡಿಲ್ಲ. ನಮ್ಮ ಕ್ಯಾಟಲಾಗ್ ಅನ್ನು ಅನ್ವೇಷಿಸಿ.',
      orderNumber: 'ಆದೇಶ ಸಂಖ್ಯೆ',
      orderDate: 'ದಿನಾಂಕ',
      orderStatus: 'ಸ್ಥಿತಿ',
      orderTotal: 'ಒಟ್ಟು',
      orderItems: 'ಐಟಂಗಳು',
      cancelOrder: 'ಆದೇಶ ರದ್ದುಮಾಡಿ',
      cancelConfirm: 'ಈ ಆದೇಶವನ್ನು ರದ್ದುಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ? ಎಲ್ಲಾ ಐಟಂಗಳು ದಾಸ್ತಾನಿಗೆ ಮರಳುತ್ತವೆ.',
      cancellationSuccess: 'ಆದೇಶ ರದ್ದಾಗಿದೆ ಮತ್ತು ದಾಸ್ತಾನು ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.',
      cancellationFailed: 'ಆದೇಶ ರದ್ದುಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ.',
      viewDetails: 'ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
      statusPending: 'ಬಾಕಿ ಉಳಿದಿದೆ',
      statusPaid: 'ಪಾವತಿಸಲಾಗಿದೆ',
      statusProcessing: 'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ',
      statusCompleted: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
      statusCancelled: 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ',
      statusFailed: 'ವಿಫಲವಾಗಿದೆ',
      statusHistory: 'ಸ್ಥಿತಿ ಇತಿಹಾಸ',
      shippingTo: 'ರವಾನೆ ವಿಳಾಸ',
      paymentId: 'ಪಾವತಿ ID',
      restockedNote: 'ಎಲ್ಲಾ ಖರೀದಿಸಿದ ಐಟಂಗಳು ವ್ಯಾಪಾರಿ ಕ್ಯಾಟಲಾಗ್‌ಗೆ ಅಟಾಮಿಕ್ ಆಗಿ ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.',
      orderSummary: 'ಆದೇಶದ ವಿವರಗಳು',
    },
    auth: {
      welcomeBack: 'ಮರಳಿ ಸುಸ್ವಾಗತ',
      createAccount: 'ಖಾತೆ ತೆರೆಯಿರಿ',
      loginSubtitle: 'ನಿಮ್ಮ ವಾಣಿಜ್ಯ ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ',
      registerSubtitle: 'SellPilot AI ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗೆ ಸೇರಿ',
      nameLabel: 'ಪೂರ್ಣ ಹೆಸರು',
      emailLabel: 'ಇಮೇಲ್ ವಿಳಾಸ',
      passwordLabel: 'ಗುಪ್ತಪದ',
      roleLabel: 'ಖಾತೆಯ ಪಾತ್ರ',
      customerRole: 'ಗ್ರಾಹಕ (ಖರೀದಿದಾರ)',
      merchantRole: 'ವ್ಯಾಪಾರಿ (ಮಾರಾಟಗಾರ)',
      businessNameLabel: 'ವ್ಯಾಪಾರ / ಅಂಗಡಿಯ ಹೆಸರು',
      signInBtn: 'ಸೈನ್ ಇನ್',
      signUpBtn: 'ಖಾತೆ ರಚಿಸಿ',
      noAccountPrompt: 'ಖಾತೆ ಇಲ್ಲವೇ?',
      haveAccountPrompt: 'ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?',
      demoCustomerBtn: 'ಡೆಮೊ ಗ್ರಾಹಕ ಭರ್ತಿ ಮಾಡಿ',
      demoMerchantBtn: 'ಡೆಮೊ ವ್ಯಾಪಾರಿ ಭರ್ತಿ ಮಾಡಿ',
      demoHeading: 'ಅಥವಾ ಪೂರ್ವ-ಭರ್ತಿ ಮಾಡಿದ ಡೆಮೊ ರುಜುವಾತುಗಳೊಂದಿಗೆ ಪರೀಕ್ಷಿಸಿ:',
    },
    merchant: {
      title: 'ವ್ಯಾಪಾರಿ ಬೆಳವಣಿಗೆ ಕೇಂದ್ರ',
      subtitle: 'ಡೇಟಾ-ಚಾಲಿತ ಆದಾಯ ಬೆಳವಣಿಗೆ, ಸ್ವಾಯತ್ತ ಅವಕಾಶ ಅನ್ವೇಷಣೆ ಮತ್ತು ರಿಯಾಯಿತಿ ಗಾರ್ಡ್‌ರೈಲ್‌ಗಳು.',
      gatedBadge: 'ಸುರಕ್ಷಿತ & ನಿರ್ಬಂಧಿತ',
      tabInsights: 'AI ಬೆಳವಣಿಗೆ ಒಳನೋಟಗಳು',
      tabProducts: 'ಕ್ಯಾಟಲಾಗ್ ನಿರ್ವಹಣೆ',
      tabCampaigns: 'ಅಭಿಯಾನಗಳು & ರಿಯಾಯಿತಿಗಳು',
      tabAudit: 'ಶಾಶ್ವತ ಆಡಿಟ್ ಟ್ರಯಲ್',
      accessRestrictedTitle: 'ಪ್ರವೇಶ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ',
      accessRestrictedDesc:
        'ವ್ಯಾಪಾರಿ ಕೇಂದ್ರವು ನೋಂದಾಯಿತ ಮಾರಾಟಗಾರರು ಮತ್ತು ಅಂಗಡಿ ನಿರ್ವಾಹಕರಿಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ. ನೀವು ಗ್ರಾಹಕರ ಖಾತೆಯೊಂದಿಗೆ ({email}) ಲಾಗಿನ್ ಆಗಿದ್ದೀರಿ.',
      returnToDiscoveryBtn: 'ಖರೀದಿದಾರರ ಅನ್ವೇಷಣೆಗೆ ಹಿಂತಿರುಗಿ',
      bestOpportunityTitle: 'ಅತ್ಯುತ್ತಮ ಅವಕಾಶ ಉತ್ಪನ್ನ',
      bestOpportunityBadge: 'ಹೆಚ್ಚಿನ ಲಾಭದಾಯಕತೆ',
      topPromotionTitle: 'ಅಗ್ರ ಪ್ರಚಾರ ಅಭ್ಯರ್ಥಿ',
      topPromotionBadge: 'ದಾಸ್ತಾನು ಆಳ',
      categoryMomentumTitle: 'ವರ್ಗದ ಆವೇಗ',
      categoryMomentumBadge: 'ಸಕ್ರಿಯ ಗಮನ',
      revenueVelocityTitle: 'ಆದಾಯ ವೇಗ',
      revenueVelocityBadge: 'ಸುರಕ್ಷಿತ ಮಾರ್ಜಿನ್',
      addProductBtn: 'ಉತ್ಪನ್ನ ಸೇರಿಸಿ',
      createCampaignBtn: 'ಅಭಿಯಾನ ರಚಿಸಿ',
      discountValidationTitle: 'ಗಾರ್ಡ್‌ರೈಲ್ ರಿಯಾಯಿತಿ ಪರೀಕ್ಷಕ',
      testDiscountPlaceholder: 'ರಿಯಾಯಿತಿ % ನಮೂದಿಸಿ (ಉದಾ. 15)',
      validateDiscountBtn: 'ಗಾರ್ಡ್‌ರೈಲ್ ಪರಿಶೀಲಿಸಿ',
      discountAllowed: 'ಸುರಕ್ಷಿತ ಮಿತಿಯಲ್ಲಿದೆ (<= 25%)',
      discountRejected: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ: 25% ಗಾರ್ಡ್‌ರೈಲ್ ಮೀರಿದೆ',
      productTableColName: 'ಉತ್ಪನ್ನದ ಹೆಸರು',
      productTableColCategory: 'ವರ್ಗ',
      productTableColPrice: 'ಬೆಲೆ',
      productTableColStock: 'ದಾಸ್ತಾನು',
      productTableColStatus: 'ಸ್ಥಿತಿ',
      productTableColActions: 'ಕ್ರಿಯೆಗಳು',
      activeStatus: 'ಸಕ್ರಿಯ',
      inactiveStatus: 'ನಿಷ್ಕ್ರಿಯ',
      noProductsMerchant: 'ನಿಮ್ಮ ಕ್ಯಾಟಲಾಗ್‌ನಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಉತ್ಪನ್ನಗಳಿಲ್ಲ. ಮೊದಲ ಐಟಂ ಸೇರಿಸಿ.',
      campaignTableColName: 'ಅಭಿಯಾನದ ಹೆಸರು',
      campaignTableColDiscount: 'ರಿಯಾಯಿತಿ %',
      campaignTableColStatus: 'ಸ್ಥಿತಿ',
      campaignTableColActions: 'ಕ್ರಿಯೆಗಳು',
      approveCampaign: 'ಅನುಮೋದಿಸಿ',
      activateCampaign: 'ಸಕ್ರಿಯಗೊಳಿಸಿ',
      noCampaigns: 'ಇನ್ನೂ ಯಾವುದೇ ಅಭಿಯಾನಗಳನ್ನು ರಚಿಸಲಾಗಿಲ್ಲ.',
      auditLogTitle: 'ಆಡಿಟ್ ಟ್ರಯಲ್ ಘಟನೆಗಳು',
      auditLogColEvent: 'ಘಟನೆಯ ಕ್ರಿಯೆ',
      auditLogColActor: 'ಕರ್ತೃ',
      auditLogColStatus: 'ಸ್ಥಿತಿ',
      auditLogColTimestamp: 'ಸಮಯಮುದ್ರೆ',
      noAuditLogs: 'ಯಾವುದೇ ಆಡಿಟ್ ಲಾಗ್‌ಗಳು ದಾಖಲಾಗಿಲ್ಲ.',
      refreshData: 'ರಿಫ್ರೆಶ್',
    },
    chat: {
      assistantTitle: 'SellPilot AI ಸಹಾಯಕ',
      agenticCommerce: 'ಏಜೆಂಟಿಕ್ ವಾಣಿಜ್ಯ',
      languageLabel: 'ಭಾಷೆ:',
      buyerTab: 'ಖರೀದಿದಾರ',
      merchantTab: 'ವ್ಯಾಪಾರಿ',
      inputPlaceholder: 'ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ತಮಿಳು, ತೆಲುಗಿನಲ್ಲಿ ಸ್ವಾಭಾವಿಕವಾಗಿ ಕೇಳಿ ಅಥವಾ ಹುಡುಕಿ...',
      sendBtn: 'ಕಳುಹಿಸಿ',
      initialGreetingBuyer:
        'ನಮಸ್ಕಾರ! ನಾನು SellPilot AI. ನೀವು ಯಾವ ಉತ್ಪನ್ನವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ, ನಿಮ್ಮ ಬಜೆಟ್ ಅಥವಾ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ತಿಳಿಸಿ, ನಾನು ಪರಿಶೀಲಿಸಿದ ಕ್ಯಾಟಲಾಗ್ ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿಕೊಡುತ್ತೇನೆ.',
      initialGreetingMerchant:
        'SellPilot ವ್ಯಾಪಾರಿ ಕೇಂದ್ರಕ್ಕೆ ಸುಸ್ವಾಗತ. ಉತ್ಪನ್ನಗಳ ಕಾರ್ಯಕ್ಷಮತೆ, ಪ್ರಚಾರದ ಅವಕಾಶಗಳು ಅಥವಾ ರಿಯಾಯಿತಿ ವಿಚಾರಗಳ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಿ.',
      chip1Buyer: 'nanage running shoes beku under 3000',
      chip2Buyer: 'ಯಾವ ಶೂ ಅತ್ಯಂತ ಅಗ್ಗವಾಗಿದೆ?',
      chip3Buyer: 'ಲ್ಯಾಪ್ಟಾಪ್ 50k ಒಳಗೆ 16gb ram ಇರೋದು',
      chip4Buyer: 'ನನ್ನ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
      chip5Buyer: 'ಇದನ್ನು ಈಗಲೇ ಖರೀದಿಸಿ',
      chip6Buyer: 'ಕಾರ್ಟ್ ತೋರಿಸಿ',
      chip1Merchant: 'ನಾನು ಯಾವ ಉತ್ಪನ್ನ ಪ್ರಚಾರ ಮಾಡಬೇಕು?',
      chip2Merchant: 'ಯಾವ ಉತ್ಪನ್ನದಲ್ಲಿ ಉತ್ತಮ ಅವಕಾಶವಿದೆ?',
      chip3Merchant: 'ಕ್ರಾಸ್-ಸೆಲ್ ಏನು ನೀಡಬಹುದು?',
      chip4Merchant: 'ಅಪ್‌ಸೆಲ್ ಸಲಹೆ ನೀಡಿ',
      chip5Merchant: '15% ರಿಯಾಯಿತಿ ಸುರಕ್ಷಿತವೇ?',
      chip6Merchant: '30% ರಿಯಾಯಿತಿ ನೀಡಬಹುದೇ?',
      addToCartBtn: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
      proceedCheckoutBtn: 'ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
      orderTotalReady: 'ನಿಮ್ಮ ಮೊತ್ತ ಸಿದ್ಧವಾಗಿದೆ. ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಲು ಕೆಳಗೆ ಕ್ಲಿಕ್ ಮಾಡಿ.',
    },
    recommendations: {
      upsellTitle: 'ಶಿಫಾರಸು ಮಾಡಿದ ಅಪ್‌ಗ್ರೇಡ್ (ಅಪ್‌ಸೆಲ್)',
      crossSellTitle: 'ಜೊತೆಯಾಗಿ ಖರೀದಿಸಬಹುದಾದ ಐಟಂ (ಕ್ರಾಸ್-ಸೆಲ್)',
      approveAndAdd: 'ಅನುಮೋದಿಸಿ & ಸೇರಿಸಿ',
      dismiss: 'ತಿರಸ್ಕರಿಸಿ',
      moreDiff: '+₹{diff} ಹೆಚ್ಚು',
      upsellSuccess: 'ಅಪ್‌ಗ್ರೇಡ್ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!',
      crossSellSuccess: 'ಜೊತೆಯ ಐಟಂ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!',
    },
    testimonials: {
      tag: 'ಉತ್ಪಾದನಾ ಪರೀಕ್ಷಿತ',
      title: 'ಭಾರತೀಯ ಮಟ್ಟದ ಸಂಭಾಷಣಾತ್ಮಕ ವಾಣಿಜ್ಯಕ್ಕಾಗಿ ಸಿದ್ಧ',
      quote1:
        '“ರೋಮನೈಸ್ಡ್ ಬಹುಭಾಷಾ ತಾರ್ಕಿಕತೆಯು ನಿಜವಾಗಿಯೂ ಅದ್ಭುತವಾಗಿದೆ. ನಮ್ಮ ಕನ್ನಡ ಮತ್ತು ಹಿಂದಿ ಗ್ರಾಹಕರು ರೋಮನ್ ಲಿಪಿಯಲ್ಲಿ ಹುಡುಕುತ್ತಾರೆ ಮತ್ತು ಯಾವುದೇ ಬೆಲೆ ತಪ್ಪಿಲ್ಲದೆ ನಿಖರ ಫಲಿತಾಂಶಗಳನ್ನು ಪಡೆಯುತ್ತಾರೆ.”',
      author1Name: 'ಪ್ರವೀಣ್ ಗೌಡ',
      author1Role: 'ಸಂಸ್ಥಾಪಕರು, ದಕ್ಷಿಣ ರಿಟೇಲ್',
      quote2:
        '“Razorpay ಪಾವತಿ ಪರಿಶೀಲನೆ ಮತ್ತು ಡಬಲ್-ಕಡಿತವಿಲ್ಲದ ದಾಸ್ತಾನು ಲಾಕ್‌ಗಳು ಇದನ್ನು ಉತ್ಪಾದನೆಗೆ ಅತ್ಯಂತ ದೃಢವಾಗಿಸಿದೆ.”',
      author2Name: 'ಅನನ್ಯಾ ಶರ್ಮಾ',
      author2Role: 'ಉತ್ಪನ್ನ ಮುಖ್ಯಸ್ಥರು, ಅಪೆಕ್ಸ್ ರಿಟೇಲ್',
      quote3:
        '“ವ್ಯಾಪಾರಿ ಬೆಳವಣಿಗೆ ಒಳನೋಟಗಳು ಹೆಚ್ಚುವರಿ ಸ್ಟಾಕ್ ಅನ್ನು ಗುರುತಿಸಿ ಸುರಕ್ಷಿತ ಪ್ರಚಾರಗಳನ್ನು ಸೂಚಿಸಿದ್ದು ನಮ್ಮ ಪರಿವರ್ತನೆಯನ್ನು 34% ಹೆಚ್ಚಿಸಿದೆ.”',
      author3Name: 'ಕಾರ್ತಿಕ್ ಆರ್.',
      author3Role: 'ಇ-ಕಾಮರ್ಸ್ ನಿರ್ದೇಶಕರು, ಅರ್ಬನ್‌ಸ್ಟೈಲ್',
    },
    faqs: {
      tag: 'ಪ್ರಶ್ನೆಗಳಿವೆಯೇ?',
      title: 'ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು',
      q1: 'ರೋಮನೈಸ್ಡ್ ಬಹುಭಾಷಾ AI ಶಾಪಿಂಗ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
      a1: 'SellPilot AI ರೋಮನೈಸ್ಡ್ ಭಾರತೀಯ ಲಿಪಿಗಳನ್ನು ("nanage shoes beku under 3000") ಗುರುತಿಸುತ್ತದೆ. ಇದು ಉದ್ದೇಶವನ್ನು ಅರ್ಥೈಸಿಕೊಂಡು ನೇರ ದಾಸ್ತಾನಿನೊಂದಿಗೆ ಹೊಂದಿಸುತ್ತದೆ.',
      q2: 'ಬೆಲೆ ಮತ್ತು ರಿಯಾಯಿತಿಗಳಲ್ಲಿ AI ತಪ್ಪು ಮಾಡುವುದನ್ನು ಯಾವುದು ತಡೆಯುತ್ತದೆ?',
      a2: 'LLM ಎಂದಿಗೂ ಅಂತಿಮ ಬೆಲೆ ಅಥವಾ ರಿಯಾಯಿತಿಗಳನ್ನು ನಿರ್ಧರಿಸುವುದಿಲ್ಲ. ಎಲ್ಲಾ ಲೆಕ್ಕಾಚಾರಗಳು ಸರ್ವರ್ ಪರಿಶೀಲನೆಯ ಮೂಲಕವೇ ನಡೆಯುತ್ತವೆ (ಗರಿಷ್ಠ 25% ಮಿತಿ).',
      q3: 'ಡಬಲ್ ದಾಸ್ತಾನು ಕಡಿತವನ್ನು ಹೇಗೆ ತಡೆಯಲಾಗುತ್ತದೆ?',
      a3: 'ಸರ್ವರ್‌ನಲ್ಲಿ Razorpay HMAC-SHA256 ಸಹಿ ಪರಿಶೀಲನೆ ಯಶಸ್ವಿಯಾದ ನಂತರವೇ ಅಟಾಮಿಕ್ ಆಪರೇಷನ್‌ಗಳೊಂದಿಗೆ ದಾಸ್ತಾನು ಕಡಿತಗೊಳಿಸಲಾಗುತ್ತದೆ.',
      q4: 'ಗ್ರಾಹಕರು ಆದೇಶವನ್ನು ರದ್ದುಗೊಳಿಸಿದಾಗ ಏನಾಗುತ್ತದೆ?',
      a4: 'ಆದೇಶ ರದ್ದಾದಾಗ, ಖರೀದಿಸಿದ ಎಲ್ಲಾ ಐಟಂಗಳ ಪ್ರಮಾಣಗಳು ವ್ಯಾಪಾರಿ ಕ್ಯಾಟಲಾಗ್‌ಗೆ ಅಟಾಮಿಕ್ ಆಗಿ ಮರುಸ್ಥಾಪನೆಯಾಗುತ್ತವೆ ಮತ್ತು ಆಡಿಟ್ ಲಾಗ್ ದಾಖಲಾಗುತ್ತದೆ.',
    },
    footer: {
      track: 'Razorpay ಟ್ರ್ಯಾಕ್ 01 (AI ಬೆಳವಣಿಗೆ & ಏಜೆಂಟಿಕ್ ವಾಣಿಜ್ಯ)',
      bounded: 'ನಿರ್ಬಂಧಿತ & ಖಚಿತ',
      testMode: 'Razorpay ಟೆಸ್ಟ್ ಮೋಡ್',
      copyright: '© {year} SellPilot AI. Manrope ಟೈಪೋಗ್ರಫಿ & ನಿರ್ಬಂಧಿತ ಏಜೆಂಟಿಕ್ ವಾಣಿಜ್ಯ.',
    },
  },

  // ========================== HINDI (हिन्दी) ==========================
  hi: {
    common: {
      loading: 'लोड हो रहा है...',
      offline: 'ऑफ़लाइन',
      healthy: 'ऑनलाइन',
      connecting: 'कनेक्ट हो रहा है...',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      close: 'बंद करें',
      back: 'वापस',
      retry: 'पुनः प्रयास करें',
      status: 'स्थिति',
      action: 'कार्रवाई',
      success: 'सफलता',
      error: 'त्रुटि',
      warning: 'चेतावनी',
      viewAll: 'सभी देखें',
    },
    nav: {
      buyerDiscovery: 'ग्राहक खोज',
      merchantHub: 'मर्चेंट हब',
      myOrders: 'मेरे ऑर्डर्स',
      askAI: 'SellPilot AI से पूछें',
      login: 'लॉग इन',
      logout: 'लॉग आउट',
      cart: 'कार्ट',
      trackBadge: 'ट्रैक 01',
      customerRole: 'ग्राहक',
      merchantRole: 'व्यापारी',
      adminRole: 'व्यवस्थापक',
    },
    hero: {
      badge: 'SellPilot AI 2.0 • बाउंडेड एजेंटिक कॉमर्स और Razorpay टेस्ट मोड',
      titleLine1: 'संवादात्मक कॉमर्स,',
      titleLine2: 'सटीक और सुरक्षित नियमों द्वारा संरक्षित।',
      subtitle:
        'SellPilot AI खरीदारों को अंग्रेजी या रोमीकृत भारतीय भाषाओं (हिंदी, कन्नड़, तमिल, तेलुगु) में स्वाभाविक रूप से खोजने में सक्षम बनाता है, जबकि व्यापारियों को सुरक्षित सीमाओं के साथ AI विकास के अवसर प्रदान करता है।',
      launchAssistant: 'AI सहायक शुरू करें',
      exploreCatalog: 'कैटलॉग देखें',
      searchPlaceholder: 'खोजें या पूछें: जैसे {sample}',
      askAIBtn: 'AI से पूछें',
      tryRomanized: 'रोमीकृत आज़माएं:',
      gatewayTitle: 'SellPilot AI — स्वायत्त गार्डरेल गेटवे',
      testModeBadge: 'Razorpay टेस्ट मोड',
      hmacBadge: 'HMAC-SHA256 सत्यापित',
      multilingualStream: 'बहुभाषी स्ट्रीम',
      responseSpeed: 'प्रतिक्रिया < 180ms',
      buyerSampleBadge: 'खरीदार (रोमीकृत हिंदी)',
      buyerSampleText: '“Mujhe marathon ke liye badhiya running shoes dikhao ₹3000 ke andar”',
      copilotBadge: 'SELLPILOT कोपायलट',
      copilotSampleText:
        'मिल गया! Pro Carbon Running Shoes मैराथन दौड़ के लिए सबसे अच्छे हैं, जिनमें कार्बन-प्लेट कुशनिंग और हाई एनर्जी रिटर्न है।',
      verifiedStock: 'स्टॉक सत्यापित है',
      stockCount: '12 यूनिट',
      guardrailPipeline: 'गार्डरेल पाइपलाइन',
      maxDiscountLabel: 'अधिकतम छूट सीमा',
      maxDiscountValue: '25% अधिकतम',
      stockDecrementLabel: 'स्टॉक कटौती',
      stockDecrementValue: 'हस्ताक्षर के बाद',
      auditTrailLabel: 'ऑडिट ट्रेल',
      auditTrailValue: 'अपरिवर्तनीय',
      openMerchantHub: 'मर्चेंट हब खोलें',
      merchantOnlyHub: 'मर्चेंट हब (केवल व्यापारियों के लिए)',
    },
    trust: {
      metric1Value: '< 200ms',
      metric1Label: 'सटीक क्वेरी रूटिंग',
      metric2Value: '100%',
      metric2Label: 'ऑडिट ट्रेल कवरेज',
      metric3Value: '25%',
      metric3Label: 'व्यापारी छूट की अधिकतम सीमा',
      metric4Value: '0',
      metric4Label: 'इन्वेंट्री की कोई दोहरी कटौती नहीं',
      whyTitle: 'उच्च-विश्वास एजेंटिक कॉमर्स के लिए निर्मित',
      whySubtitle:
        'पारंपरिक जेनेरेटिव AI गलत कीमतें और नकली कूपन बनाता है। SellPilot AI सख्त सीमाओं को लागू करता है।',
      card1Title: 'सटीक सत्यापन',
      card1Desc:
        'कीमतें, प्रोमो कोड और स्टॉक कभी भी LLM द्वारा उत्पन्न नहीं होते हैं। सब कुछ सर्वर साइड पर सत्यापित होता है।',
      card2Title: 'आइडमपोटेंट स्टॉक लॉक',
      card2Desc:
        'Razorpay HMAC-SHA256 हस्ताक्षर सत्यापन सफल होने के बाद ही इन्वेंट्री घटाई जाती है।',
      card3Title: 'बहुभाषी तर्क',
      card3Desc:
        'कन्नड़, हिंदी, तमिल और तेलुगु जैसी रोमीकृत भारतीय भाषाओं की स्वाभाविक समझ को कैटलॉग में मैप किया जाता है।',
      card4Title: 'अपरिवर्तनीय ऑडिट ट्रेल',
      card4Desc:
        'प्रत्येक AI बातचीत, मूल्य सिफारिश, छूट सत्यापन और भुगतान घटना स्थायी रूप से दर्ज होती है।',
    },
    catalog: {
      title: 'लाइव सत्यापित कैटलॉग',
      subtitle: 'सभी आइटम सर्वर स्टॉक के साथ वास्तविक समय में समन्वयित हैं और सटीक मूल्य निर्धारण द्वारा संरक्षित हैं।',
      searchPlaceholder: 'नाम या सुविधाओं से उत्पाद खोजें...',
      categoryAll: 'सभी',
      maxPriceLabel: 'अधिकतम मूल्य:',
      inStock: 'स्टॉक में उपलब्ध',
      outOfStock: 'स्टॉक समाप्त',
      unitsStock: '{count} स्टॉक में',
      addToCart: 'कार्ट में जोड़ें',
      inCart: 'कार्ट में है',
      askCopilot: 'कोपायलट से पूछें',
      noProducts: 'कोई उत्पाद आपके फ़िल्टर से मेल नहीं खाता।',
      resetFilters: 'फ़िल्टर रीसेट करें',
      categories: {
        shoes: 'जूते',
        laptops: 'लैपटॉप',
        phones: 'फोन',
        cameras: 'कैमरे',
        accessories: 'सामान',
        electronics: 'इलेक्ट्रॉनिक्स',
        clothing: 'कपड़े',
      },
    },
    productModal: {
      keyFeatures: 'मुख्य विशेषताएं और विवरण',
      guaranteedAuthentic: 'प्रामाणिक उत्पाद की गारंटी',
      guaranteedDesc: 'सत्यापित स्टोर इन्वेंट्री और परमाणु ऑर्डर लॉक द्वारा समर्थित।',
      razorpayTestReady: 'Razorpay टेस्ट भुगतान तैयार',
      razorpayTestDesc: 'सैंडबॉक्स मोड में त्वरित HMAC-SHA256 हस्ताक्षर सत्यापन।',
      askAboutProduct: 'इस उत्पाद के बारे में AI से पूछें',
      close: 'बंद करें',
    },
    cart: {
      title: 'आपकी कार्ट',
      itemsCount: '{count} आइटम चुने गए',
      emptyTitle: 'आपकी कार्ट खाली है',
      emptySubtitle: 'उत्पादों का अन्वेषण करें या स्मार्ट सिफारिशों के लिए SellPilot AI से पूछें।',
      subtotal: 'उप-योग',
      shipping: 'शिपिंग',
      shippingFree: 'मुफ़्त',
      discount: 'छूट',
      total: 'कुल राशि',
      checkoutBtn: 'चेकआउट के लिए आगे बढ़ें',
      clearCart: 'कार्ट खाली करें',
      remove: 'हटाएं',
      outOfStock: 'स्टॉक में नहीं',
      verifiedCheckout: 'सटीक मूल्य सत्यापन सक्षम है',
    },
    checkout: {
      title: 'सुरक्षित चेकआउट',
      shippingAddress: 'शिपिंग का पता',
      fullName: 'पूरा नाम',
      email: 'ईमेल पता',
      street: 'सड़क का पता',
      city: 'शहर',
      state: 'राज्य',
      postalCode: 'पिन कोड',
      phone: 'फ़ोन नंबर',
      orderSummary: 'ऑर्डर सारांश',
      paymentMethod: 'भुगतान का तरीका',
      razorpayOption: 'Razorpay टेस्ट मोड (Cards, UPI, NetBanking)',
      razorpayDesc: 'कोई वास्तविक पैसा नहीं काटा जाता। स्वचालित हस्ताक्षर सत्यापन के साथ टेस्ट मोड का उपयोग होता है।',
      payBtn: 'Razorpay से भुगतान करें',
      processing: 'सत्यापित और Razorpay तैयार किया जा रहा है...',
      successTitle: 'ऑर्डर सफलतापूर्वक दिया गया!',
      successDesc: 'Razorpay HMAC हस्ताक्षर द्वारा भुगतान सत्यापित और स्टॉक सुरक्षित कर लिया गया है।',
      failureTitle: 'भुगतान सत्यापन विफल रहा',
      failureDesc: 'भुगतान सत्यापित नहीं किया जा सका या रद्द कर दिया गया। आपकी कार्ट सुरक्षित है।',
      viewOrdersBtn: 'मेरे ऑर्डर्स देखें',
      tryAgainBtn: 'पुनः प्रयास करें',
      closeBtn: 'बंद करें',
    },
    orders: {
      title: 'मेरे ऑर्डर्स',
      subtitle: 'अपने ऑर्डर इतिहास, सत्यापित भुगतान और लाइव स्थिति को ट्रैक करें।',
      noOrdersTitle: 'कोई ऑर्डर नहीं मिला',
      noOrdersSubtitle: 'आपने अभी तक कोई ऑर्डर नहीं दिया है। हमारे कैटलॉग का अन्वेषण करें।',
      orderNumber: 'ऑर्डर #',
      orderDate: 'तारीख',
      orderStatus: 'स्थिति',
      orderTotal: 'कुल',
      orderItems: 'आइटम',
      cancelOrder: 'ऑर्डर रद्द करें',
      cancelConfirm: 'क्या आप वाकई इस ऑर्डर को रद्द करना चाहते हैं? सभी आइटम वापस स्टॉक में जुड़ जाएंगे।',
      cancellationSuccess: 'ऑर्डर सफलतापूर्वक रद्द कर दिया गया और स्टॉक बहाल हो गया।',
      cancellationFailed: 'ऑर्डर रद्द करने में विफल।',
      viewDetails: 'विवरण देखें',
      statusPending: 'लंबित',
      statusPaid: 'भुगतान किया गया',
      statusProcessing: 'प्रक्रिया जारी है',
      statusCompleted: 'पूर्ण',
      statusCancelled: 'रद्द',
      statusFailed: 'विफल',
      statusHistory: 'स्थिति समयरेखा',
      shippingTo: 'शिपिंग पता',
      paymentId: 'भुगतान ID',
      restockedNote: 'सभी खरीदे गए आइटम परमाणु रूप से मर्चेंट कैटलॉग में वापस जोड़ दिए गए हैं।',
      orderSummary: 'ऑर्डर का विवरण',
    },
    auth: {
      welcomeBack: 'वापसी पर स्वागत है',
      createAccount: 'खाता बनाएं',
      loginSubtitle: 'अपने वाणिज्य खाते में प्रवेश करें',
      registerSubtitle: 'SellPilot AI प्लेटफॉर्म से जुड़ें',
      nameLabel: 'पूरा नाम',
      emailLabel: 'ईमेल पता',
      passwordLabel: 'पासवर्ड',
      roleLabel: 'खाता भूमिका',
      customerRole: 'ग्राहक (खरीदार)',
      merchantRole: 'व्यापारी (विक्रेता)',
      businessNameLabel: 'व्यवसाय / स्टोर का नाम',
      signInBtn: 'साइन इन करें',
      signUpBtn: 'खाता बनाएं',
      noAccountPrompt: 'खाता नहीं है?',
      haveAccountPrompt: 'पहले से ही एक खाता है?',
      demoCustomerBtn: 'डेमो ग्राहक भरें',
      demoMerchantBtn: 'डेमो मर्चेंट भरें',
      demoHeading: 'या पहले से भरे गए डेमो क्रेडेंशियल्स के साथ परीक्षण करें:',
    },
    merchant: {
      title: 'मर्चेंट ग्रोथ हब',
      subtitle: 'डेटा-संचालित राजस्व वृद्धि, स्वायत्त अवसर खोज और छूट सीमा गार्डरेल।',
      gatedBadge: 'संरक्षित और बाउंडेड',
      tabInsights: 'AI विकास अंतर्दृष्टि',
      tabProducts: 'कैटलॉग प्रबंधन',
      tabCampaigns: 'अभियान और छूट',
      tabAudit: 'अपरिवर्तनीय ऑडिट ट्रेल',
      accessRestrictedTitle: 'पहुंच प्रतिबंधित है',
      accessRestrictedDesc:
        'मर्चेंट हब केवल पंजीकृत विक्रेताओं और व्यवस्थापकों के लिए है। आप वर्तमान में एक ग्राहक खाते ({email}) से लॉग इन हैं।',
      returnToDiscoveryBtn: 'ग्राहक खोज पर वापस जाएं',
      bestOpportunityTitle: 'सर्वश्रेष्ठ अवसर उत्पाद',
      bestOpportunityBadge: 'उच्च लाभ',
      topPromotionTitle: 'शीर्ष प्रचार उम्मीदवार',
      topPromotionBadge: 'इन्वेंट्री गहराई',
      categoryMomentumTitle: 'श्रेणी गति',
      categoryMomentumBadge: 'सक्रिय फोकस',
      revenueVelocityTitle: 'राजस्व गति',
      revenueVelocityBadge: 'सुरक्षित मार्जिन',
      addProductBtn: 'उत्पाद जोड़ें',
      createCampaignBtn: 'अभियान बनाएं',
      discountValidationTitle: 'गार्डरेल छूट चेकर',
      testDiscountPlaceholder: 'छूट % दर्ज करें (उदा. 15)',
      validateDiscountBtn: 'गार्डरेल जांचें',
      discountAllowed: 'सुरक्षित सीमा में है (<= 25%)',
      discountRejected: 'अस्वीकृत: 25% गार्डरेल सीमा से अधिक है',
      productTableColName: 'उत्पाद का नाम',
      productTableColCategory: 'श्रेणी',
      productTableColPrice: 'कीमत',
      productTableColStock: 'स्टॉक',
      productTableColStatus: 'स्थिति',
      productTableColActions: 'कार्रवाई',
      activeStatus: 'सक्रिय',
      inactiveStatus: 'निष्क्रिय',
      noProductsMerchant: 'आपके कैटलॉग में अभी कोई उत्पाद नहीं है। अपना पहला आइटम जोड़ें।',
      campaignTableColName: 'अभियान का नाम',
      campaignTableColDiscount: 'छूट %',
      campaignTableColStatus: 'स्थिति',
      campaignTableColActions: 'कार्रवाई',
      approveCampaign: 'मंजूरी दें',
      activateCampaign: 'सक्रिय करें',
      noCampaigns: 'अभी तक कोई अभियान नहीं बनाया गया है।',
      auditLogTitle: 'ऑडिट ट्रेल घटनाएं',
      auditLogColEvent: 'घटना कार्रवाई',
      auditLogColActor: 'कर्ता',
      auditLogColStatus: 'स्थिति',
      auditLogColTimestamp: 'समय',
      noAuditLogs: 'अभी तक कोई ऑडिट लॉग दर्ज नहीं हुआ है।',
      refreshData: 'रिफ्रेश करें',
    },
    chat: {
      assistantTitle: 'SellPilot AI सहायक',
      agenticCommerce: 'एजेंटिक कॉमर्स',
      languageLabel: 'भाषा:',
      buyerTab: 'खरीदार',
      merchantTab: 'व्यापारी',
      inputPlaceholder: 'हिंदी, अंग्रेजी, कन्नड़, तमिल, तेलुगु में स्वाभाविक रूप से पूछें या खोजें...',
      sendBtn: 'भेजें',
      initialGreetingBuyer:
        'नमस्ते! मैं SellPilot AI हूँ। मुझे बताएं कि आप क्या उत्पाद खोज रहे हैं, आपका बजट क्या है या क्या विशेषताएं चाहिए, और मैं कैटलॉग से सही उत्पाद खोजूँगा।',
      initialGreetingMerchant:
        'SellPilot मर्चेंट हब में आपका स्वागत है। उत्पाद प्रदर्शन, प्रचार के अवसरों, अपसेल या छूट संबंधी विचारों के बारे में मुझसे पूछें।',
      chip1Buyer: 'mujhe running shoes chahiye under 2500',
      chip2Buyer: 'सबसे सस्ता कौन सा है?',
      chip3Buyer: 'laptop under 50k with 16gb ram',
      chip4Buyer: 'इसे कार्ट में जोड़ें',
      chip5Buyer: 'इसे अभी खरीदें',
      chip6Buyer: 'मेरी कार्ट दिखाएं',
      chip1Merchant: 'मुझे क्या प्रचारित करना चाहिए?',
      chip2Merchant: 'किस उत्पाद में सबसे अच्छा अवसर है?',
      chip3Merchant: 'क्रॉस-सेल में क्या देना चाहिए?',
      chip4Merchant: 'अपसेल का सुझाव दें',
      chip5Merchant: 'क्या 15% छूट सुरक्षित है?',
      chip6Merchant: 'क्या मैं 30% छूट दे सकता हूँ?',
      addToCartBtn: 'कार्ट में जोड़ें',
      proceedCheckoutBtn: 'चेकआउट के लिए आगे बढ़ें',
      orderTotalReady: 'आपका कुल योग तैयार है। चेकआउट जारी रखने के लिए नीचे क्लिक करें।',
    },
    recommendations: {
      upsellTitle: 'अनुशंसित अपग्रेड (अपसेल)',
      crossSellTitle: 'अक्सर साथ में खरीदा जाने वाला (क्रॉस-सेल)',
      approveAndAdd: 'स्वीकार करें और जोड़ें',
      dismiss: 'खारिज करें',
      moreDiff: '+₹{diff} अधिक',
      upsellSuccess: 'अपग्रेड आपकी कार्ट में जोड़ दिया गया!',
      crossSellSuccess: 'संबंधित आइटम कार्ट में जोड़ दिया गया!',
    },
    testimonials: {
      tag: 'उत्पादन परीक्षण किया गया',
      title: 'भारत-स्तरीय संवादात्मक कॉमर्स के लिए निर्मित',
      quote1:
        '“रोमीकृत बहुभाषी तर्क वास्तव में गेम-चेंजर है। हमारे हिंदी और कन्नड़ ग्राहक रोमन लिपि में खोजते हैं और बिना किसी गलत मूल्य निर्धारण के सटीक उत्पाद पाते हैं।”',
      author1Name: 'प्रवीण गौड़ा',
      author1Role: 'संस्थापक, दक्षिण रिटेल',
      quote2:
        '“Razorpay भुगतान सत्यापन और शून्य दोहरी-कटौती इन्वेंट्री लॉक इसे उत्पादन के लिए पूरी तरह से मजबूत बनाते हैं।”',
      author2Name: 'अनन्या शर्मा',
      author2Role: 'प्रोडक्ट हेड, एपेक्स रिटेल',
      quote3:
        '“मर्चेंट ग्रोथ अंतर्दृष्टि ने स्वचालित रूप से अतिरिक्त स्टॉक को चिह्नित किया और सुरक्षित छूट का सुझाव दिया जिससे हमारा रूपांतरण 34% बढ़ गया।”',
      author3Name: 'कार्तिक आर.',
      author3Role: 'ई-कॉमर्स निदेशक, अर्बनस्टाइल',
    },
    faqs: {
      tag: 'कोई सवाल है?',
      title: 'अक्सर पूछे जाने वाले प्रश्न',
      q1: 'रोमीकृत बहुभाषी AI खरीदारी कैसे काम करती है?',
      a1: 'SellPilot AI रोमीकृत भारतीय लिपियों ("mujhe running shoes chahiye under 2500") को समझता है। यह इरादे का विश्लेषण करता है और कैटलॉग से सटीक मिलान करता है।',
      q2: 'मूल्यों और छूटों पर AI की गलतियों को क्या रोकता है?',
      a2: 'LLM कभी भी अंतिम कीमतों या छूटों की गणना नहीं करता है। सभी मूल्य निर्धारण और छूट (अधिकतम 25%) सर्वर सत्यापन द्वारा ही तय होते हैं।',
      q3: 'इन्वेंट्री की दोहरी कटौती को कैसे रोका जाता है?',
      a3: 'सर्वर पर Razorpay HMAC-SHA256 हस्ताक्षर सत्यापन सफल होने के बाद ही परमाणु लॉक्स के साथ स्टॉक काटा जाता है।',
      q4: 'जब कोई ग्राहक ऑर्डर रद्द करता है तो क्या होता है?',
      a4: 'जब कोई ऑर्डर रद्द किया जाता है, तो खरीदे गए सभी उत्पाद स्वचालित रूप से सक्रिय कैटलॉग में वापस जुड़ जाते हैं और ऑडिट लॉग बनता है।',
    },
    footer: {
      track: 'Razorpay ट्रैक 01 (AI ग्रोथ और एजेंटिक कॉमर्स)',
      bounded: 'बाउंडेड और सटीक',
      testMode: 'Razorpay टेस्ट मोड',
      copyright: '© {year} SellPilot AI. Manrope टाइपोग्राफी और बाउंडेड एजेंटिक कॉमर्स।',
    },
  },

  // ========================== TAMIL (தமிழ்) ==========================
  ta: {
    common: {
      loading: 'ஏற்றுகிறது...',
      offline: 'ஆஃப்லைன்',
      healthy: 'ஆன்லைன்',
      connecting: 'இணைக்கிறது...',
      save: 'சேமி',
      cancel: 'ரத்துசெய்',
      confirm: 'உறுதிசெய்',
      delete: 'நீக்கு',
      edit: 'திருத்து',
      close: 'மூடு',
      back: 'பின்செல்',
      retry: 'மீண்டும் முயற்சி செய்',
      status: 'நிலை',
      action: 'செயல்',
      success: 'வெற்றி',
      error: 'பிழை',
      warning: 'எச்சரிக்கை',
      viewAll: 'அனைத்தையும் காண்க',
    },
    nav: {
      buyerDiscovery: 'வாங்குபவர் தேடல்',
      merchantHub: 'வணிகர் மையம்',
      myOrders: 'எனது ஆர்டர்கள்',
      askAI: 'SellPilot AI-யிடம் கேட்கவும்',
      login: 'உள்நுழை',
      logout: 'வெளியேறு',
      cart: 'கார்ட்',
      trackBadge: 'ட்ராக் 01',
      customerRole: 'வாடிக்கையாளர்',
      merchantRole: 'வணிகர்',
      adminRole: 'நிர்வாகி',
    },
    hero: {
      badge: 'SellPilot AI 2.0 • வரம்பிற்குட்பட்ட ஏஜென்டிக் வர்த்தகம் & Razorpay டெஸ்ட் பயன்முறை',
      titleLine1: 'உரையாடல் வர்த்தகம்,',
      titleLine2: 'துல்லியமான விதிகளால் பாதுகாக்கப்பட்டது.',
      subtitle:
        'SellPilot AI வாங்குபவர்களுக்கு ஆங்கிலம் அல்லது ரோமானிய இந்திய மொழிகளில் (தமிழ், கன்னடம், இந்தி, தெலுங்கு) இயல்பாகத் தேட உதவுகிறது, அதே நேரத்தில் வணிகர்களுக்குக் கடுமையான வழிகாட்டுதல்களுடன் AI வளர்ச்சி வாய்ப்புகளை வழங்குகிறது.',
      launchAssistant: 'AI உதவியாளரைத் தொடங்கவும்',
      exploreCatalog: 'பொருட்களைப் பார்க்கவும்',
      searchPlaceholder: 'தேடவும் அல்லது கேட்கவும்: எ.கா. {sample}',
      askAIBtn: 'AI-யிடம் கேட்கவும்',
      tryRomanized: 'ரோமானிய முறையில் முயற்சிக்கவும்:',
      gatewayTitle: 'SellPilot AI — தன்னாட்சி கார்ட்ரெயில் நுழைவாயில்',
      testModeBadge: 'Razorpay டெஸ்ட் பயன்முறை',
      hmacBadge: 'HMAC-SHA256 சரிபார்க்கப்பட்டது',
      multilingualStream: 'பன்மொழி ஸ்ட்ரீம்',
      responseSpeed: 'பதில் < 180ms',
      buyerSampleBadge: 'வாங்குபவர் (ரோமானிய தமிழ்)',
      buyerSampleText: '“enakku running shoe venum under 3000”',
      copilotBadge: 'SELLPILOT கோபைலட்',
      copilotSampleText:
        'கண்டுபிடிக்கப்பட்டது! Pro Carbon Running Shoes மாரத்தான் ஓட்டத்திற்குச் சிறந்தது, கார்பன்-பிளேட் குஷனிங் கொண்டது.',
      verifiedStock: 'இருப்பு சரிபார்க்கப்பட்டது',
      stockCount: '12 அலகுகள்',
      guardrailPipeline: 'கார்ட்ரெயில் பைப்லைன்',
      maxDiscountLabel: 'அதிகபட்ச தள்ளுபடி வரம்பு',
      maxDiscountValue: '25% அதிகபட்சம்',
      stockDecrementLabel: 'இருப்பு குறைப்பு',
      stockDecrementValue: 'கையொப்பத்திற்குப் பின்',
      auditTrailLabel: 'தணிக்கை பதிவு',
      auditTrailValue: 'மாற்ற முடியாதது',
      openMerchantHub: 'வணிகர் மையத்தைத் திறக்கவும்',
      merchantOnlyHub: 'வணிகர் மையம் (வணிகர்களுக்கு மட்டும்)',
    },
    trust: {
      metric1Value: '< 200ms',
      metric1Label: 'துல்லியமான வினவல் ரூட்டிங்',
      metric2Value: '100%',
      metric2Label: 'தணிக்கை பதிவு கவரேஜ்',
      metric3Value: '25%',
      metric3Label: 'வணிகர் தள்ளுபடி அதிகபட்ச உச்சவரம்பு',
      metric4Value: '0',
      metric4Label: 'இருப்பு இரட்டிப்பு பிடித்தம் இல்லை',
      whyTitle: 'உயர்-நம்பகத்தன்மை வாய்ந்த வர்த்தகத்திற்காக வடிவமைக்கப்பட்டது',
      whySubtitle:
        'வழக்கமான AI தவறான விலைகளையும் போலி கூப்பன்களையும் உருவாக்குகிறது. SellPilot AI கடுமையான வரம்புகளை அமல்படுத்துகிறது.',
      card1Title: 'துல்லியமான சரிபார்ப்பு',
      card1Desc:
        'விலைகள் மற்றும் இருப்பு எண்ணிக்கைகள் LLM-களால் உருவாக்கப்படுவதில்லை. அனைத்தும் சர்வர் பக்கத்தில் சரிபார்க்கப்படுகின்றன.',
      card2Title: 'பாதுகாப்பான இருப்பு பூட்டுகள்',
      card2Desc:
        'Razorpay HMAC-SHA256 கையொப்ப சரிபார்ப்பு வெற்றிகரமாக முடிந்த பின்னரே இருப்பு குறைக்கப்படுகிறது.',
      card3Title: 'பன்மொழி பகுத்தறிவு',
      card3Desc:
        'தமிழ், கன்னடம், இந்தி மற்றும் தெலுங்கு ரோமானிய மொழிகளை இயல்பாகப் புரிந்து கொண்டு பட்டியலில் தேடுகிறது.',
      card4Title: 'மாற்ற முடியாத தணிக்கை',
      card4Desc:
        'ஒவ்வொரு AI உரையாடலும், விலை பரிந்துரையும், தள்ளுபடி சரிபார்ப்பும் நிரந்தரமாகப் பதிவு செய்யப்படுகிறது.',
    },
    catalog: {
      title: 'நேரலை சரிபார்க்கப்பட்ட பட்டியல்',
      subtitle: 'அனைத்து பொருட்களும் சர்வர் இருப்புடன் நிகழ்நேரத்தில் ஒத்திசைக்கப்பட்டு துல்லியமான விலையால் பாதுகாக்கப்படுகின்றன.',
      searchPlaceholder: 'பெயர் அல்லது அம்சங்கள் மூலம் தேடவும்...',
      categoryAll: 'அனைத்தும்',
      maxPriceLabel: 'அதிகபட்ச விலை:',
      inStock: 'இருப்பில் உள்ளது',
      outOfStock: 'இருப்பில் இல்லை',
      unitsStock: '{count} இருப்பில் உள்ளது',
      addToCart: 'கார்ட்டில் சேர்க்கவும்',
      inCart: 'கார்ட்டில் உள்ளது',
      askCopilot: 'கோபைலட்டிடம் கேட்கவும்',
      noProducts: 'பொருத்தமான பொருட்கள் எதுவும் இல்லை.',
      resetFilters: 'வடிகட்டிகளை மீட்டமைக்கவும்',
      categories: {
        shoes: 'காலணிகள்',
        laptops: 'லேப்டாப்கள்',
        phones: 'ஃபோன்கள்',
        cameras: 'கேமராக்கள்',
        accessories: 'துணைப்பொருட்கள்',
        electronics: 'எலக்ட்ரானிக்ஸ்',
        clothing: 'ஆடைகள்',
      },
    },
    productModal: {
      keyFeatures: 'முக்கிய அம்சங்கள் மற்றும் விவரங்கள்',
      guaranteedAuthentic: 'உண்மையான பொருள் உத்தரவாதம்',
      guaranteedDesc: 'சரிபார்க்கப்பட்ட கடை இருப்பு மற்றும் ஆர்டர் பூட்டுகளால் பாதுகாக்கப்பட்டது.',
      razorpayTestReady: 'Razorpay டெஸ்ட் கட்டணம் தயார்',
      razorpayTestDesc: 'சாண்ட்பாக்ஸ் பயன்முறையில் உடனடி HMAC-SHA256 கையொப்ப சரிபார்ப்பு.',
      askAboutProduct: 'இந்த தயாரிப்பைப் பற்றி AI-யிடம் கேட்கவும்',
      close: 'மூடு',
    },
    cart: {
      title: 'உங்கள் கார்ட்',
      itemsCount: '{count} பொருட்கள் தேர்ந்தெடுக்கப்பட்டன',
      emptyTitle: 'உங்கள் கார்ட் காலியாக உள்ளது',
      emptySubtitle: 'பொருட்களைப் பார்க்கவும் அல்லது சிறந்த பரிந்துரைகளுக்கு SellPilot AI-யிடம் கேட்கவும்.',
      subtotal: 'கூட்டுத்தொகை',
      shipping: 'டெலிவரி',
      shippingFree: 'இலவசம்',
      discount: 'தள்ளுபடி',
      total: 'மொத்த தொகை',
      checkoutBtn: 'செக்அவுட்டிற்குச் செல்லவும்',
      clearCart: 'கார்ட்டை அழிக்கவும்',
      remove: 'நீக்கு',
      outOfStock: 'இருப்பு இல்லை',
      verifiedCheckout: 'துல்லியமான விலை சரிபார்ப்பு செயல்படுத்தப்பட்டது',
    },
    checkout: {
      title: 'பாதுகாப்பான செக்அவுட்',
      shippingAddress: 'டெலிவரி முகவரி',
      fullName: 'முழு பெயர்',
      email: 'மின்னஞ்சல் முகவரி',
      street: 'தெரு முகவரி',
      city: 'நகரம்',
      state: 'மாநிலம்',
      postalCode: 'அஞ்சல் குறியீடு',
      phone: 'தொலைபேசி எண்',
      orderSummary: 'ஆர்டர் சுருக்கம்',
      paymentMethod: 'பணம் செலுத்தும் முறை',
      razorpayOption: 'Razorpay டெஸ்ட் பயன்முறை (UPI / Cards / NetBanking)',
      razorpayDesc: 'உண்மையான பணம் எதுவும் கழிக்கப்படாது. தானியங்கி கையொப்ப சரிபார்ப்புடன் கூடிய டெஸ்ட் பயன்முறை.',
      payBtn: 'Razorpay மூலம் செலுத்தவும்',
      processing: 'சரிபார்க்கப்பட்டு Razorpay தொடங்கப்படுகிறது...',
      successTitle: 'ஆர்டர் வெற்றிகரமாக வழங்கப்பட்டது!',
      successDesc: 'Razorpay HMAC கையொப்பம் மூலம் கட்டணம் சரிபார்க்கப்பட்டு இருப்பு ஒதுக்கப்பட்டது.',
      failureTitle: 'கட்டண சரிபார்ப்பு தோல்வியடைந்தது',
      failureDesc: 'கட்டணத்தைச் சரிபார்க்க முடியவில்லை அல்லது ரத்து செய்யப்பட்டது. உங்கள் கார்ட் பாதுகாப்பாக உள்ளது.',
      viewOrdersBtn: 'எனது ஆர்டர்களைக் காண்க',
      tryAgainBtn: 'மீண்டும் முயற்சிக்கவும்',
      closeBtn: 'மூடு',
    },
    orders: {
      title: 'எனது ஆர்டர்கள்',
      subtitle: 'உங்கள் ஆர்டர் வரலாறு, சரிபார்க்கப்பட்ட கட்டணங்கள் மற்றும் நிலையை கண்காணிக்கவும்.',
      noOrdersTitle: 'ஆர்டர்கள் எதுவும் கிடைக்கவில்லை',
      noOrdersSubtitle: 'நீங்கள் இன்னும் எந்த ஆர்டரையும் செய்யவில்லை. எங்கள் பட்டியலை ஆராயுங்கள்.',
      orderNumber: 'ஆர்டர் எண்',
      orderDate: 'தேதி',
      orderStatus: 'நிலை',
      orderTotal: 'மொத்தம்',
      orderItems: 'பொருட்கள்',
      cancelOrder: 'ஆர்டரை ரத்துசெய்',
      cancelConfirm: 'இந்த ஆர்டரை நிச்சயமாக ரத்து செய்ய விரும்புகிறீர்களா? அனைத்து பொருட்களும் இருப்புக்குத் திரும்பும்.',
      cancellationSuccess: 'ஆர்டர் ரத்து செய்யப்பட்டு பொருட்கள் மீண்டும் இருப்பில் சேர்க்கப்பட்டன.',
      cancellationFailed: 'ஆர்டரை ரத்து செய்ய முடியவில்லை.',
      viewDetails: 'விவரங்களைக் காண்க',
      statusPending: 'நிலுவையில் உள்ளது',
      statusPaid: 'செலுத்தப்பட்டது',
      statusProcessing: 'செயல்பாட்டில் உள்ளது',
      statusCompleted: 'முடிந்தது',
      statusCancelled: 'ரத்து செய்யப்பட்டது',
      statusFailed: 'தோல்வி',
      statusHistory: 'நிலை காலவரிசை',
      shippingTo: 'டெலிவரி முகவரி',
      paymentId: 'கட்டண ID',
      restockedNote: 'வாங்கப்பட்ட அனைத்து பொருட்களும் வணிகர் பட்டியலில் மீண்டும் சேர்க்கப்பட்டுள்ளன.',
      orderSummary: 'ஆர்டர் விவரங்கள்',
    },
    auth: {
      welcomeBack: 'மீண்டும் வருக',
      createAccount: 'கணக்கை உருவாக்கவும்',
      loginSubtitle: 'உங்கள் வர்த்தகக் கணக்கில் உள்நுழையவும்',
      registerSubtitle: 'SellPilot AI தளத்தில் இணையுங்கள்',
      nameLabel: 'முழு பெயர்',
      emailLabel: 'மின்னஞ்சல் முகவரி',
      passwordLabel: 'கடவுச்சொல்',
      roleLabel: 'கணக்கு வகை',
      customerRole: 'வாடிக்கையாளர் (வாங்குபவர்)',
      merchantRole: 'வணிகர் (விற்பனையாளர்)',
      businessNameLabel: 'வணிகம் / கடையின் பெயர்',
      signInBtn: 'உள்நுழைக',
      signUpBtn: 'கணக்கை உருவாக்கு',
      noAccountPrompt: 'கணக்கு இல்லையா?',
      haveAccountPrompt: 'ஏற்கனவே கணக்கு உள்ளதா?',
      demoCustomerBtn: 'டெமோ வாடிக்கையாளரை நிரப்பவும்',
      demoMerchantBtn: 'டெமோ வணிகரை நிரப்பவும்',
      demoHeading: 'அல்லது மாதிரி கணக்கு மூலம் சோதிக்கவும்:',
    },
    merchant: {
      title: 'வணிகர் வளர்ச்சி மையம்',
      subtitle: 'தரவு அடிப்படையிலான வருவாய் வளர்ச்சி, தானியங்கி வாய்ப்பு கண்டறிதல் மற்றும் தள்ளுபடி வரம்புகள்.',
      gatedBadge: 'பாதுகாக்கப்பட்டது & வரம்பிற்குட்பட்டது',
      tabInsights: 'AI வளர்ச்சி நுண்ணறிவு',
      tabProducts: 'பட்டியல் மேலாண்மை',
      tabCampaigns: 'விளம்பரங்கள் & தள்ளுபடிகள்',
      tabAudit: 'தணிக்கை பதிவு',
      accessRestrictedTitle: 'அணுகல் தடைசெய்யப்பட்டுள்ளது',
      accessRestrictedDesc:
        'வணிகர் மையம் பதிவுசெய்யப்பட்ட விற்பனையாளர்கள் மற்றும் நிர்வாகிகளுக்கு மட்டுமே. நீங்கள் வாடிக்கையாளர் கணக்கில் ({email}) உள்நுழைந்துள்ளீர்கள்.',
      returnToDiscoveryBtn: 'வாங்குபவர் தேடலுக்குத் திரும்பு',
      bestOpportunityTitle: 'சிறந்த வாய்ப்பு தயாரிப்பு',
      bestOpportunityBadge: 'அதிக லாபம்',
      topPromotionTitle: 'முதன்மை விளம்பர தயாரிப்பு',
      topPromotionBadge: 'இருப்பு ஆழம்',
      categoryMomentumTitle: 'பிரிவு வேகம்',
      categoryMomentumBadge: 'செயலில் உள்ள கவனம்',
      revenueVelocityTitle: 'வருவாய் வேகம்',
      revenueVelocityBadge: 'பாதுகாப்பான மார்ஜின்',
      addProductBtn: 'தயாரிப்பைச் சேர்',
      createCampaignBtn: 'விளம்பரம் உருவாக்கு',
      discountValidationTitle: 'தள்ளுபடி சரிபார்ப்பு',
      testDiscountPlaceholder: 'தள்ளுபடி % உள்ளிடவும் (எ.கா. 15)',
      validateDiscountBtn: 'சரிபார்க்கவும்',
      discountAllowed: 'பாதுகாப்பான வரம்பிற்குள் (<= 25%)',
      discountRejected: 'நிராகரிக்கப்பட்டது: 25% வரம்பை விட அதிகம்',
      productTableColName: 'தயாரிப்பு பெயர்',
      productTableColCategory: 'பிரிவு',
      productTableColPrice: 'விலை',
      productTableColStock: 'இருப்பு',
      productTableColStatus: 'நிலை',
      productTableColActions: 'செயல்கள்',
      activeStatus: 'செயலில்',
      inactiveStatus: 'செயலற்றது',
      noProductsMerchant: 'உங்கள் பட்டியலில் இன்னும் பொருட்கள் இல்லை. முதல் பொருளைச் சேர்க்கவும்.',
      campaignTableColName: 'விளம்பர பெயர்',
      campaignTableColDiscount: 'தள்ளுபடி %',
      campaignTableColStatus: 'நிலை',
      campaignTableColActions: 'செயல்கள்',
      approveCampaign: 'ஒப்புதல் அளி',
      activateCampaign: 'செயல்படுத்து',
      noCampaigns: 'இன்னும் எந்த விளம்பரமும் உருவாக்கப்படவில்லை.',
      auditLogTitle: 'தணிக்கை நிகழ்வுகள்',
      auditLogColEvent: 'நிகழ்வு செயல்',
      auditLogColActor: 'செய்தவர்',
      auditLogColStatus: 'நிலை',
      auditLogColTimestamp: 'நேரமுத்திரை',
      noAuditLogs: 'தணிக்கை பதிவுகள் எதுவும் இல்லை.',
      refreshData: 'புதுப்பிக்கவும்',
    },
    chat: {
      assistantTitle: 'SellPilot AI உதவியாளர்',
      agenticCommerce: 'ஏஜென்டிக் வர்த்தகம்',
      languageLabel: 'மொழி:',
      buyerTab: 'வாங்குபவர்',
      merchantTab: 'வணிகர்',
      inputPlaceholder: 'தமிழ், ஆங்கிலம், கன்னடம், இந்தி, தெலுங்கில் இயல்பாகக் கேட்கவும் அல்லது தேடவும்...',
      sendBtn: 'அனுப்பு',
      initialGreetingBuyer:
        'வணக்கம்! நான் SellPilot AI. நீங்கள் என்ன பொருளைத் தேடுகிறீர்கள், உங்கள் பட்ஜெட் என்ன என்பதைத் தெரிவிக்கவும், பட்டியலிலிருந்து சிறந்த பொருட்களைப் பரிந்துரைக்கிறேன்.',
      initialGreetingMerchant:
        'SellPilot வணிகர் மையத்திற்கு நல்வரவு. தயாரிப்பு செயல்திறன், விளம்பர வாய்ப்புகள் அல்லது தள்ளுபடி ஆலோசனைகளைப் பற்றி என்னிடம் கேளுங்கள்.',
      chip1Buyer: 'enakku running shoe venum under 3000',
      chip2Buyer: 'எது மிகவும் மலிவானது?',
      chip3Buyer: 'laptop under 50k with 16gb ram',
      chip4Buyer: 'கார்ட்டில் சேர்க்கவும்',
      chip5Buyer: 'இப்போதே வாங்கவும்',
      chip6Buyer: 'எனது கார்ட்டைக் காட்டு',
      chip1Merchant: 'நான் எதை விளம்பரப்படுத்த வேண்டும்?',
      chip2Merchant: 'எந்தத் தயாரிப்பில் சிறந்த வாய்ப்பு உள்ளது?',
      chip3Merchant: 'கிராஸ்-செல்லுக்கு எதைப் பரிந்துரைக்கலாம்?',
      chip4Merchant: 'அப்செல் ஆலோசனை கொடுங்கள்',
      chip5Merchant: '15% தள்ளுபடி பாதுகாப்பானதா?',
      chip6Merchant: '30% தள்ளுபடி வழங்கலாமா?',
      addToCartBtn: 'கார்ட்டில் சேர்க்கவும்',
      proceedCheckoutBtn: 'செக்அவுட்டிற்குச் செல்லவும்',
      orderTotalReady: 'உங்கள் தொகை தயாராக உள்ளது. தொடர கீழே கிளிக் செய்யவும்.',
    },
    recommendations: {
      upsellTitle: 'பரிந்துரைக்கப்பட்ட மேம்படுத்தல் (அப்செல்)',
      crossSellTitle: 'சேர்த்து வாங்க பரிந்துரைக்கப்படுபவை (கிராஸ்-செல்)',
      approveAndAdd: 'ஒப்புதல் அளித்து சேர்',
      dismiss: 'விலக்கு',
      moreDiff: '+₹{diff} அதிகம்',
      upsellSuccess: 'மேம்படுத்தல் கார்ட்டில் சேர்க்கப்பட்டது!',
      crossSellSuccess: 'துணை தயாரிப்பு கார்ட்டில் சேர்க்கப்பட்டது!',
    },
    testimonials: {
      tag: 'தயாரிப்பில் சோதிக்கப்பட்டது',
      title: 'இந்திய அளவிலான உரையாடல் வர்த்தகத்திற்காக உருவாக்கப்பட்டது',
      quote1:
        '“ரோமானிய பன்மொழி பகுத்தறிவு உண்மையிலேயே சிறப்பானது. எங்கள் தமிழ் மற்றும் கன்னட வாடிக்கையாளர்கள் ஆங்கில எழுத்துக்களில் தேடி துல்லியமான பொருட்களைப் பெறுகிறார்கள்.”',
      author1Name: 'பிரவீன் கவுடா',
      author1Role: 'நிறுவனர், தக்ஷின் ரீடெய்ல்',
      quote2:
        '“Razorpay கட்டண சரிபார்ப்பு மற்றும் இருப்பு குறைப்பு பூட்டுகள் உற்பத்திக்காக இதை மிகவும் நம்பகமானதாக ஆக்குகின்றன.”',
      author2Name: 'அனன்யா சர்மா',
      author2Role: 'தயாரிப்பு தலைவர், அபெக்ஸ் ரீடெய்ல்',
      quote3:
        '“வணிகர் வளர்ச்சி நுண்ணறிவு தானாகவே அதிகப்படியான இருப்பைக் கண்டறிந்து பாதுகாப்பான தள்ளுபடிகளை பரிந்துரைத்து விற்பனையை 34% உயர்த்தியது.”',
      author3Name: 'கார்த்திக் ஆர்.',
      author3Role: 'இ-காமர்ஸ் இயக்குனர், அர்பன்ஸ்டைல்',
    },
    faqs: {
      tag: 'கேள்விகள் உள்ளதா?',
      title: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
      q1: 'ரோமானிய பன்மொழி AI ஷாப்பிங் எவ்வாறு செயல்படுகிறது?',
      a1: 'SellPilot AI ரோமானிய இந்திய எழுத்துக்களை ("enakku running shoe venum under 3000") அடையாளம் கண்டு துல்லியமான தயாரிப்புகளுடன் ஒப்பிடுகிறது.',
      q2: 'விலை மற்றும் தள்ளுபடிகளில் AI பிழைகளைத் தடுப்பது எது?',
      a2: 'LLM விலைகளை சுயமாக நிர்ணயிப்பதில்லை. அனைத்து விலை கணக்கீடுகளும் சர்வர் மூலமாகவே சரிபார்க்கப்படுகின்றன (அதிகபட்சம் 25% தள்ளுபடி).',
      q3: 'இருப்பு இரட்டிப்பு பிடித்தம் எவ்வாறு தடுக்கப்படுகிறது?',
      a3: 'சர்வரில் Razorpay HMAC-SHA256 கையொப்ப சரிபார்ப்பு முடிந்த பின்னரே அணுவியல் முறையில் இருப்பு குறைக்கப்படுகிறது.',
      q4: 'வாடிக்கையாளர் ஆர்டரை ரத்து செய்யும் போது என்ன நடக்கும்?',
      a4: 'ஆர்டர் ரத்து செய்யப்படும் போது, அனைத்து பொருட்களும் தானாகவே கடை இருப்புக்குத் திரும்ப சேர்க்கப்பட்டு தணிக்கை பதிவு செய்யப்படுகிறது.',
    },
    footer: {
      track: 'Razorpay ட்ராக் 01 (AI வளர்ச்சி & வர்த்தகம்)',
      bounded: 'வரம்பிற்குட்பட்டது & துல்லியமானது',
      testMode: 'Razorpay டெஸ்ட் பயன்முறை',
      copyright: '© {year} SellPilot AI. Manrope எழுத்துரு & பாதுகாப்பான வர்த்தகம்.',
    },
  },

  // ========================== TELUGU (తెలుగు) ==========================
  te: {
    common: {
      loading: 'లోడ్ అవుతోంది...',
      offline: 'ఆఫ్‌లైన్',
      healthy: 'ఆన్‌లైన్',
      connecting: 'కనెక్ట్ అవుతోంది...',
      save: 'సేవ్ చేయి',
      cancel: 'రద్దు చేయి',
      confirm: 'ధృవీకరించు',
      delete: 'తొలగించు',
      edit: 'సవరించు',
      close: 'మూసివేయి',
      back: 'వెనుకకు',
      retry: 'మళ్లీ ప్రయత్నించండి',
      status: 'స్థితి',
      action: 'చర్య',
      success: 'విజయం',
      error: 'లోపం',
      warning: 'హెచ్చరిక',
      viewAll: 'అన్నీ చూడండి',
    },
    nav: {
      buyerDiscovery: 'కొనుగోలుదారుల అన్వేషణ',
      merchantHub: 'వ్యాపారి కేంద్రం',
      myOrders: 'నా ఆర్డర్లు',
      askAI: 'SellPilot AIని అడగండి',
      login: 'లాగిన్',
      logout: 'లాగౌట్',
      cart: 'కార్ట్',
      trackBadge: 'ట్రాక్ 01',
      customerRole: 'కస్టమర్',
      merchantRole: 'వ్యాపారి',
      adminRole: 'అడ్మిన్',
    },
    hero: {
      badge: 'SellPilot AI 2.0 • బౌండెడ్ ఏజెంటిక్ కామర్స్ & Razorpay టెస్ట్ మోడ్',
      titleLine1: 'సంభాషణాత్మక వాణిజ్యం,',
      titleLine2: 'ఖచ్చితమైన నియమాలతో రక్షితం.',
      subtitle:
        'SellPilot AI కొనుగోలుదారులకు ఇంగ్లీష్ లేదా రోమనైజ్డ్ భారతీయ భాషలలో (తెలుగు, కన్నడ, హిందీ, తమిళం) సహజంగా శోధించడానికి అధికారం ఇస్తుంది, మరియు వ్యాపారులకు కఠినమైన నిబంధనలతో AI వృద్ధి అవకాశాలను అందిస్తుంది.',
      launchAssistant: 'AI సహాయకుడిని ప్రారంభించండి',
      exploreCatalog: 'కేటలాగ్ చూడండి',
      searchPlaceholder: 'శోధించండి లేదా అడగండి: ఉదా. {sample}',
      askAIBtn: 'AIని అడగండి',
      tryRomanized: 'రోమనైజ్డ్ ప్రయత్నించండి:',
      gatewayTitle: 'SellPilot AI — అటానమస్ గార్డ్‌రైల్ గేట్‌వే',
      testModeBadge: 'Razorpay టెస్ట్ మోడ్',
      hmacBadge: 'HMAC-SHA256 ధృవీకరించబడింది',
      multilingualStream: 'బహుభాషా స్ట్రీమ్',
      responseSpeed: 'ప్రతిస్పందన < 180ms',
      buyerSampleBadge: 'కొనుగోలుదారు (రోమనైజ్డ్ తెలుగు)',
      buyerSampleText: '“naaku running shoes kavali under 3000”',
      copilotBadge: 'SELLPILOT కోపైలట్',
      copilotSampleText:
        'దొరికింది! Pro Carbon Running Shoes మారథాన్ పరుగుకు అత్యుత్తమమైనవి, కార్బన్-ప్లేట్ కుషనింగ్ మరియు అధిక ఎనర్జీ రిటర్న్ కలిగి ఉన్నాయి.',
      verifiedStock: 'స్టాక్ ధృవీకరించబడింది',
      stockCount: '12 యూనిట్లు',
      guardrailPipeline: 'గార్డ్‌రైల్ పైప్‌లైన్',
      maxDiscountLabel: 'గరిష్ట తగ్గింపు పరిమితి',
      maxDiscountValue: '25% గరిష్టం',
      stockDecrementLabel: 'స్టాక్ తగ్గింపు',
      stockDecrementValue: 'సంతకం ధృవీకరణ తర్వాత',
      auditTrailLabel: 'ఆడిట్ ట్రయిల్',
      auditTrailValue: 'మార్చలేనిది',
      openMerchantHub: 'వ్యాపారి కేంద్రాన్ని తెరవండి',
      merchantOnlyHub: 'వ్యాపారి కేంద్రం (వ్యాపారులకు మాత్రమే)',
    },
    trust: {
      metric1Value: '< 200ms',
      metric1Label: 'ఖచ్చితమైన క్వెరీ రూటింగ్',
      metric2Value: '100%',
      metric2Label: 'ఆడిట్ ట్రయిల్ కవరేజ్',
      metric3Value: '25%',
      metric3Label: 'వ్యాపారి తగ్గింపు గరిష్ట పరిమితి',
      metric4Value: '0',
      metric4Label: 'డబుల్ స్టాక్ తగ్గింపులు లేవు',
      whyTitle: 'ఉన్నత-విశ్వసనీయ ఏజెంటిక్ కామర్స్ కోసం నిర్మితం',
      whySubtitle:
        'సాంప్రదాయ AI తప్పుడు ధరలు మరియు కల్పిత కూపన్లను సృష్టిస్తుంది. SellPilot AI కఠినమైన పరిమితులను అమలు చేస్తుంది.',
      card1Title: 'ఖచ్చితమైన ధృవీకరణ',
      card1Desc:
        'ధరలు, ప్రోమో కోడ్‌లు మరియు స్టాక్ ఎప్పుడూ LLMల ద్వారా సృష్టించబడవు. అన్నీ సర్వర్ ద్వారానే లెక్కించబడతాయి.',
      card2Title: 'ఐడెంపోటెంట్ స్టాక్ లాక్స్',
      card2Desc:
        'విజయవంతమైన Razorpay HMAC-SHA256 సంతకం ధృవీకరణ తర్వాత మాత్రమే ఇన్వెంటరీ తగ్గించబడుతుంది.',
      card3Title: 'బహుభాషా విశ్లేషణ',
      card3Desc:
        'తెలుగు, కన్నడ, హిందీ మరియు తమిళ రోమనైజ్డ్ భాషలను సహజంగా అర్థం చేసుకుని కేటలాగ్‌లో శోధిస్తుంది.',
      card4Title: 'శాశ్వత ఆడిట్ ట్రయిల్',
      card4Desc:
        'ప్రతి AI సంభాషణ, ధర సిఫార్సు, తగ్గింపు ధృవీకరణ మరియు చెల్లింపు ఈవెంట్ శాశ్వతంగా రికార్డ్ చేయబడుతుంది.',
    },
    catalog: {
      title: 'లైవ్ ధృవీకరించబడిన కేటలాగ్',
      subtitle: 'అన్ని ఉత్పత్తులు సర్వర్ స్టాక్‌తో నిజ-సమయంలో సమకాలీకరించబడి ఖచ్చితమైన ధరతో రక్షించబడతాయి.',
      searchPlaceholder: 'పేరు లేదా ఫీచర్ల ద్వారా శోధించండి...',
      categoryAll: 'అన్నీ',
      maxPriceLabel: 'గరిష్ట ధర:',
      inStock: 'స్టాక్ ఉంది',
      outOfStock: 'స్టాక్ అయిపోయింది',
      unitsStock: '{count} అందుబాటులో ఉన్నాయి',
      addToCart: 'కార్ట్‌కు జోడించు',
      inCart: 'కార్ట్‌లో ఉంది',
      askCopilot: 'కోపైలట్‌ను అడగండి',
      noProducts: 'మీ ఫిల్టర్‌లకు సరిపోయే ఉత్పత్తులు లేవు.',
      resetFilters: 'ఫిల్టర్‌లను రీసెట్ చేయండి',
      categories: {
        shoes: 'షూలు',
        laptops: 'ల్యాప్‌టాప్‌లు',
        phones: 'ఫోన్లు',
        cameras: 'కెమెరాలు',
        accessories: 'యాక్సెసరీలు',
        electronics: 'ఎలక్ట్రానిక్స్',
        clothing: 'దుస్తులు',
      },
    },
    productModal: {
      keyFeatures: 'ముఖ్య ఫీచర్లు & వివరాలు',
      guaranteedAuthentic: 'అసలైన ఉత్పత్తి హామీ',
      guaranteedDesc: 'ధృవీకరించబడిన స్టోర్ ఇన్వెంటరీ మరియు ఆర్డర్ లాక్‌ల రక్షణ.',
      razorpayTestReady: 'Razorpay టెస్ట్ చెల్లింపు సిద్ధంగా ఉంది',
      razorpayTestDesc: 'శాండ్‌బాక్స్ మోడ్‌లో తక్షణ HMAC-SHA256 సంతకం ధృవీకరణ.',
      askAboutProduct: 'ఈ ఉత్పత్తి గురించి AIని అడగండి',
      close: 'మూసివేయి',
    },
    cart: {
      title: 'మీ కార్ట్',
      itemsCount: '{count} అంశాలు ఎంచుకోబడ్డాయి',
      emptyTitle: 'మీ కార్ట్ ఖాళీగా ఉంది',
      emptySubtitle: 'ఉత్పత్తులను అన్వేషించండి లేదా స్మార్ట్ సిఫార్సుల కోసం SellPilot AIని అడగండి.',
      subtotal: 'ఉపమొత్తం',
      shipping: 'షిప్పింగ్',
      shippingFree: 'ఉచితం',
      discount: 'తగ్గింపు',
      total: 'మొత్తం సొమ్ము',
      checkoutBtn: 'చెక్అవుట్‌కు వెళ్లండి',
      clearCart: 'కార్ట్ ఖాళీ చేయి',
      remove: 'తీసివేయి',
      outOfStock: 'స్టాక్ లేదు',
      verifiedCheckout: 'ఖచ్చితమైన ధర ధృవీకరణ ప్రారంభించబడింది',
    },
    checkout: {
      title: 'సురక్షిత చెక్అవుట్',
      shippingAddress: 'షిప్పింగ్ చిరునామా',
      fullName: 'పూర్తి పేరు',
      email: 'ఈమెయిల్ చిరునామా',
      street: 'వీధి చిరునామా',
      city: 'నగరం',
      state: 'రాష్ట్రం',
      postalCode: 'పిన్ కోడ్',
      phone: 'ఫోన్ నంబర్',
      orderSummary: 'ఆర్డర్ సారాంశం',
      paymentMethod: 'చెల్లింపు విధానం',
      razorpayOption: 'Razorpay టెస్ట్ మోడ్ (UPI / Cards / NetBanking)',
      razorpayDesc: 'నిజమైన డబ్బు తీసుకోబడదు. ఆటోమేటిక్ సంతకం ధృవీకరణతో కూడిన టెస్ట్ మోడ్.',
      payBtn: 'Razorpay ద్వారా చెల్లించండి',
      processing: 'ధృవీకరిస్తూ Razorpay ప్రారంభిస్తోంది...',
      successTitle: 'ఆర్డర్ విజయవంతంగా పూర్తయింది!',
      successDesc: 'Razorpay HMAC సంతకం ద్వారా చెల్లింపు ధృవీకరించబడింది మరియు స్టాక్ కేటాయించబడింది.',
      failureTitle: 'చెల్లింపు ధృవీకరణ విఫలమైంది',
      failureDesc: 'చెల్లింపు ధృవీకరించబడలేదు లేదా రద్దు చేయబడింది. మీ కార్ట్ సురక్షితంగా ఉంది.',
      viewOrdersBtn: 'నా ఆర్డర్లు చూడండి',
      tryAgainBtn: 'మళ్లీ ప్రయత్నించండి',
      closeBtn: 'మూసివేయి',
    },
    orders: {
      title: 'నా ఆర్డర్లు',
      subtitle: 'మీ ఆర్డర్ చరిత్ర, ధృవీకరించబడిన చెల్లింపులు మరియు ప్రత్యక్ష స్థితిని ట్రాక్ చేయండి.',
      noOrdersTitle: 'ఆర్డర్లు ఏవీ కనుగొనబడలేదు',
      noOrdersSubtitle: 'మీరు ఇంకా ఎలాంటి ఆర్డర్లు చేయలేదు. మా కేటలాగ్‌ను చూడండి.',
      orderNumber: 'ఆర్డర్ #',
      orderDate: 'తేదీ',
      orderStatus: 'స్థితి',
      orderTotal: 'మొత్తం',
      orderItems: 'వస్తువులు',
      cancelOrder: 'ఆర్డర్ రద్దు చేయి',
      cancelConfirm: 'మీరు ఖచ్చితంగా ఈ ఆర్డర్‌ను రద్దు చేయాలనుకుంటున్నారా? అన్ని వస్తువులు తిరిగి స్టాక్‌కు చేర్చబడతాయి.',
      cancellationSuccess: 'ఆర్డర్ రద్దు చేయబడింది మరియు స్టాక్ పునరుద్ధరించబడింది.',
      cancellationFailed: 'ఆర్డర్ రద్దు చేయడం విఫలమైంది.',
      viewDetails: 'వివరాలు చూడండి',
      statusPending: 'పెండింగ్',
      statusPaid: 'చెల్లించబడింది',
      statusProcessing: 'ప్రాసెసింగ్',
      statusCompleted: 'పూర్తయింది',
      statusCancelled: 'రద్దు చేయబడింది',
      statusFailed: 'విఫలమైంది',
      statusHistory: 'స్థితి టైమ్‌లైన్',
      shippingTo: 'షిప్పింగ్ చిరునామా',
      paymentId: 'చెల్లింపు ID',
      restockedNote: 'కొనుగోలు చేసిన అన్ని వస్తువులు వ్యాపారి కేటలాగ్‌కు చేర్చబడ్డాయి.',
      orderSummary: 'ఆర్డర్ వివరాలు',
    },
    auth: {
      welcomeBack: 'మళ్ళీ స్వాగతం',
      createAccount: 'ఖాతాను సృష్టించండి',
      loginSubtitle: 'మీ వాణిజ్య ఖాతాలోకి లాగిన్ అవ్వండి',
      registerSubtitle: 'SellPilot AI ప్లాట్‌ఫామ్‌లో చేరండి',
      nameLabel: 'పూర్తి పేరు',
      emailLabel: 'ఈమెయిల్ చిరునామా',
      passwordLabel: 'పాస్‌వర్డ్',
      roleLabel: 'ఖాతా పాత్ర',
      customerRole: 'కస్టమర్ (కొనుగోలుదారు)',
      merchantRole: 'వ్యాపారి (విక్రేత)',
      businessNameLabel: 'వ్యాపారం / స్టోర్ పేరు',
      signInBtn: 'సైన్ ఇన్',
      signUpBtn: 'ఖాతా సృష్టించు',
      noAccountPrompt: 'ఖాతా లేదా?',
      haveAccountPrompt: 'ఇప్పటికే ఖాతా ఉందా?',
      demoCustomerBtn: 'డెమో కస్టమర్ నింపండి',
      demoMerchantBtn: 'డెమో వ్యాపారి నింపండి',
      demoHeading: 'లేదా డెమో వివరాలతో పరీక్షించండి:',
    },
    merchant: {
      title: 'వ్యాపారి వృద్ధి కేంద్రం',
      subtitle: 'డేటా ఆధారిత రాబడి వృద్ధి, స్వయంప్రతిపత్తి అవకాశాల గుర్తింపు మరియు తగ్గింపు పరిమితులు.',
      gatedBadge: 'రక్షిత & బౌండెడ్',
      tabInsights: 'AI వృద్ధి అంతర్దృష్టులు',
      tabProducts: 'కేటలాగ్ నిర్వహణ',
      tabCampaigns: 'ప్రచారాలు & తగ్గింపులు',
      tabAudit: 'శాశ్వత ఆడిట్ ట్రయిల్',
      accessRestrictedTitle: 'యాక్సెస్ పరిమితం చేయబడింది',
      accessRestrictedDesc:
        'వ్యాపారి కేంద్రం నమోదిత విక్రేతలు మరియు నిర్వాహకులకు మాత్రమే. మీరు కస్టమర్ ఖాతాతో ({email}) లాగిన్ అయ్యారు.',
      returnToDiscoveryBtn: 'కొనుగోలుదారుల అన్వేషణకు తిరిగి వెళ్ళు',
      bestOpportunityTitle: 'ఉత్తమ అవకాశం ఉన్న ఉత్పత్తి',
      bestOpportunityBadge: 'అధిక లాభం',
      topPromotionTitle: 'టాప్ ప్రమోషన్ అభ్యర్థి',
      topPromotionBadge: 'ఇన్వెంటరీ లోతు',
      categoryMomentumTitle: 'వర్గం ఊపు',
      categoryMomentumBadge: 'క్రియాశీల దృష్టి',
      revenueVelocityTitle: 'రాబడి వేగం',
      revenueVelocityBadge: 'సురక్షిత మార్జిన్',
      addProductBtn: 'ఉత్పత్తిని జోడించు',
      createCampaignBtn: 'ప్రచారం సృష్టించు',
      discountValidationTitle: 'తగ్గింపు గార్డ్‌రైల్ చెకర్',
      testDiscountPlaceholder: 'తగ్గింపు % నమోదు చేయండి (ఉదా. 15)',
      validateDiscountBtn: 'గార్డ్‌రైల్ తనిఖీ చేయి',
      discountAllowed: 'సురక్షిత పరిమితిలో ఉంది (<= 25%)',
      discountRejected: 'తిరస్కరించబడింది: 25% పరిమితిని మించింది',
      productTableColName: 'ఉత్పత్తి పేరు',
      productTableColCategory: 'వర్గం',
      productTableColPrice: 'ధర',
      productTableColStock: 'స్టాక్',
      productTableColStatus: 'స్థితి',
      productTableColActions: 'చర్యలు',
      activeStatus: 'యాక్టివ్',
      inactiveStatus: 'ఇన్‌యాక్టివ్',
      noProductsMerchant: 'మీ కేటలాగ్‌లో ఇంకా ఎలాంటి ఉత్పత్తులు లేవు. మొదటి వస్తువును జోడించండి.',
      campaignTableColName: 'ప్రచారం పేరు',
      campaignTableColDiscount: 'తగ్గింపు %',
      campaignTableColStatus: 'స్థితి',
      campaignTableColActions: 'చర్యలు',
      approveCampaign: 'ఆమోదించు',
      activateCampaign: 'యాక్టివేట్ చేయి',
      noCampaigns: 'ఇంకా ఎలాంటి ప్రచారాలు సృష్టించబడలేదు.',
      auditLogTitle: 'ఆడిట్ ట్రయిల్ ఈవెంట్లు',
      auditLogColEvent: 'ఈవెంట్ చర్య',
      auditLogColActor: 'కర్త',
      auditLogColStatus: 'స్థితి',
      auditLogColTimestamp: 'సమయముద్ర',
      noAuditLogs: 'ఆడిట్ లాగ్‌లు ఏవీ నమోదు కాలేదు.',
      refreshData: 'రిఫ్రెష్ చేయండి',
    },
    chat: {
      assistantTitle: 'SellPilot AI సహాయకుడు',
      agenticCommerce: 'ఏజెంటిక్ కామర్స్',
      languageLabel: 'భాష:',
      buyerTab: 'కొనుగోలుదారు',
      merchantTab: 'వ్యాపారి',
      inputPlaceholder: 'తెలుగు, ఇంగ్లీష్, కన్నడ, హిందీ, తమిళంలో సహజంగా అడగండి లేదా శోధించండి...',
      sendBtn: 'పంపు',
      initialGreetingBuyer:
        'నమస్కారం! నేను SellPilot AI. మీరు ఏ ఉత్పత్తి కోసం చూస్తున్నారో, మీ బడ్జెట్ లేదా కావాల్సిన ఫీచర్లను చెప్పండి, నేను కేటలాగ్ నుండి ఖచ్చితమైన ఉత్పత్తులను చూపిస్తాను.',
      initialGreetingMerchant:
        'SellPilot వ్యాపారి కేంద్రానికి స్వాగతం. ఉత్పత్తుల పనితీరు, ప్రచార అవకాశాలు లేదా తగ్గింపు ఆలోచనల గురించి నన్ను అడగండి.',
      chip1Buyer: 'naaku running shoes kavali under 3000',
      chip2Buyer: 'ఏది అత్యంత చౌకైనది?',
      chip3Buyer: 'laptop under 50k with 16gb ram',
      chip4Buyer: 'కార్ట్‌కు జోడించు',
      chip5Buyer: 'ఇప్పుడే కొనుగోలు చేయి',
      chip6Buyer: 'నా కార్ట్ చూపించు',
      chip1Merchant: 'నేను దేనిని ప్రచారం చేయాలి?',
      chip2Merchant: 'ఏ ఉత్పత్తిలో మంచి అవకాశం ఉంది?',
      chip3Merchant: 'క్రాస్-సెల్ కోసం ఏమి సూచించవచ్చు?',
      chip4Merchant: 'అప్‌సెల్ సలహా ఇవ్వండి',
      chip5Merchant: '15% తగ్గింపు సురక్షితమేనా?',
      chip6Merchant: '30% తగ్గింపు ఇవ్వవచ్చా?',
      addToCartBtn: 'కార్ట్‌కు జోడించు',
      proceedCheckoutBtn: 'చెక్అవుట్‌కు వెళ్లండి',
      orderTotalReady: 'మీ మొత్తం సిద్ధంగా ఉంది. చెక్అవుట్‌ను కొనసాగించడానికి క్రింద క్లిక్ చేయండి.',
    },
    recommendations: {
      upsellTitle: 'సిఫార్సు చేయబడిన అప్‌గ్రేడ్ (అప్‌సెల్)',
      crossSellTitle: 'కలిసి కొనుగోలు చేయదగిన వస్తువులు (క్రాస్-సెల్)',
      approveAndAdd: 'ఆమోదించి జోడించు',
      dismiss: 'విస్మరించు',
      moreDiff: '+₹{diff} ఎక్కువ',
      upsellSuccess: 'అప్‌గ్రేడ్ మీ కార్ట్‌కు జోడించబడింది!',
      crossSellSuccess: 'జతచేసే వస్తువు కార్ట్‌కు జోడించబడింది!',
    },
    testimonials: {
      tag: 'ఉత్పత్తి పరీక్షించబడింది',
      title: 'భారతీయ స్థాయి సంభాషణాత్మక వాణిజ్యం కోసం నిర్మితం',
      quote1:
        '“రోమనైజ్డ్ బహుభాషా విశ్లేషణ నిజంగా అద్భుతం. మా తెలుగు మరియు కన్నడ కస్టమర్లు ఇంగ్లీష్ అక్షరాల్లో వెతికి ఎలాంటి ధరల తప్పులు లేకుండా సరైన ఉత్పత్తులను పొందుతున్నారు.”',
      author1Name: 'ప్రవీణ్ గౌడ',
      author1Role: 'వ్యవస్థాపకుడు, దక్షిణ రిటైల్',
      quote2:
        '“Razorpay చెల్లింపు ధృవీకరణ మరియు డబుల్ తగ్గింపు లేని స్టాక్ లాక్స్ దీనిని చాలా పటిష్టంగా మార్చాయి.”',
      author2Name: 'అనన్య శర్మ',
      author2Role: 'ప్రొడక్ట్ హెడ్, అపెక్స్ రిటైల్',
      quote3:
        '“వ్యాపారి వృద్ధి అంతర్దృష్టులు అదనపు స్టాక్‌ను స్వయంచాలకంగా గుర్తించి సురక్షితమైన ప్రమోషన్లను సూచించాయి, దీనితో మా విక్రయాలు 34% పెరిగాయి.”',
      author3Name: 'కార్తీక్ ఆర్.',
      author3Role: 'ఇ-కామర్స్ డైరెక్టర్, అర్బన్‌స్టైల్',
    },
    faqs: {
      tag: 'ప్రశ్నలు ఉన్నాయా?',
      title: 'తరచుగా అడిగే ప్రశ్నలు',
      q1: 'రోమనైజ్డ్ బహుభాషా AI షాపింగ్ ఎలా పనిచేస్తుంది?',
      a1: 'SellPilot AI రోమనైజ్డ్ భారతీయ లిపులను ("naaku running shoes kavali under 3000") గుర్తిస్తుంది. ఇది ఉద్దేశాన్ని అర్థం చేసుకుని ఖచ్చితమైన ఉత్పత్తులతో సరిపోలుస్తుంది.',
      q2: 'ధరలు మరియు తగ్గింపులపై AI తప్పులను ఏది నివారిస్తుంది?',
      a2: 'LLM ఎప్పుడూ తుది ధరలు లేదా తగ్గింపులను స్వయంగా నిర్ణయించదు. అన్ని ధరలు మరియు తగ్గింపులు (గరిష్టంగా 25%) సర్వర్ ద్వారా మాత్రమే ధృవీకరించబడతాయి.',
      q3: 'ఇన్వెంటరీ డబుల్ తగ్గింపులను ఎలా నివారిస్తారు?',
      a3: 'సర్వర్‌లో Razorpay HMAC-SHA256 సంతకం ధృవీకరణ విజయవంతమైన తర్వాత మాత్రమే అటామిక్ పద్ధతిలో స్టాక్ తగ్గించబడుతుంది.',
      q4: 'కస్టమర్ ఆర్డర్‌ను రద్దు చేసినప్పుడు ఏమి జరుగుతుంది?',
      a4: 'ఆర్డర్ రద్దు చేయబడినప్పుడు, కొనుగోలు చేసిన అన్ని వస్తువులు ఆటోమేటిక్‌గా కేటలాగ్‌కు తిరిగి చేర్చబడతాయి మరియు ఆడిట్ లాగ్ రికార్డ్ అవుతుంది.',
    },
    footer: {
      track: 'Razorpay ట్రాక్ 01 (AI గ్రోత్ & కామర్స్)',
      bounded: 'బౌండెడ్ & ఖచ్చితమైనది',
      testMode: 'Razorpay టెస్ట్ మోడ్',
      copyright: '© {year} SellPilot AI. Manrope టైపోగ్రఫీ & రక్షిత వాణిజ్యం.',
    },
  },
};

/**
 * Helper to safely retrieve translation strings by dot-notation key (e.g., 'nav.buyerDiscovery')
 * Automatically interpolates parameters like {count} or {sample}.
 * Falls back to English if key or language is missing, ensuring no raw keys appear.
 */
export function getTranslation(
  lang: SupportedLanguage,
  path: string,
  params?: Record<string, string | number>
): string {
  const activeDict = translations[lang] || translations.en;
  const fallbackDict = translations.en;

  const resolve = (dict: any, p: string): any => {
    const parts = p.split('.');
    let current = dict;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return undefined;
      current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
  };

  let template = resolve(activeDict, path);
  if (!template) {
    template = resolve(fallbackDict, path);
  }
  if (!template) {
    // If still missing, return the last token humanized so raw key paths like 'nav.something' never show
    const lastPart = path.split('.').pop() || path;
    return lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
  }

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }

  return template;
}
