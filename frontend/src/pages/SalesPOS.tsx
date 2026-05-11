import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { setupBarcodeScanner } from '../utils/barcodeScanner';

// Store
import { useCartStore, type Product } from '../store/useCartStore';

// New POS Components
import CategorySidebar from '../components/POS/CategorySidebar';
import ProductWorkspace from '../components/POS/ProductWorkspace';
import BillingPanel from '../components/POS/BillingPanel';
import MedicalInfoDrawer from '../components/POS/MedicalInfoDrawer';
import CustomerModal from '../components/CustomerModal';
import DraftRestorationModal from '../components/DraftRestorationModal';
import SaleSuccessScreen from '../components/POS/SaleSuccessScreen';
import toast from 'react-hot-toast';
import alerts from '../utils/alerts';

const SalesPOS = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [selectedInfoProduct, setSelectedInfoProduct] = useState<Product | null>(null);
  const [enableMedicalInfo, setEnableMedicalInfo] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isDraftHandled, setIsDraftHandled] = useState(false);
  const [completedSaleData, setCompletedSaleData] = useState<any>(null);

  const { user } = useAuth();
  const isPharmacist = Array.isArray(user?.roles) && (user.roles.includes('PHARMACIST') || user.roles.includes('BUSINESS_ADMIN'));
  const queryClient = useQueryClient();

  const { 
    cart, 
    customer, 
    paymentMode, 
    amountPaid, 
    getTotals, 
    addToCart, 
    clearCart,
    setCustomer,
    lastUpdated 
  } = useCartStore();

  const totals = getTotals();

  // Check for existing cart on mount
  useEffect(() => {
    if (cart.length > 0 && !isDraftHandled) {
      setShowRestoreModal(true);
    }
    setIsDraftHandled(true);
  }, []);

  // Load Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/full-profile');
        setEnableMedicalInfo(!!res.data.settings?.enableMedicalInfo);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  // Barcode Scanner Integration
  useEffect(() => {
    const cleanup = setupBarcodeScanner({
      onScan: (barcode) => {
        api.get(`/products?search=${barcode}`).then(res => {
          const product = res.data.find((p: Product) => p.barcode === barcode || p.sku === barcode);
          if (product) addToCart(product);
        });
      },
      scanDelay: 50
    });
    return cleanup;
  }, [addToCart]);

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        customerId: customer?.id || null,
        type: "TAX_INVOICE",
        subTotal: totals.subtotal,
        discount: totals.discount,
        totalTax: totals.tax,
        cgst: totals.tax / 2,
        sgst: totals.tax / 2,
        grandTotal: totals.total,
        amountPaid: Number(amountPaid) || totals.total,
        paymentMode,
        isCash: paymentMode === 'CASH',
        items: cart.map(i => ({
          productId: i.id,
          batchId: i.selectedBatchId,
          quantity: i.quantity,
          rate: i.rate,
          gstRate: i.gstRate,
          taxableAmount: (i.rate * i.quantity) - (i.discountType === 'PERCENT' ? (i.rate * i.quantity * i.discountValue / 100) : i.discountValue),
          cgstAmount: ( ( (i.rate * i.quantity) - (i.discountType === 'PERCENT' ? (i.rate * i.quantity * i.discountValue / 100) : i.discountValue) ) * i.gstRate / 100 ) / 2,
          sgstAmount: ( ( (i.rate * i.quantity) - (i.discountType === 'PERCENT' ? (i.rate * i.quantity * i.discountValue / 100) : i.discountValue) ) * i.gstRate / 100 ) / 2,
          total: ( (i.rate * i.quantity) - (i.discountType === 'PERCENT' ? (i.rate * i.quantity * i.discountValue / 100) : i.discountValue) ) * (1 + i.gstRate / 100)
        }))
      };
      
      const res = await api.post('/sales', payload);
      
      // Prepare invoice for PDF
      const invoiceData = {
        ...payload,
        date: new Date().toISOString(),
        customer,
        items: cart.map(i => ({ product: { name: i.name }, ...i }))
      };
      
      return invoiceData;
    },
    onSuccess: (invoiceData) => {
      alerts.success('Product sold successfully');
      clearCart();
      setCompletedSaleData(invoiceData);
    }
  });

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const paid = amountPaid === '' ? totals.total : Number(amountPaid);
    
    if (paid < totals.total && paymentMode !== 'CREDIT' && !customer) {
      return alert("For partial payments or credit, please select a customer first.");
    }

    checkoutMutation.mutate();
  };

  const handleOpenInfo = (product: Product) => {
    setSelectedInfoProduct(product);
    setInfoDrawerOpen(true);
  };

  if (completedSaleData) {
    return (
      <SaleSuccessScreen 
        saleData={completedSaleData} 
        onNewSale={() => setCompletedSaleData(null)} 
      />
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden bg-white">
      <DraftRestorationModal 
        isOpen={showRestoreModal}
        formName="Sales POS Cart"
        timestamp={lastUpdated}
        onRestore={() => {
          setShowRestoreModal(false);
          toast.success('Cart restored');
        }}
        onDiscard={() => {
          clearCart();
          setShowRestoreModal(false);
        }}
      />
      {/* 1. Category Sidebar */}
      <CategorySidebar 
        selectedCategoryId={selectedCategoryId} 
        onCategorySelect={setSelectedCategoryId} 
      />

      {/* 2. Product Workspace (Center) */}
      <ProductWorkspace 
        selectedCategoryId={selectedCategoryId}
        onViewInfo={handleOpenInfo}
        showMedicalInfo={enableMedicalInfo && isPharmacist}
      />

      {/* 3. Billing Panel (Right) */}
      <BillingPanel 
        onCheckout={handleCheckout} 
        onCustomerSelect={() => setShowCustomerModal(true)}
        isLoading={checkoutMutation.isPending}
      />

      {/* Modals & Drawers */}
      <CustomerModal 
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={async (customerInput) => {
          const res = await api.post('/customers', customerInput);
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          setCustomer(res.data.data);
          setShowCustomerModal(false);
        }}
      />

      <MedicalInfoDrawer 
        isOpen={infoDrawerOpen}
        onClose={() => setInfoDrawerOpen(false)}
        product={selectedInfoProduct as any}
      />
    </div>
  );
};

export default SalesPOS;
