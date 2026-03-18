/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useMemo, useEffect, Component } from 'react';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Plus, 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  MessageCircle, 
  Trash2, 
  Edit2, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Package,
  Truck,
  Cake,
  CreditCard,
  Shield,
  Activity,
  LogIn,
  LogOut,
  Bell,
  Sun,
  Moon,
  Database,
  Download,
  Upload,
  FileText,
  ArrowLeft,
  Save,
  Settings as SettingsIcon,
  Calendar,
  ChevronRight,
  X,
  Check,
  Sparkles,
  UserCheck,
  Folder,
  FolderPlus,
  MoreVertical,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  format, 
  subDays, 
  isWithinInterval, 
  startOfMonth, 
  endOfMonth, 
  parseISO, 
  isAfter, 
  isBefore, 
  startOfDay, 
  endOfDay, 
  differenceInYears,
  getYear,
  setYear,
  getMonth,
  setMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Cropper from 'react-easy-crop';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  query, 
  where,
  getDocs,
  orderBy, 
  Timestamp,
  getDocFromServer,
  deleteField
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  Student, 
  Modality, 
  MonthlyPayment, 
  Graduation, 
  Product, 
  Supplier, 
  Partner,
  Transaction,
  Category,
  Settings,
  Screen,
  Rank,
  AcademyImage,
  GalleryFolder,
  Teacher,
  TeacherPayment,
  TeacherClassLog,
  Order,
  Sale,
  SaleItem,
  PurchaseOrder,
  PaymentMethod
} from './types';
import { 
  BJJ_RANKS, 
  MUAY_THAI_RANKS, 
  MMA_RANKS, 
  EXPENSE_CATEGORIES 
} from './constants';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if ((this as any).state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const firestoreError = JSON.parse((this as any).state.error?.message || "");
        if (firestoreError.error.includes("Missing or insufficient permissions")) {
          errorMessage = "Você não tem permissão para realizar esta operação.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-4">Ops! Algo deu errado</h2>
            <p className="text-zinc-400 mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Login Component ---

const Login = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white text-4xl font-bold mb-2 tracking-tight">CT Guerreiros</h1>
          <p className="text-zinc-500 font-medium uppercase tracking-widest text-xs">Sistema de Gestão Marcial</p>
        </div>

        <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl">
          <h2 className="text-white text-xl font-bold mb-2">Bem-vindo de volta</h2>
          <p className="text-zinc-400 text-sm mb-8">Faça login com sua conta Google para acessar o sistema.</p>
          
          <button 
            onClick={onLogin}
            className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 shadow-lg"
          >
            <LogIn className="w-5 h-5" />
            Entrar com Google
          </button>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <div className="flex items-center gap-3 text-zinc-500 text-xs">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Servidor Seguro & Criptografado
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Main App Component ---

const getCroppedImg = async (imageSrc: string, pixelCrop: { x: number, y: number, width: number, height: number }) => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (error) => reject(error));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Max size for logo to avoid Firestore limit (1MB)
  const maxSize = 400;
  let width = pixelCrop.width;
  let height = pixelCrop.height;

  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width *= ratio;
    height *= ratio;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  return canvas.toDataURL('image/jpeg', 0.8);
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [inventoryTab, setInventoryTab] = useState<'stock' | 'orders'>('stock');
  const [history, setHistory] = useState<Screen[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [academyGallery, setAcademyGallery] = useState<AcademyImage[]>([]);
  const [galleryFolders, setGalleryFolders] = useState<GalleryFolder[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [view, setView] = useState<'simple' | 'group' | 'history'>('simple');
  const [expandedSales, setExpandedSales] = useState<string[]>([]);
  const [saleType, setSaleType] = useState<'simple' | 'group'>('simple');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [selectedBuyerType, setSelectedBuyerType] = useState<'student' | 'partner' | 'teacher' | 'client'>('student');
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<string>('0');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [saleNumber, setSaleNumber] = useState<string>(`VEN-${Math.floor(Math.random() * 10000)}`);
  const [isAutomaticSaleNumber, setIsAutomaticSaleNumber] = useState<boolean>(true);
  const [payerName, setPayerName] = useState<string>('');
  
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  };

  useEffect(() => {
    const newValue = isDarkMode;
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
    if (newValue) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);
  const [isGraduationModalOpen, setIsGraduationModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingRank, setEditingRank] = useState<Rank | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherPayments, setTeacherPayments] = useState<TeacherPayment[]>([]);
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherClassLogs, setTeacherClassLogs] = useState<TeacherClassLog[]>([]);
  const [reportFilters, setReportFilters] = useState({
    category: 'all',
    studentId: 'all',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // --- CRUD Handlers ---
  const removeUndefined = (obj: any): any => {
    if (obj === undefined) return undefined;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(removeUndefined).filter(v => v !== undefined);
    }
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, removeUndefined(v)])
        .filter(([_, v]) => v !== undefined)
    );
  };

  const handleAddSale = async (sale: Omit<Sale, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'sales'));
      // Remove undefined values
      const cleanedSale = removeUndefined(sale);
      await setDoc(docRef, { ...cleanedSale, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    }
  };

  const handleUpdateStudent = async (id: string, data: Partial<Student>) => {
    try {
      await updateDoc(doc(db, 'students', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'students');
    }
  };

  const handleMarkSaleAsPaid = async (sale: Sale) => {
    try {
      await handleUpdateSale(sale.id, { status: 'completed' });

      // Add transaction
      await handleAddTransaction({
        type: 'income',
        category: 'Venda de Produtos',
        description: `Venda ${sale.saleNumber}`,
        amount: sale.finalAmount,
        date: new Date().toISOString(),
      });

      // Update buyer balance if student
      if (sale.items.length > 0 && sale.items[0].buyerType === 'student') {
        const studentId = sale.items[0].buyerId;
        const student = students.find(s => s.id === studentId);
        if (student) {
          await handleUpdateStudent(studentId, {
            balance: (student.balance || 0) - sale.finalAmount
          });
        }
      }
    } catch (error) {
      console.error('Error marking sale as paid:', error);
    }
  };

  const handleUpdateSale = async (id: string, sale: Partial<Sale>) => {
    try {
      const docRef = doc(db, 'sales', id);
      // Remove undefined values
      const cleanedSale = removeUndefined(sale);
      await updateDoc(docRef, { ...cleanedSale });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sales');
    }
  };

  const handleDeleteSale = async (sale: Sale) => {
    console.log('handleDeleteSale called for:', sale.id);
    try {
      // 1. Revert stock
      for (const item of sale.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;

        if (item.variationId && product.variations) {
          const updatedVariations = product.variations.map(v => 
            v.id === item.variationId ? { ...v, stock: v.stock + item.quantity } : v
          );
          await handleUpdateProduct(product.id, { variations: updatedVariations });
        } else {
          await handleUpdateProduct(product.id, { stock: (product.stock || 0) + item.quantity });
        }
      }

      // 2. Revert financial records
      if (sale.status === 'completed') {
        // Delete transaction
        const transactionsQuery = query(collection(db, 'transactions'), where('description', '==', `Venda ${sale.saleNumber}`));
        const snapshot = await getDocs(transactionsQuery);
        for (const doc of snapshot.docs) {
          await handleDeleteTransaction(doc.id);
        }

        // Revert student balance
        if (sale.items.length > 0 && sale.items[0].buyerType === 'student') {
          const studentId = sale.items[0].buyerId;
          const student = students.find(s => s.id === studentId);
          if (student) {
            await handleUpdateStudent(studentId, {
              balance: (student.balance || 0) + sale.finalAmount
            });
          }
        }
      }

      // 3. Delete sale
      await deleteDoc(doc(db, 'sales', sale.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'sales');
    }
  };

  const handleAddPurchaseOrder = async (order: Omit<PurchaseOrder, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'purchaseOrders'));
      const cleanedOrder = removeUndefined(order);
      await setDoc(docRef, { ...cleanedOrder, id: docRef.id });
      
      // Add expense transaction if totalValue is provided
      if (order.totalValue && order.totalValue > 0) {
        const docRefTrans = doc(collection(db, 'transactions'));
        await setDoc(docRefTrans, { 
          id: docRefTrans.id,
          type: 'expense',
          category: 'Compra de Estoque',
          description: `Pedido de compra: ${order.productId}`,
          amount: order.totalValue,
          date: order.createdAt ? order.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'purchaseOrders');
    }
  };

  const handleUpdatePurchaseOrder = async (order: PurchaseOrder) => {
    try {
      const docRef = doc(db, 'purchaseOrders', order.id);
      await updateDoc(docRef, { ...order });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'purchaseOrders');
    }
  };

  const handleDeletePurchaseOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'purchaseOrders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'purchaseOrders');
    }
  };

  // --- Firebase Auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentScreen('home');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // --- CRUD Handlers ---

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'transactions'));
      await setDoc(docRef, { ...transaction, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
    }
  };

  const handleAddProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'products'));
      await setDoc(docRef, { ...product, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const handleUpdateProduct = async (id: string, product: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', id), product);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
  };

  const handleAddSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'suppliers'));
      await setDoc(docRef, { ...supplier, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'suppliers');
    }
  };

  const handleUpdateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    try {
      await updateDoc(doc(db, 'suppliers', id), supplier);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'suppliers');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'suppliers');
    }
  };

  const handleAddPartner = async (partner: Omit<Partner, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'partners'));
      await setDoc(docRef, { ...partner, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'partners');
    }
  };

  const handleUpdatePartner = async (id: string, partner: Partial<Partner>) => {
    try {
      await updateDoc(doc(db, 'partners', id), partner);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'partners');
    }
  };

  const handleDeletePartner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'partners', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'partners');
    }
  };

  const handleAddPaymentMethod = async (method: Omit<PaymentMethod, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'payment_methods'));
      await setDoc(docRef, { ...method, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payment_methods');
    }
  };

  const handleUpdatePaymentMethod = async (id: string, method: Partial<PaymentMethod>) => {
    try {
      await updateDoc(doc(db, 'payment_methods', id), method);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'payment_methods');
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payment_methods', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'payment_methods');
    }
  };

  const handleAddRank = async (rank: Omit<Rank, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'ranks'));
      await setDoc(docRef, { ...rank, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ranks');
    }
  };

  const handleUpdateRank = async (id: string, rank: Partial<Rank>) => {
    try {
      await updateDoc(doc(db, 'ranks', id), rank);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'ranks');
    }
  };

  const handleDeleteRank = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ranks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'ranks');
    }
  };

  const handleAddAcademyImage = async (image: Omit<AcademyImage, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'academy_gallery'));
      await setDoc(docRef, { ...image, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'academy_gallery');
    }
  };

  const handleAddGalleryFolder = async (name: string) => {
    try {
      const docRef = doc(collection(db, 'gallery_folders'));
      await setDoc(docRef, { id: docRef.id, name, createdAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'gallery_folders');
    }
  };

  const handleDeleteGalleryFolder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery_folders', id));
      const imagesToUpdate = academyGallery.filter(img => img.folderId === id);
      for (const img of imagesToUpdate) {
        await updateDoc(doc(db, 'academy_gallery', img.id), { folderId: deleteField() });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'gallery_folders');
    }
  };

  const handleDeleteAcademyImage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'academy_gallery', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'academy_gallery');
    }
  };

  const handleAddCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'categories'));
      await setDoc(docRef, { ...category, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const handleUpdateSettings = async (data: Partial<Settings>) => {
    try {
      const settingsRef = doc(db, 'settings', 'main');
      await setDoc(settingsRef, { ...data, id: 'main' }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/main');
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    // Reset input value to allow selecting same file again
    e.target.value = '';
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'categories');
    }
  };

  const handleReceivePayment = async (studentId: string, paymentId: string, amountReceived: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const payment = student.payments.find(p => p.id === paymentId);
    if (!payment) return;

    const difference = amountReceived - payment.amount;
    const newBalance = (student.balance || 0) + difference;

    const updatedPayments = student.payments.map(p => 
      p.id === paymentId 
        ? { ...p, status: 'paid' as const, paymentDate: new Date().toISOString(), amount: amountReceived } 
        : p
    );

    try {
      await updateDoc(doc(db, 'students', student.id), { 
        payments: updatedPayments,
        balance: newBalance
      });
      
      await handleAddTransaction({
        type: 'income',
        category: 'Mensalidade',
        description: `Mensalidade ${payment.month}/${payment.year} - ${student.name}`,
        amount: amountReceived,
        date: new Date().toISOString(),
        studentId: student.id
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${student.id}`);
    }
  };

  const handleAddTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'teachers'));
      await setDoc(docRef, { ...teacher, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teachers');
    }
  };

  const handleUpdateTeacher = async (id: string, teacher: Partial<Teacher>) => {
    try {
      await updateDoc(doc(db, 'teachers', id), teacher);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'teachers');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'teachers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'teachers');
    }
  };

  const handlePayTeacher = async (payment: Omit<TeacherPayment, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'teacher_payments'));
      await setDoc(docRef, { ...payment, id: docRef.id });

      const teacher = teachers.find(t => t.id === payment.teacherId);
      await handleAddTransaction({
        type: 'expense',
        category: 'Pagamento Professor',
        description: `Pagamento ${teacher?.name} - Ref: ${format(parseISO(payment.periodStart), 'dd/MM')} a ${format(parseISO(payment.periodEnd), 'dd/MM')}`,
        amount: payment.amount,
        date: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teacher_payments');
    }
  };

  const handleAddClassLog = async (log: Omit<TeacherClassLog, 'id'>) => {
    try {
      const docRef = doc(collection(db, 'teacher_class_logs'));
      await setDoc(docRef, { ...log, id: docRef.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'teacher_class_logs');
    }
  };

  const handleUpdateClassLog = async (id: string, log: Partial<TeacherClassLog>) => {
    try {
      await updateDoc(doc(db, 'teacher_class_logs', id), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `teacher_class_logs/${id}`);
    }
  };

  const handleDeleteClassLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'teacher_class_logs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teacher_class_logs/${id}`);
    }
  };

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!user) return;

    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      setStudents(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'students'));

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProducts(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Supplier));
      setSuppliers(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'suppliers'));

    const unsubPartners = onSnapshot(collection(db, 'partners'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Partner));
      setPartners(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'partners'));

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      setOrders(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale));
      setSales(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sales'));

    const unsubPaymentMethods = onSnapshot(collection(db, 'payment_methods'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PaymentMethod));
      setPaymentMethods(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'payment_methods'));

    const unsubTransactions = onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
      setTransactions(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));

    const unsubRanks = onSnapshot(query(collection(db, 'ranks'), orderBy('order', 'asc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Rank));
      setRanks(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'ranks'));

    const unsubAcademyGallery = onSnapshot(query(collection(db, 'academy_gallery'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AcademyImage));
      setAcademyGallery(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'academy_gallery'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
      setCategories(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ id: snapshot.id, ...snapshot.data() } as Settings);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/main'));

    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Teacher));
      setTeachers(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'teachers'));

    const unsubTeacherPayments = onSnapshot(collection(db, 'teacher_payments'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TeacherPayment));
      setTeacherPayments(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'teacher_payments'));

    const unsubTeacherClassLogs = onSnapshot(collection(db, 'teacher_class_logs'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TeacherClassLog));
      setTeacherClassLogs(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'teacher_class_logs'));

    const unsubGalleryFolders = onSnapshot(query(collection(db, 'gallery_folders'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GalleryFolder));
      setGalleryFolders(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'gallery_folders'));

    const unsubPurchaseOrders = onSnapshot(collection(db, 'purchaseOrders'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PurchaseOrder));
      setPurchaseOrders(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'purchaseOrders'));

    return () => {
      unsubStudents();
      unsubProducts();
      unsubSuppliers();
      unsubPartners();
      unsubTransactions();
      unsubRanks();
      unsubAcademyGallery();
      unsubCategories();
      unsubSettings();
      unsubTeachers();
      unsubTeacherPayments();
      unsubTeacherClassLogs();
      unsubGalleryFolders();
      unsubOrders();
      unsubSales();
      unsubPaymentMethods();
      unsubPurchaseOrders();
    };
  }, [user]);

  // Test connection
  useEffect(() => {
    if (user) {
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if(error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration. ");
          }
        }
      };
      testConnection();
    }
  }, [user]);

  // --- Navigation Helpers ---
  const navigateTo = (screen: Screen, id?: string) => {
    setHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
    if (id) {
      if (screen === 'student-detail') setSelectedStudentId(id);
      if (screen === 'product-detail') setSelectedProductId(id);
    }
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentScreen(prev);
    }
  };

  // --- Calculations ---
  const stats = useMemo(() => {
    const now = new Date();
    const startOfCurrMonth = startOfMonth(now);
    const endOfCurrMonth = endOfMonth(now);

    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && isWithinInterval(parseISO(t.date), { start: startOfCurrMonth, end: endOfCurrMonth }))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = transactions
      .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: startOfCurrMonth, end: endOfCurrMonth }))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);

    const overdueStudents = students.filter(s => 
      s.status === 'Ativo' && s.payments.some(p => p.status === 'pending' && parseISO(p.dueDate) < now)
    ).length;

    const activeCount = students.filter(s => s.status === 'Ativo').length;
    const inactiveCount = students.filter(s => s.status === 'Inativo').length;
    const churnRate = students.length > 0 ? (inactiveCount / students.length) * 100 : 0;

    const upcomingDebts = transactions.filter(t => 
      t.type === 'expense' && 
      parseISO(t.date) > now && 
      parseISO(t.date) <= subDays(now, -5)
    );

    return { monthlyIncome, monthlyExpense, totalBalance, overdueStudents, churnRate, upcomingDebts, activeCount };
  }, [transactions, students]);

  // --- Components ---

  const LogoCropper = () => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleSave = async () => {
      if (imageToCrop && croppedAreaPixels) {
        try {
          const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
          if (croppedImage) {
            await handleUpdateSettings({ logoUrl: croppedImage });
            setIsCropping(false);
            setImageToCrop(null);
          }
        } catch (error) {
          console.error("Error cropping image:", error);
        }
      }
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 w-full max-w-lg rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl"
        >
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-white font-bold">Ajustar Logo</h3>
            <button onClick={() => setIsCropping(false)} className="p-2 text-zinc-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="relative h-80 bg-zinc-950">
            <Cropper
              image={imageToCrop || ''}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              cropShape="round"
              showGrid={false}
            />
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500 font-bold uppercase">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCropping(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Salvar Logo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const Header = () => {
    const logoInputRef = React.useRef<HTMLInputElement>(null);

    return (
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 z-50 justify-between">
        <div className="flex items-center">
          {history.length > 0 && (
            <button onClick={goBack} className="mr-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => logoInputRef.current?.click()}
              className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform group relative"
            >
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
                  <Shield className="w-5 h-5" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Edit2 className="w-4 h-4 text-white" />
              </div>
              <input 
                type="file" 
                ref={logoInputRef}
                onChange={handleLogoChange}
                className="hidden" 
                accept="image/*"
              />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              {currentScreen === 'home' && (settings?.academyName || 'CT LG Fight')}
              {currentScreen === 'students' && 'Alunos'}
              {currentScreen === 'store' && 'Loja'}
              {currentScreen === 'finance' && 'Financeiro'}
              {currentScreen === 'student-detail' && 'Perfil do Aluno'}
              {currentScreen === 'product-detail' && 'Detalhes do Produto'}
              {currentScreen === 'ranks' && 'Graduações'}
              {currentScreen === 'registration-center' && 'Cadastros e Backup'}
              {currentScreen === 'academy-gallery' && 'Galeria da Academia'}
              {currentScreen === 'categories' && 'Categorias Financeiras'}
              {currentScreen === 'partners' && 'Parceiros'}
              {currentScreen === 'relationships-center' && 'Central de Relacionamentos'}
              {currentScreen === 'teachers' && 'Professores'}
              {currentScreen === 'teacher-payments' && 'Pagamento de Professores'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title={isDarkMode ? "Modo Dia" : "Modo Noite"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
    );
  };

  const TabBar = () => (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center px-1 z-50 pb-safe">
      <TabItem icon={<Home />} label="Home" active={currentScreen === 'home'} color="text-blue-500" onClick={() => setCurrentScreen('home')} />
      <TabItem icon={<ShoppingBag />} label="Loja" active={currentScreen === 'store'} color="text-emerald-500" onClick={() => setCurrentScreen('store')} />
      <TabItem icon={<Package />} label="Estoque" active={currentScreen === 'inventory'} color="text-cyan-500" onClick={() => setCurrentScreen('inventory')} />
      <TabItem icon={<DollarSign />} label="Financeiro" active={currentScreen === 'finance'} color="text-amber-500" onClick={() => setCurrentScreen('finance')} />
      <TabItem icon={<CreditCard />} label="Relacionamentos" active={currentScreen === 'relationships-center'} color="text-indigo-500" onClick={() => setCurrentScreen('relationships-center')} />
      <TabItem icon={<Search />} label="Galeria" active={currentScreen === 'academy-gallery'} color="text-purple-500" onClick={() => setCurrentScreen('academy-gallery')} />
      <TabItem icon={<Plus />} label="Cadastros" active={currentScreen === 'registration-center'} color="text-rose-500" onClick={() => setCurrentScreen('registration-center')} />
    </nav>
  );

  const TabItem = ({ icon, label, active, color, onClick }: { icon: React.ReactNode, label: string, active: boolean, color: string, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-16 rounded-xl transition-all min-w-0 group",
        active ? "bg-zinc-100 dark:bg-zinc-800/50" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
      )}
    >
      <div className={cn(
        "transition-all duration-300",
        color,
        active ? "opacity-100 scale-110" : "opacity-40 grayscale-[0.5]"
      )}>
        {React.cloneElement(icon as React.ReactElement, { 
          className: "w-5 h-5 mb-1"
        })}
      </div>
      <span className={cn(
        "text-[8px] font-bold uppercase tracking-tight truncate w-full px-0.5 transition-colors",
        active ? color : "text-zinc-500"
      )}>
        {label}
      </span>
    </button>
  );

  const RegistrationCenter = () => (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => navigateTo('students')}
          className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-blue-500/50 transition-all group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Alunos</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerenciar cadastro de alunos e mensalidades</p>
          </div>
        </button>

        <button 
          onClick={() => navigateTo('supplier-management')}
          className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-emerald-500/50 transition-all group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <Truck className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Fornecedores</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerenciar fornecedores da loja</p>
          </div>
        </button>

        <button 
          onClick={() => navigateTo('partners')}
          className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-orange-500/50 transition-all group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Parceiros</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerenciar parceiros e patrocinadores</p>
          </div>
        </button>

        <button 
          onClick={() => navigateTo('ranks')}
          className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-purple-500/50 transition-all group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform">
            <Shield className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Central de Graduação</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Configurar faixas e graus por modalidade</p>
          </div>
        </button>

        <button 
          onClick={() => navigateTo('categories')}
          className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-indigo-500/50 transition-all group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <Filter className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Categorias</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerenciar categorias de despesas e receitas</p>
          </div>
        </button>

        <button 
          onClick={() => navigateTo('payment-methods')}
          className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-blue-500/50 transition-all group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Formas de Pagamento</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerenciar chaves Pix e métodos de pagamento</p>
          </div>
        </button>

        <button 
          onClick={() => navigateTo('product-management')}
          className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-emerald-500/50 transition-all group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Produtos</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerenciar produtos e cadastros</p>
          </div>
        </button>

        <button 
          onClick={() => navigateTo('teachers')}
          className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-red-500/50 transition-all group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Professores</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerenciar cadastro e pagamentos de professores</p>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigateTo('backups')}
            className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-blue-500/50 transition-all group shadow-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-zinc-900 dark:text-white font-bold text-sm">Backup</h3>
            </div>
          </button>

          <button 
            onClick={() => {}} // Relatórios logic can be added later or linked to existing ones
            className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-emerald-500/50 transition-all group shadow-xl"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-zinc-900 dark:text-white font-bold text-sm">Relatórios</h3>
            </div>
          </button>
        </div>

        <button 
          onClick={() => navigateTo('settings')}
          className="flex items-center gap-6 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] hover:border-zinc-500/50 transition-all group shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-500/10 dark:bg-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:scale-110 transition-transform">
            <SettingsIcon className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Configurações</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Personalizar nome e logo da academia</p>
          </div>
        </button>
      </div>
    </div>
  );

  const generateWhatsAppMessage = (student: Student, payment: MonthlyPayment, paymentMethod?: PaymentMethod) => {
    let message = `Olá ${student.name}, sua mensalidade de R$ ${payment.amount.toLocaleString()} vence no dia ${payment.dueDate}.`;
    if (paymentMethod) {
      message += `\n\nForma de pagamento: ${paymentMethod.name}\nChave: ${paymentMethod.key}`;
    }
    const url = `https://wa.me/${student.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const generatePaymentPDF = (student: Student, payment: MonthlyPayment) => {
    const doc = new jsPDF();
    doc.text(`Recibo de Mensalidade - ${student.name}`, 14, 20);
    (doc as any).autoTable({
      head: [['Descrição', 'Valor']],
      body: [
        ['Mensalidade', `R$ ${payment.amount.toLocaleString()}`],
        ['Data de Vencimento', payment.dueDate],
      ],
      startY: 30,
    });
    doc.save(`recibo_${student.name}_${payment.dueDate}.pdf`);
  };

  const PaymentMethods = () => {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [notification, setNotification] = useState<string | null>(null);

    return (
      <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {notification && (
          <div className="fixed bottom-4 right-4 bg-zinc-900 text-white p-4 rounded-xl shadow-lg z-50">
            {notification}
          </div>
        )}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Formas de Pagamento</h2>
          <button onClick={() => navigateTo('registration-center')} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            Voltar
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Adicionar Nova Chave Pix</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nome (ex: Pix Pessoal)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
            />
            <input
              type="text"
              placeholder="Chave Pix"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
            />
            <button
              onClick={() => {
                if (name && key) {
                  handleAddPaymentMethod({ name, key, type: 'Pix' });
                  setName('');
                  setKey('');
                }
              }}
              className="w-full p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              Salvar Chave Pix
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">{method.name}</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">{method.key}</p>
              </div>
              <button
                onClick={() => handleDeletePaymentMethod(method.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RelationshipsCenter = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<{ studentId: string, payment: MonthlyPayment } | null>(null);
    const [receivedAmount, setReceivedAmount] = useState<number>(0);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
    const [isAutomaticMessage, setIsAutomaticMessage] = useState(true);
    const [notification, setNotification] = useState<string | null>(null);

    const now = new Date();

    const pendingSales = sales.filter(s => s.status === 'pending');

    const peopleWithPending = useMemo(() => {
      const people: Record<string, {
        id: string;
        name: string;
        type: 'student' | 'partner' | 'teacher' | 'client';
        pendingPayments: MonthlyPayment[];
        pendingSales: Sale[];
        isOverdue: boolean;
      }> = {};

      // Add students with pending payments
      students.forEach(s => {
        const pendingPayments = s.payments.filter(p => p.status === 'pending');
        if (pendingPayments.length > 0) {
          people[s.id] = {
            id: s.id,
            name: s.name,
            type: 'student',
            pendingPayments,
            pendingSales: [],
            isOverdue: pendingPayments.some(p => parseISO(p.dueDate) < now)
          };
        }
      });

      // Add pending sales
      pendingSales.forEach(sale => {
        const item = sale.items[0];
        if (!item) return;
        
        // Use buyerId if available, otherwise fallback to payerName or a generic ID
        const personId = item.buyerId || sale.payerName || `sale-${sale.id}`;
        const personType = item.buyerType || 'client';

        if (!people[personId]) {
          let name = sale.payerName || (item.buyerName) || 'N/A';
          if (personType === 'student' && item.buyerId) {
            name = students.find(s => s.id === item.buyerId)?.name || name;
          }
          people[personId] = {
            id: personId,
            name,
            type: personType,
            pendingPayments: [],
            pendingSales: [],
            isOverdue: false
          };
        }
        people[personId].pendingSales.push(sale);
      });

      return Object.values(people);
    }, [students, pendingSales]);

    const filteredPeople = useMemo(() => {
      return peopleWithPending.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOverdue = !showOverdueOnly || p.isOverdue;
        return matchesSearch && matchesOverdue;
      });
    }, [peopleWithPending, searchTerm, showOverdueOnly]);

    return (
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all shadow-xl"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowOverdueOnly(!showOverdueOnly)}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                showOverdueOnly 
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800"
              )}
            >
              <AlertCircle className="w-4 h-4" />
              {showOverdueOnly ? 'Mostrando Atrasados' : 'Filtrar Atrasados'}
            </button>
            <button
              onClick={() => setIsAutomaticMessage(!isAutomaticMessage)}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                isAutomaticMessage 
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800"
              )}
            >
              <MessageCircle className="w-4 h-4" />
              {isAutomaticMessage ? 'Mensagem Automática' : 'Mensagem Manual'}
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredPeople.map(person => (
            <div key={person.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-zinc-900 dark:text-white font-bold">{person.name}</h3>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold">{person.type}</p>
                  </div>
                </div>
                {person.isOverdue && (
                  <span className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase px-2 py-1 rounded-lg">Atrasado</span>
                )}
              </div>

              {person.pendingPayments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Mensalidades</h4>
                  {person.pendingPayments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                      <div>
                        <p className="text-zinc-900 dark:text-white text-sm font-bold">{payment.month}/{payment.year}</p>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold">{payment.modality} • Vence {format(parseISO(payment.dueDate), 'dd/MM')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-zinc-900 dark:text-white font-bold text-sm">R$ {payment.amount}</p>
                        <select 
                          value={selectedPaymentMethodId}
                          onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                          className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-[10px] font-bold"
                        >
                          <option value="">Sem método</option>
                          {paymentMethods.map(method => (
                            <option key={method.id} value={method.id}>{method.name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => {
                            const student = students.find(s => s.id === person.id);
                            if (!student) return;
                            const method = paymentMethods.find(m => m.id === selectedPaymentMethodId);
                            
                            const message = `Olá ${student.name}, sua mensalidade de R$ ${payment.amount.toLocaleString()} vence no dia ${payment.dueDate}. ${method ? `\n\nForma de pagamento: ${method.name}\nChave: ${method.key}` : ''}`;
                            
                            if (isAutomaticMessage) {
                              const url = `https://wa.me/${student.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                              window.open(url, '_blank');
                            } else {
                              navigator.clipboard.writeText(message);
                              setNotification('Mensagem copiada para a área de transferência!');
                              setTimeout(() => setNotification(null), 3000);
                            }
                          }}
                          className="p-2 bg-green-500 text-white rounded-lg shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all"
                          title="Cobrar via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPayment({ studentId: person.id, payment });
                            setReceivedAmount(payment.amount);
                          }}
                          className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all"
                          title="Baixar Mensalidade"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {person.pendingSales.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Vendas</h4>
                  {person.pendingSales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                      <div>
                        <p className="text-zinc-900 dark:text-white text-sm font-bold">Venda {sale.saleNumber}</p>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold">{format(parseISO(sale.createdAt), 'dd/MM/yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-zinc-900 dark:text-white font-bold text-sm">R$ {sale.finalAmount.toLocaleString()}</p>
                        <button
                          onClick={() => handleMarkSaleAsPaid(sale)}
                          className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all"
                          title="Baixar Venda"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredPeople.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <p className="text-zinc-900 dark:text-white font-bold">Tudo em dia!</p>
              <p className="text-zinc-500 text-sm">Nenhum recebimento pendente encontrado.</p>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        <AnimatePresence>
          {selectedPayment && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPayment(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl"
              >
                <h3 className="text-zinc-900 dark:text-white text-xl font-bold mb-2">Receber Mensalidade</h3>
                <p className="text-zinc-500 text-sm mb-6">
                  Confirmando pagamento de {selectedPayment.payment.month}/{selectedPayment.payment.year} para {students.find(s => s.id === selectedPayment.studentId)?.name}.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Valor Recebido (R$)</label>
                    <input 
                      type="number" 
                      value={receivedAmount}
                      onChange={e => setReceivedAmount(parseFloat(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-zinc-900 dark:text-white font-bold text-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {receivedAmount !== selectedPayment.payment.amount && (
                    <div className={cn(
                      "p-4 rounded-2xl text-xs font-bold flex items-start gap-3",
                      receivedAmount > selectedPayment.payment.amount ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                    )}>
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>
                        {receivedAmount > selectedPayment.payment.amount 
                          ? `O valor é maior que a mensalidade (R$ ${selectedPayment.payment.amount}). Um CRÉDITO de R$ ${(receivedAmount - selectedPayment.payment.amount).toLocaleString()} será gerado para o aluno.`
                          : `O valor é menor que a mensalidade (R$ ${selectedPayment.payment.amount}). Um DÉBITO de R$ ${(selectedPayment.payment.amount - receivedAmount).toLocaleString()} será gerado para o aluno.`
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setSelectedPayment(null)}
                      className="flex-1 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        handleReceivePayment(selectedPayment.studentId, selectedPayment.payment.id, receivedAmount);
                        setSelectedPayment(null);
                      }}
                      className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const TeachersList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredTeachers = teachers.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button 
            onClick={goBack}
            className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Professores</h2>
          <button 
            onClick={() => {
              setEditingTeacher(null);
              setIsTeacherFormOpen(true);
            }}
            className="p-2 bg-red-500 text-white rounded-full shadow-lg shadow-red-500/20 hover:bg-red-400 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setCurrentScreen('teachers')}
            className={cn(
              "py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border",
              currentScreen === 'teachers' ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent" : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
            )}
          >
            Lista
          </button>
          <button 
            onClick={() => setCurrentScreen('teacher-payments')}
            className={cn(
              "py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border",
              currentScreen === 'teacher-payments' ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent" : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
            )}
          >
            Pagamentos
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar professor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-all shadow-xl"
          />
        </div>

        <div className="grid gap-4">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between group hover:border-red-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-bold text-lg">{teacher.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {teacher.modalities.map(m => (
                      <span key={m} className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-md">{m}</span>
                    ))}
                  </div>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold mt-1">
                    {teacher.paymentType === 'per-class' && 'Por Aula'}
                    {teacher.paymentType === 'weekly' && 'Semanal'}
                    {teacher.paymentType === 'bi-weekly' && 'Quinzenal'}
                    {teacher.paymentType === 'monthly' && 'Mensal'}
                    {' • R$ ' + teacher.paymentAmount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingTeacher(teacher);
                    setIsTeacherFormOpen(true);
                  }}
                  className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TeacherPaymentsCenter = () => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [classCount, setClassCount] = useState<number>(1);
    const [periodStart, setPeriodStart] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [periodEnd, setPeriodEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');

    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

    const handleTeacherChange = (id: string) => {
      setSelectedTeacherId(id);
      const teacher = teachers.find(t => t.id === id);
      if (teacher) {
        if (teacher.paymentType === 'per-class') {
          setClassCount(1);
          setAmount(teacher.paymentAmount);
        } else {
          setAmount(teacher.paymentAmount);
        }
      }
    };

    const handleClassCountChange = (count: number) => {
      setClassCount(count);
      if (selectedTeacher && selectedTeacher.paymentType === 'per-class') {
        setAmount(selectedTeacher.paymentAmount * count);
      }
    };

    const calculateFromLogs = () => {
      if (!selectedTeacherId) return;
      const logs = teacherClassLogs.filter(l => 
        l.teacherId === selectedTeacherId && 
        l.date >= periodStart && 
        l.date <= periodEnd
      );
      const totalClasses = logs.reduce((sum, l) => sum + l.classCount, 0);
      const totalAmount = logs.reduce((sum, l) => sum + (l.classCount * l.rate), 0);
      
      setClassCount(totalClasses);
      setAmount(totalAmount);
      setNotes(`Calculado automaticamente: ${totalClasses} aulas no período.`);
    };

    const sortedPayments = [...teacherPayments].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    return (
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button 
            onClick={goBack}
            className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Pagamentos</h2>
          <button 
            onClick={() => navigateTo('teacher-class-control')}
            className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            title="Controle de Aulas"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setCurrentScreen('teachers')}
            className={cn(
              "py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border",
              currentScreen === 'teachers' ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent" : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
            )}
          >
            Lista
          </button>
          <button 
            onClick={() => setCurrentScreen('teacher-payments')}
            className={cn(
              "py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border",
              currentScreen === 'teacher-payments' ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent" : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800"
            )}
          >
            Pagamentos
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-900 dark:text-white font-bold">Novo Pagamento</h3>
            {selectedTeacherId && (
              <button 
                onClick={calculateFromLogs}
                className="text-[10px] font-black uppercase px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                Calcular por Aulas
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Professor</label>
              <select 
                value={selectedTeacherId}
                onChange={e => handleTeacherChange(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-red-500"
              >
                <option value="">Selecionar Professor</option>
                {teachers.filter(t => t.active).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Início Período</label>
                <input 
                  type="date"
                  value={periodStart}
                  onChange={e => setPeriodStart(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Fim Período</label>
                <input 
                  type="date"
                  value={periodEnd}
                  onChange={e => setPeriodEnd(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {selectedTeacher?.paymentType === 'per-class' && (
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Quantidade de Aulas</label>
                <input 
                  type="number"
                  min="1"
                  value={classCount}
                  onChange={e => handleClassCountChange(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-red-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1 italic">
                  Valor por aula: R$ {selectedTeacher.paymentAmount.toLocaleString()}
                </p>
              </div>
            )}

            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Valor Total (R$)</label>
              <input 
                type="number"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Observações</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-red-500 h-20"
                placeholder="Ex: Pagamento referente a 10 aulas..."
              />
            </div>

            <button 
              onClick={async () => {
                if (!selectedTeacherId || amount <= 0) return;
                await handlePayTeacher({
                  teacherId: selectedTeacherId,
                  amount,
                  date: new Date().toISOString(),
                  periodStart,
                  periodEnd,
                  status: 'paid',
                  notes,
                  classCount: selectedTeacher?.paymentType === 'per-class' ? classCount : undefined
                });
                setNotes('');
                setSelectedTeacherId('');
                setAmount(0);
                setClassCount(1);
              }}
              className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 hover:bg-red-500 transition-all"
            >
              Confirmar Pagamento
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-zinc-900 dark:text-white font-bold px-1">Histórico Recente</h3>
          <div className="grid gap-3">
            {sortedPayments.map(payment => {
              const teacher = teachers.find(t => t.id === payment.teacherId);
              return (
                <div key={payment.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-between">
                  <div>
                    <h4 className="text-zinc-900 dark:text-white font-bold text-sm">{teacher?.name || 'Professor Removido'}</h4>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold">
                      {format(parseISO(payment.periodStart), 'dd/MM')} - {format(parseISO(payment.periodEnd), 'dd/MM')}
                      {payment.classCount && ` • ${payment.classCount} aulas`}
                    </p>
                    {payment.notes && <p className="text-zinc-400 text-[9px] italic mt-1">{payment.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-red-500 font-bold text-sm">- R$ {payment.amount.toLocaleString()}</p>
                    <p className="text-zinc-400 text-[10px]">{format(parseISO(payment.date), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const TeacherForm = () => {
    const [formData, setFormData] = useState<Omit<Teacher, 'id'>>(
      editingTeacher ? { ...editingTeacher } : {
        name: '',
        phone: '',
        modalities: [],
        paymentType: 'monthly',
        paymentAmount: 0,
        active: true
      }
    );

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingTeacher) {
        await handleUpdateTeacher(editingTeacher.id, formData);
      } else {
        await handleAddTeacher(formData);
      }
      setIsTeacherFormOpen(false);
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsTeacherFormOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-8 sm:hidden" />
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-8 tracking-tight">
            {editingTeacher ? 'Editar Professor' : 'Novo Professor'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Telefone / WhatsApp (Opcional)</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Modalidades</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(Modality).map(modality => (
                    <button
                      key={modality}
                      type="button"
                      onClick={() => {
                        const isRemoving = formData.modalities.includes(modality);
                        const newModalities = isRemoving
                          ? formData.modalities.filter(m => m !== modality)
                          : [...formData.modalities, modality];
                        
                        const newRates = { ...(formData.modalityRates || {}) };
                        if (isRemoving) {
                          delete newRates[modality];
                        }
                        
                        setFormData({ ...formData, modalities: newModalities, modalityRates: newRates });
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                        formData.modalities.includes(modality)
                          ? "bg-red-500 text-white border-transparent"
                          : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                      )}
                    >
                      {modality}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Tipo de Pagamento</label>
                  <select 
                    value={formData.paymentType}
                    onChange={e => setFormData({ ...formData, paymentType: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-all"
                  >
                    <option value="per-class">Por Aula</option>
                    <option value="weekly">Semanal</option>
                    <option value="bi-weekly">Quinzenal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Valor Base (R$)</label>
                  <input 
                    type="number" 
                    required
                    value={isNaN(formData.paymentAmount) || formData.paymentAmount === 0 ? '' : formData.paymentAmount}
                    onChange={e => setFormData({ ...formData, paymentAmount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
              </div>

              {formData.paymentType === 'per-class' && formData.modalities.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Valor por Modalidade (Opcional)</label>
                  <p className="text-[10px] text-zinc-400 mb-2 italic">Se não preenchido, será usado o Valor Base.</p>
                  {formData.modalities.map(modality => (
                    <div key={modality} className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{modality}</span>
                      <div className="relative w-32">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">R$</span>
                        <input 
                          type="number" 
                          value={formData.modalityRates?.[modality] || ''}
                          onChange={e => {
                            const newRates = { ...(formData.modalityRates || {}) };
                            const val = parseFloat(e.target.value);
                            if (isNaN(val)) {
                              delete newRates[modality];
                            } else {
                              newRates[modality] = val;
                            }
                            setFormData({ ...formData, modalityRates: newRates });
                          }}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-10 pr-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 transition-all text-sm"
                          placeholder={formData.paymentAmount.toString()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <input 
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-zinc-900 dark:text-white font-bold text-sm">Professor Ativo</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setIsTeacherFormOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20"
              >
                {editingTeacher ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  const PartnersList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredPartners = partners.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentScreen('registration')}
            className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Parceiros</h2>
          <button 
            onClick={() => {
              setEditingPartner(null);
              setIsPartnerFormOpen(true);
            }}
            className="p-2 bg-orange-500 text-white rounded-full shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar parceiro..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500 transition-all shadow-xl"
          />
        </div>

        <div className="grid gap-4">
          {filteredPartners.map(partner => (
            <div key={partner.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between group hover:border-orange-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-bold text-lg">{partner.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">{partner.type}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs">{partner.contact}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingPartner(partner);
                    setIsPartnerFormOpen(true);
                  }}
                  className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDeletePartner(partner.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CategoriesManager = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'income' | 'expense'>('expense');

    const handleAdd = async () => {
      if (!newName.trim()) return;
      await handleAddCategory({ name: newName.trim(), type: newType });
      setNewName('');
      setIsAdding(false);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentScreen('registration')}
            className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Categorias</h2>
          <button 
            onClick={() => setIsAdding(true)}
            className="p-2 bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4"
          >
            <div className="space-y-2">
              <label className="text-zinc-500 text-xs font-bold uppercase">Nome da Categoria</label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="Ex: Aluguel, Venda de Kimono..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-zinc-500 text-xs font-bold uppercase">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setNewType('income')}
                  className={cn(
                    "py-3 rounded-xl text-sm font-bold transition-all",
                    newType === 'income' ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  )}
                >
                  Receita
                </button>
                <button 
                  onClick={() => setNewType('expense')}
                  className={cn(
                    "py-3 rounded-xl text-sm font-bold transition-all",
                    newType === 'expense' ? "bg-red-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  )}
                >
                  Despesa
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAdd}
                className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid gap-4">
          {['income', 'expense'].map(type => (
            <div key={type} className="space-y-3">
              <h3 className="text-zinc-500 text-xs font-bold uppercase px-2">
                {type === 'income' ? 'Receitas' : 'Despesas'}
              </h3>
              <div className="grid gap-2">
                {categories.filter(c => c.type === type).map(category => (
                  <div key={category.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group">
                    <span className="text-zinc-900 dark:text-white font-medium">{category.name}</span>
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {categories.filter(c => c.type === type).length === 0 && (
                  <p className="text-zinc-500 text-xs italic px-2">Nenhuma categoria cadastrada.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AcademyGallery = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [googlePhotosLink, setGooglePhotosLink] = useState('');
    const [imageFolderId, setImageFolderId] = useState<string>('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleAddAcademyImage({
        url: url || googlePhotosLink,
        description,
        createdAt: new Date().toISOString(),
        folderId: imageFolderId || undefined
      });
      setUrl('');
      setDescription('');
      setGooglePhotosLink('');
      setImageFolderId('');
      setIsAdding(false);
    };

    const handleAddFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      handleAddGalleryFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    };

    const filteredImages = selectedFolderId 
      ? academyGallery.filter(img => img.folderId === selectedFolderId)
      : academyGallery;

    return (
      <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-zinc-900 dark:text-white font-bold text-xl">Fotos da Academia</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddingFolder(!isAddingFolder)}
              className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isAddingFolder && (
          <form onSubmit={handleAddFolder} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] space-y-4 shadow-2xl">
            <div>
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Nome da Pasta</label>
              <input 
                required
                type="text" 
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Treinos 2024"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20"
            >
              Criar Pasta
            </button>
          </form>
        )}

        {isAdding && (
          <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] space-y-4 shadow-2xl">
            <div className="space-y-4">
              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Upload da Galeria</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="gallery-upload"
                  />
                  <label 
                    htmlFor="gallery-upload"
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-zinc-500 dark:text-zinc-400 text-sm flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:text-blue-500 transition-all"
                  >
                    {url ? (
                      <img src={url} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <>
                        <Plus className="w-8 h-8 mb-2" />
                        <span>Toque para escolher foto</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-200 dark:border-zinc-800"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-50 dark:bg-zinc-900 px-2 text-zinc-500 dark:text-zinc-400">Ou use um link</span>
                </div>
              </div>

              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Link do Google Fotos / URL</label>
                <input 
                  type="url" 
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={googlePhotosLink}
                  onChange={(e) => setGooglePhotosLink(e.target.value)}
                  placeholder="https://photos.google.com/..."
                />
              </div>

              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Pasta (Opcional)</label>
                <select 
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={imageFolderId}
                  onChange={(e) => setImageFolderId(e.target.value)}
                >
                  <option value="">Nenhuma pasta</option>
                  {galleryFolders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Descrição (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Treino de BJJ"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={!url && !googlePhotosLink}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar Foto
            </button>
          </form>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setSelectedFolderId(null)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
              selectedFolderId === null 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            )}
          >
            Todas
          </button>
          {galleryFolders.map(folder => (
            <div key={folder.id} className="relative group flex-shrink-0">
              <button 
                onClick={() => setSelectedFolderId(folder.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2",
                  selectedFolderId === folder.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                )}
              >
                <Folder className="w-3 h-3" />
                {folder.name}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Deseja excluir esta pasta? As fotos não serão excluídas.')) {
                    handleDeleteGalleryFolder(folder.id);
                    if (selectedFolderId === folder.id) setSelectedFolderId(null);
                  }
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2 h-2" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredImages.map(img => (
            <div key={img.id} className="group relative aspect-square rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
              <img 
                src={img.url} 
                alt={img.description} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                {img.description && <p className="text-white text-xs font-medium mb-2">{img.description}</p>}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDeleteAcademyImage(img.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <select 
                    className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                    value={img.folderId || ''}
                    onChange={(e) => {
                      const newFolderId = e.target.value;
                      updateDoc(doc(db, 'academy_gallery', img.id), { folderId: newFolderId || deleteField() });
                    }}
                  >
                    <option value="" className="text-zinc-900">Mover para...</option>
                    {galleryFolders.map(f => (
                      <option key={f.id} value={f.id} className="text-zinc-900">{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
          {filteredImages.length === 0 && (
            <div className="col-span-2 py-20 text-center">
              <Package className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">Nenhuma foto encontrada nesta pasta.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BackupCenter = () => {
    const [importing, setImporting] = useState(false);

    const handleExport = () => {
      const data = {
        students,
        products,
        suppliers,
        transactions,
        ranks,
        academyGallery,
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-ctlgfight-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!confirm('Atenção: A importação irá adicionar os dados do arquivo ao banco de dados atual. Deseja continuar?')) return;

      setImporting(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          // Import logic
          if (data.students) {
            for (const s of data.students) {
              const { id, ...rest } = s;
              await addDoc(collection(db, 'students'), rest);
            }
          }
          if (data.products) {
            for (const p of data.products) {
              const { id, ...rest } = p;
              await addDoc(collection(db, 'products'), rest);
            }
          }
          if (data.suppliers) {
            for (const s of data.suppliers) {
              const { id, ...rest } = s;
              await addDoc(collection(db, 'suppliers'), rest);
            }
          }
          if (data.transactions) {
            for (const t of data.transactions) {
              const { id, ...rest } = t;
              await addDoc(collection(db, 'transactions'), rest);
            }
          }
          if (data.ranks) {
            for (const r of data.ranks) {
              const { id, ...rest } = r;
              await addDoc(collection(db, 'ranks'), rest);
            }
          }
          if (data.academyGallery) {
            for (const img of data.academyGallery) {
              const { id, ...rest } = img;
              await addDoc(collection(db, 'academyGallery'), rest);
            }
          }

          alert('Importação concluída com sucesso!');
        } catch (error) {
          console.error('Import error:', error);
          alert('Erro ao importar dados. Verifique o formato do arquivo.');
        } finally {
          setImporting(false);
        }
      };
      reader.readAsText(file);
    };

    return (
      <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-zinc-900 dark:text-white font-bold text-xl">Central de Backups</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">Gerencie a segurança dos seus dados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleExport}
              className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500/50 transition-all group rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Download className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-zinc-900 dark:text-white font-bold text-sm">Exportar Backup</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[10px]">Baixar todos os dados em JSON</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-zinc-400 dark:text-zinc-600 rotate-180" />
            </button>

            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="backup-import"
                disabled={importing}
              />
              <label 
                htmlFor="backup-import"
                className={cn(
                  "flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500/50 transition-all group cursor-pointer rounded-2xl",
                  importing && "opacity-50 cursor-wait"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-zinc-900 dark:text-white font-bold text-sm">{importing ? 'Importando...' : 'Importar Backup'}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[10px]">Restaurar dados de um arquivo</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-zinc-400 dark:text-zinc-600 rotate-180" />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-zinc-900 dark:text-white font-bold text-xl">Relatórios</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">Visualize o desempenho da academia</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-purple-500/50 transition-all group rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Filter className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-zinc-900 dark:text-white font-bold text-sm">Relatório Financeiro</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[10px]">Gerar PDF personalizado</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-zinc-400 dark:text-zinc-600 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RanksManager = () => {
    const [modality, setModality] = useState<Modality>(Modality.JIU_JITSU);
    const [name, setName] = useState('');
    const [order, setOrder] = useState(1);
    const [maxDegrees, setMaxDegrees] = useState(0);

    useEffect(() => {
      if (editingRank) {
        setModality(editingRank.modality as Modality);
        setName(editingRank.name);
        setOrder(editingRank.order);
        setMaxDegrees(editingRank.maxDegrees || 0);
      } else {
        setName('');
        setOrder(ranks.filter(r => r.modality === modality).length + 1);
        setMaxDegrees(0);
      }
    }, [editingRank, modality, ranks]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingRank) {
        await handleUpdateRank(editingRank.id, { modality, name, order, maxDegrees });
        setEditingRank(null);
      } else {
        await handleAddRank({ modality, name, order, maxDegrees });
      }
      setName('');
      setOrder(ranks.filter(r => r.modality === modality).length + 1);
      setMaxDegrees(0);
    };

    const filteredRanks = ranks.filter(r => r.modality === modality).sort((a, b) => a.order - b.order);

    return (
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h3 className="text-zinc-900 dark:text-white text-xl font-bold mb-6">Central de Graduações</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Modalidade</label>
                <select 
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={modality}
                  onChange={(e) => setModality(e.target.value as Modality)}
                >
                  <option value={Modality.JIU_JITSU}>Jiu-Jitsu</option>
                  <option value={Modality.MUAY_THAI}>Muay Thai</option>
                  <option value={Modality.MMA}>MMA</option>
                </select>
              </div>
              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">
                  {modality === Modality.MUAY_THAI ? 'Prajied (Cor)' : modality === Modality.MMA ? 'Categoria' : 'Nome da Faixa'}
                </label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={modality === Modality.MUAY_THAI ? "Ex: Vermelho" : modality === Modality.MMA ? "Ex: Peso Leve" : "Ex: Azul"}
                />
              </div>
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold w-full mb-1">Sugestões:</span>
              {(modality === Modality.JIU_JITSU ? BJJ_RANKS : modality === Modality.MUAY_THAI ? MUAY_THAI_RANKS : MMA_RANKS).map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setName(suggestion)}
                  className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-[10px] hover:bg-zinc-200 dark:hover:bg-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Ordem de Progressão</label>
                <input 
                  required
                  type="number" 
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Graus Máximos</label>
                <input 
                  type="number" 
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={maxDegrees}
                  onChange={(e) => setMaxDegrees(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {editingRank && (
                <button 
                  type="button"
                  onClick={() => setEditingRank(null)}
                  className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 font-bold text-sm"
                >
                  Cancelar
                </button>
              )}
              <button 
                type="submit"
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20"
              >
                {editingRank ? 'Salvar Alterações' : `Adicionar ${modality === Modality.MUAY_THAI ? 'Prajied' : modality === Modality.MMA ? 'Categoria' : 'Faixa'}`}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest">
                {modality === Modality.MUAY_THAI ? 'Prajieds' : modality === Modality.MMA ? 'Categorias' : 'Faixas'}: {modality}
              </h4>
              <span className="text-zinc-600 dark:text-zinc-500 text-[10px] font-bold uppercase">
                {filteredRanks.length} {modality === Modality.MUAY_THAI ? 'prajieds' : modality === Modality.MMA ? 'categorias' : 'faixas'}
              </span>
            </div>
            
            {filteredRanks.map(rank => (
              <div key={rank.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 font-bold text-xs border border-zinc-200 dark:border-zinc-800">
                    {rank.order}
                  </div>
                  <div>
                    <p className="text-zinc-900 dark:text-white font-bold">{rank.name}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-tighter">
                      {rank.maxDegrees ? `${rank.maxDegrees} Graus Máximos` : 'Sem Graus'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingRank(rank)}
                    className="p-2 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteRank(rank.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {filteredRanks.length === 0 && (
              <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <AlertCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm italic">Nenhuma faixa cadastrada para {modality}.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  function Dashboard({ 
    setEditingSaleId, 
    setView, 
    setSaleItems, 
    setSaleNumber, 
    setPayerName, 
    handleDeleteSale 
  }: any) {
    const chartData = [
      { name: 'Entradas', value: stats.monthlyIncome, color: '#10b981' },
      { name: 'Saídas', value: stats.monthlyExpense, color: '#ef4444' }
    ];

    const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
    const [selectedBirthdayStudent, setSelectedBirthdayStudent] = useState<Student | null>(null);
    const [selectedCardUrl, setSelectedCardUrl] = useState<string | null>(null);
    const [birthdayMessage, setBirthdayMessage] = useState('');

    const today = new Date();
    const todayStr = format(today, 'MM-dd');
    const thisWeekStart = startOfWeek(today);
    const thisWeekEnd = endOfWeek(today);
    const thisMonth = today.getMonth();

    const birthdaysToday = students.filter(s => s.birthDate && format(parseISO(s.birthDate), 'MM-dd') === todayStr);
    const birthdaysThisWeek = students.filter(s => {
      if (!s.birthDate) return false;
      const bDay = parseISO(s.birthDate);
      const bDayThisYear = new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate());
      return bDayThisYear >= thisWeekStart && bDayThisYear <= thisWeekEnd && format(bDayThisYear, 'MM-dd') !== todayStr;
    });
    const birthdaysThisMonth = students.filter(s => {
      if (!s.birthDate) return false;
      const bDay = parseISO(s.birthDate);
      return bDay.getMonth() === thisMonth && 
             format(new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate()), 'MM-dd') !== todayStr &&
             !(new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate()) >= thisWeekStart && new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate()) <= thisWeekEnd);
    });

    const handleSendBirthdayMessage = (student: Student) => {
      const message = birthdayMessage || `Parabéns, ${student.name}! 🥋🎂 Desejamos a você muita saúde, paz e muitos treinos! Oss!`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/55${student.phone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
      setIsBirthdayModalOpen(false);
      setBirthdayMessage('');
    };

    const generateBirthdayMessage = (student: Student) => {
      const messages = [
        `Parabéns, ${student.name}! 🥋🎂 Desejamos a você muita saúde, paz e muitos treinos! Oss!`,
        `Feliz aniversário, ${student.name}! Que seu novo ciclo seja repleto de vitórias dentro e fora do tatame! 🥋✨`,
        `Grande dia, ${student.name}! Parabéns pelo seu aniversário! Continue treinando firme e evoluindo sempre. Oss! 🥋🎂`,
        `Parabéns pelo seu dia, ${student.name}! Muita saúde e muitos anos de vida. Nos vemos no treino! 🥋🎈`
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setBirthdayMessage(randomMessage);
    };

    const injuredCount = students.filter(s => s.status === 'Lesionado').length;
    const pendingPurchaseOrders = purchaseOrders.filter(o => o.status !== 'received');

    return (
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Vertical Cards */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between transition-colors">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-1">Caixa Atual</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">R$ {stats.totalBalance.toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between transition-colors">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-1">Balanço Mensal</p>
              <p className={cn(
                "text-3xl font-bold",
                stats.monthlyIncome - stats.monthlyExpense >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
              )}>
                R$ {(stats.monthlyIncome - stats.monthlyExpense).toLocaleString()}
              </p>
            </div>
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
              stats.monthlyIncome - stats.monthlyExpense >= 0 ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" : "bg-red-500/10 text-red-500 dark:text-red-400"
            )}>
              {stats.monthlyIncome - stats.monthlyExpense >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
            </div>
          </div>

          <button 
            onClick={() => setCurrentScreen('relationships-center')}
            className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between text-left hover:border-red-500/50 transition-all group"
          >
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-1">Alunos em Atraso</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.overdueStudents}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform relative">
              <Users className="w-8 h-8" />
              {stats.overdueStudents > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                  {stats.overdueStudents}
                </span>
              )}
            </div>
          </button>

          <button 
            onClick={() => navigateTo('injured-students')}
            className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between text-left hover:border-orange-500/50 transition-all group"
          >
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-1">Alunos Lesionados</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{injuredCount}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform">
              <Activity className="w-8 h-8" />
            </div>
          </button>

          {/* Lista de Compras Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl transition-colors">
            <h3 className="text-zinc-900 dark:text-white font-bold mb-6 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-500" />
              Lista de Compras
            </h3>
            <div className="space-y-3">
              {pendingPurchaseOrders.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4 italic">Nenhum pedido pendente.</p>
              ) : (
                pendingPurchaseOrders.map(order => {
                  const product = products.find(p => p.id === order.productId);
                  const supplier = suppliers.find(s => s.id === order.supplierId);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                      <div>
                        <p className="text-zinc-900 dark:text-white font-bold text-sm">{product?.name || 'Produto não encontrado'}</p>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold">{supplier?.name || 'Fornecedor não encontrado'} • Qtd: {order.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingPurchaseOrder(order);
                            setIsPurchaseOrderFormOpen(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar Pedido"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePurchaseOrder(order.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir Pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Lista de Vendas Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl transition-colors">
            <h3 className="text-zinc-900 dark:text-white font-bold mb-6 flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2 text-emerald-500" />
              Lista de Vendas
            </h3>
            <div className="space-y-3">
              {sales.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4 italic">Nenhuma venda registrada.</p>
              ) : (
                sales.slice(0, 5).map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                    <div>
                      <p className="text-zinc-900 dark:text-white font-bold text-sm">{sale.saleNumber}</p>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">R$ {sale.finalAmount.toFixed(2)} • {format(parseISO(sale.createdAt), 'dd/MM HH:mm')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingSaleId(sale.id);
                          setView(sale.type);
                          setSaleItems(sale.items);
                          setSaleNumber(sale.saleNumber);
                          setPayerName(sale.payerName || '');
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Editar Venda"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteSale(sale)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir Venda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-between transition-colors">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-1">Taxa de Churn</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.churnRate.toFixed(1)}%</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
              <TrendingDown className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Aniversariantes */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl transition-colors">
          <h3 className="text-zinc-900 dark:text-white font-bold mb-6 flex items-center">
            <Cake className="w-5 h-5 mr-2 text-pink-500" />
            Aniversariantes
          </h3>
          
          <div className="space-y-6">
            {/* Hoje */}
            {birthdaysToday.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Hoje 🎂</p>
                <div className="grid gap-3">
                  {birthdaysToday.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-pink-500/5 dark:bg-pink-500/10 rounded-2xl border border-pink-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 font-bold">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="text-zinc-900 dark:text-white font-bold text-sm">{s.name}</p>
                          <p className="text-zinc-500 text-[10px] uppercase font-bold">{s.category}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedBirthdayStudent(s);
                          setIsBirthdayModalOpen(true);
                        }}
                        className="p-2 bg-white dark:bg-zinc-800 rounded-xl text-emerald-500 border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Esta Semana */}
            {birthdaysThisWeek.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Esta Semana</p>
                <div className="flex flex-wrap gap-2">
                  {birthdaysThisWeek.map(s => (
                    <div key={s.id} className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">{s.name}</span>
                      <span className="text-[10px] text-zinc-400">{format(parseISO(s.birthDate), 'dd/MM')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Este Mês */}
            {birthdaysThisMonth.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Este Mês</p>
                <div className="flex flex-wrap gap-2">
                  {birthdaysThisMonth.map(s => (
                    <div key={s.id} className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{s.name}</span>
                      <span className="text-[10px] text-zinc-400">{format(parseISO(s.birthDate), 'dd/MM')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {birthdaysToday.length === 0 && birthdaysThisWeek.length === 0 && birthdaysThisMonth.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-4 italic">Nenhum aniversariante este mês.</p>
            )}
          </div>
        </div>

        {/* Modal Seleção de Cartão */}
        <AnimatePresence>
          {isBirthdayModalOpen && selectedBirthdayStudent && (
            <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBirthdayModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
                <h3 className="text-zinc-900 dark:text-white text-xl font-bold mb-2">Enviar Parabéns</h3>
                <p className="text-zinc-500 text-sm mb-6">Selecione um cartão da galeria para enviar para {selectedBirthdayStudent.name}</p>

                <div className="space-y-6">
                  <div>
                    <label className="text-zinc-500 text-[10px] font-bold uppercase mb-2 block tracking-wider">Mensagem</label>
                    <div className="relative">
                      <textarea 
                        value={birthdayMessage}
                        onChange={(e) => setBirthdayMessage(e.target.value)}
                        placeholder={`Parabéns, ${selectedBirthdayStudent.name}! 🥋🎂...`}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none h-32"
                      />
                      <button 
                        onClick={() => generateBirthdayMessage(selectedBirthdayStudent)}
                        className="absolute bottom-3 right-3 p-2 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-all"
                        title="Gerar mensagem automática"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Gallery removed */}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsBirthdayModalOpen(false)}
                      className="flex-1 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => handleSendBirthdayMessage(selectedBirthdayStudent)}
                      className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Enviar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h3 className="text-zinc-900 dark:text-white font-bold mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
            Fluxo Mensal
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#27272a" : "#e5e7eb"} vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agenda Financeira */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl transition-colors">
          <h3 className="text-zinc-900 dark:text-white font-bold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
            Próximos Débitos (5 dias)
          </h3>
          <div className="space-y-3">
            {stats.upcomingDebts.length > 0 ? (
              stats.upcomingDebts.map(debt => (
                <div key={debt.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                  <div>
                    <p className="text-zinc-900 dark:text-white text-sm font-medium">{debt.description}</p>
                    <p className="text-zinc-500 text-xs">{format(parseISO(debt.date), 'dd/MM')}</p>
                  </div>
                  <p className="text-red-500 dark:text-red-400 font-bold">- R$ {debt.amount}</p>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-sm text-center py-4 italic">Nenhum débito próximo.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const InjuredStudents = () => {
    const injuredStudents = students.filter(s => s.status === 'Lesionado');

    const handleSendSupportMessage = (student: Student) => {
      const message = `Olá, ${student.name}! 🥋 Passando para saber como você está e como está sua recuperação. Melhoras e esperamos você de volta aos treinos em breve! Oss!`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/55${student.phone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
    };

    return (
      <div className="space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Alunos Lesionados</h2>
            <p className="text-zinc-500 text-sm">Acompanhamento de recuperação</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-3">
          {injuredStudents.length > 0 ? (
            injuredStudents.map(student => (
              <div 
                key={student.id}
                className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center mr-4 text-white font-bold text-lg shadow-inner">
                    {student.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-zinc-900 dark:text-white font-bold">{student.name}</p>
                    <p className="text-zinc-500 text-xs">{student.phone}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleSendSupportMessage(student)}
                  className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 transition-all"
                  title="Enviar mensagem de apoio"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                <Activity className="w-8 h-8" />
              </div>
              <p className="text-zinc-500 font-medium">Nenhum aluno lesionado no momento.</p>
              <p className="text-zinc-400 text-xs mt-1">Que bom! Todos estão treinando forte.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const StudentsList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleAddStudent = () => {
      setEditingStudent(null);
      setIsStudentFormOpen(true);
    };

    return (
      <div className="space-y-4 pb-24">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar aluno..."
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {filteredStudents.map(student => (
            <button 
              key={student.id}
              onClick={() => navigateTo('student-detail', student.id)}
              className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <div className="flex items-center">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mr-4 text-white font-bold text-lg shadow-inner",
                  student.modalities.includes(Modality.JIU_JITSU) && student.modalities.length === 1 ? "bg-blue-600 shadow-blue-500/20" :
                  student.modalities.includes(Modality.MUAY_THAI) && student.modalities.length === 1 ? "bg-red-600 shadow-red-500/20" :
                  student.modalities.includes(Modality.MMA) && student.modalities.length === 1 ? "bg-emerald-600 shadow-emerald-500/20" :
                  "bg-gradient-to-br from-blue-600 via-red-600 to-emerald-600"
                )}>
                  {student.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-zinc-900 dark:text-white font-bold">{student.name}</p>
                  <div className="flex gap-1 mt-1 flex-wrap items-center">
                    <span className={cn(
                      "text-[8px] px-1.5 py-0.5 rounded uppercase font-black border",
                      student.category === 'Adult' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-pink-500/10 text-pink-500 border-pink-500/20"
                    )}>
                      {student.category === 'Adult' ? 'Adulto' : 'Kids'}
                    </span>
                    {student.modalities.map(m => (
                      <span key={m} className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded uppercase font-black",
                        m === Modality.JIU_JITSU ? "bg-blue-500/20 text-blue-500 dark:text-blue-400" : 
                        m === Modality.MUAY_THAI ? "bg-red-500/20 text-red-500 dark:text-red-400" : 
                        "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400"
                      )}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-full",
                  student.status === 'Ativo' ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400" : 
                  student.status === 'Inativo' ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400" :
                  "bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 dark:text-orange-400"
                )}>
                  {student.status}
                </p>
                {student.payments.some(p => p.status === 'pending') && (
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mt-2 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={handleAddStudent}
          className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all z-40"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>
    );
  };

  const DatePicker = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? parseISO(value) : new Date());
    const [view, setView] = useState<'days' | 'years'>('days');
    const [inputValue, setInputValue] = useState(value ? format(parseISO(value), 'dd/MM/yyyy') : '');

    const years = useMemo(() => Array.from({ length: 101 }, (_, i) => getYear(new Date()) - i), []);

    const handleInputChange = (val: string) => {
      // Remove all non-digits
      let digits = val.replace(/\D/g, '');
      
      // Limit to 8 digits (DDMMYYYY)
      if (digits.length > 8) digits = digits.slice(0, 8);
      
      // Format with slashes
      let formatted = '';
      if (digits.length > 0) {
        formatted += digits.slice(0, 2);
        if (digits.length > 2) {
          formatted += '/' + digits.slice(2, 4);
          if (digits.length > 4) {
            formatted += '/' + digits.slice(4, 8);
          }
        }
      }
      
      setInputValue(formatted);
      
      if (digits.length === 8) {
        const d = parseInt(digits.slice(0, 2));
        const m = parseInt(digits.slice(2, 4));
        const y = parseInt(digits.slice(4, 8));
        
        if (d > 0 && d <= 31 && m > 0 && m <= 12 && y > 1900) {
          const date = new Date(y, m - 1, d);
          if (!isNaN(date.getTime())) {
            onChange(format(date, 'yyyy-MM-dd'));
            setViewDate(date);
          }
        }
      }
    };

    const days = useMemo(() => {
      const start = startOfWeek(startOfMonth(viewDate));
      const end = endOfWeek(endOfMonth(viewDate));
      return eachDayOfInterval({ start, end });
    }, [viewDate]);

    return (
      <div className="relative">
        <label className="text-zinc-500 text-xs font-bold uppercase mb-2 flex items-center gap-2">
          {label === 'Data de Nascimento' ? <Cake className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
          {label}
        </label>
        <div className="relative group">
          <input 
            type="text" 
            placeholder="DD/MM/AAAA"
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl z-[120] min-w-[280px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <button 
                    type="button"
                    onClick={() => setView(view === 'days' ? 'years' : 'days')}
                    className="text-zinc-900 dark:text-white font-bold text-sm hover:text-blue-500 transition-colors flex items-center gap-1"
                  >
                    {view === 'days' ? (
                      <>
                        {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
                        <ChevronRight className="w-3 h-3 rotate-90" />
                      </>
                    ) : (
                      <>
                        Selecionar Ano
                        <ChevronRight className="w-3 h-3 -rotate-90" />
                      </>
                    )}
                  </button>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setViewDate(addMonths(viewDate, -1))}
                      className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setViewDate(addMonths(viewDate, 1))}
                      className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {view === 'days' ? (
                  <>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-zinc-400 uppercase">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {days.map(day => (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => {
                            onChange(format(day, 'yyyy-MM-dd'));
                            setInputValue(format(day, 'dd/MM/yyyy'));
                            setIsOpen(false);
                          }}
                          className={cn(
                            "aspect-square flex items-center justify-center text-xs rounded-lg transition-all",
                            !isSameMonth(day, viewDate) ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                            value && isSameDay(day, parseISO(value)) && "bg-blue-600 text-white font-bold hover:bg-blue-700"
                          )}
                        >
                          {format(day, 'd')}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                    {years.map(year => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          setViewDate(setYear(viewDate, year));
                          setView('days');
                        }}
                        className={cn(
                          "py-2 text-xs rounded-lg transition-all",
                          getYear(viewDate) === year ? "bg-blue-600 text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const STUDENT_DEFAULTS: Partial<Student> = {
    name: '',
    phone: '',
    entryDate: format(new Date(), 'yyyy-MM-dd'),
    paymentDay: 10,
    modalities: [],
    status: 'Ativo',
    bjjRank: 'Branca',
    bjjDegrees: 0,
    muayThaiRank: 'Branco',
    mmaRank: 'Iniciante',
    graduationHistory: [],
    payments: [],
    birthDate: '2000-01-01',
    monthlyFees: {},
    category: 'Adult'
  };

  const StudentForm = () => {
    const [formData, setFormData] = useState<Partial<Student>>(
      editingStudent ? { ...STUDENT_DEFAULTS, ...editingStudent } : STUDENT_DEFAULTS
    );

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name || !formData.phone || !formData.paymentDay || isNaN(formData.paymentDay as number)) {
        return;
      }

      // Clean up optional fields that might be empty strings
      const dataToSave = { ...formData };
      if (!dataToSave.birthDate) delete dataToSave.birthDate;
      if (!dataToSave.photoUrl) delete dataToSave.photoUrl;

      // Clean up monthlyFees undefined values
      if (dataToSave.monthlyFees) {
        const cleanFees = { ...dataToSave.monthlyFees };
        Object.keys(cleanFees).forEach(key => {
          if (cleanFees[key as Modality] === undefined) {
            delete cleanFees[key as Modality];
          }
        });
        dataToSave.monthlyFees = cleanFees;
      }

      try {
        if (editingStudent) {
          await updateDoc(doc(db, 'students', editingStudent.id), dataToSave);
        } else {
          const studentRef = doc(collection(db, 'students'));
          const newStudent = {
            ...dataToSave,
            id: studentRef.id,
            graduationHistory: [],
            payments: [],
            status: 'Ativo'
          };
          await setDoc(studentRef, newStudent);
        }
        setIsStudentFormOpen(false);
        setEditingStudent(null);
      } catch (error) {
        handleFirestoreError(error, editingStudent ? OperationType.UPDATE : OperationType.CREATE, 'students');
      }
    };

    const handleModalityToggle = (modality: Modality) => {
      const mods = formData.modalities || [];
      const fees = formData.monthlyFees || {};
      
      if (mods.includes(modality)) {
        setFormData(prev => ({
          ...prev,
          modalities: mods.filter(m => m !== modality),
          monthlyFees: { ...fees, [modality]: undefined }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          modalities: [...mods, modality],
          monthlyFees: { ...fees, [modality]: 150 }
        }));
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsStudentFormOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
          <h3 className="text-zinc-900 dark:text-white text-xl font-bold mb-6">{editingStudent ? 'Editar Aluno' : 'Novo Aluno'}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Status</label>
              <div className="flex gap-2">
                {(['Ativo', 'Inativo', 'Lesionado'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: st }))}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all border",
                      formData.status === st
                        ? st === 'Ativo' ? "bg-emerald-600 text-white border-transparent" :
                          st === 'Inativo' ? "bg-zinc-600 text-white border-transparent" :
                          "bg-orange-600 text-white border-transparent"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-blue-500/50"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Categoria</label>
              <div className="flex gap-2">
                {(['Adult', 'Kids'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all border",
                      formData.category === cat
                        ? "bg-blue-600 text-white border-transparent"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-blue-500/50"
                    )}
                  >
                    {cat === 'Adult' ? 'Adulto' : 'Kids'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Nome Completo</label>
              <input 
                required
                type="text" 
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Telefone (WhatsApp)</label>
              <input 
                required
                type="tel" 
                placeholder="Ex: 5511999999999"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DatePicker 
                  label="Data de Nascimento"
                  value={formData.birthDate || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, birthDate: val }))}
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Dia de Pagamento</label>
                <input 
                  required
                  type="number" 
                  min="1" max="31"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={formData.paymentDay === undefined || isNaN(formData.paymentDay as number) ? '' : formData.paymentDay}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, paymentDay: val }));
                  }}
                />
              </div>
            </div>

            <div>
              <DatePicker 
                label="Data de Entrada"
                value={formData.entryDate || ''}
                onChange={(val) => setFormData(prev => ({ ...prev, entryDate: val }))}
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Modalidades e Mensalidades</label>
              <div className="space-y-3">
                {[Modality.JIU_JITSU, Modality.MUAY_THAI, Modality.MMA].map(mod => (
                  <div key={mod} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-zinc-900 dark:text-white text-sm cursor-pointer min-w-[100px]">
                      <input 
                        type="checkbox" 
                        className={cn(
                          "w-5 h-5 rounded border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:ring-blue-500/50",
                          mod === Modality.JIU_JITSU ? "text-blue-600" : mod === Modality.MUAY_THAI ? "text-red-600" : "text-emerald-600"
                        )}
                        checked={formData.modalities?.includes(mod)}
                        onChange={() => handleModalityToggle(mod)}
                      />
                      {mod}
                    </label>
                    {formData.modalities?.includes(mod) && (
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-zinc-500 text-xs">R$</span>
                        <input 
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-zinc-900 dark:text-white text-sm focus:outline-none"
                          value={formData.monthlyFees?.[mod] === undefined ? '' : formData.monthlyFees[mod]}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              monthlyFees: { ...prev.monthlyFees, [mod]: val }
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {formData.modalities?.includes(Modality.JIU_JITSU) && (
              <div className="grid grid-cols-2 gap-3 p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/10 dark:border-blue-500/20">
                <div className="col-span-2">
                  <p className="text-blue-400 text-[10px] font-black uppercase mb-2">Graduação Jiu-Jitsu</p>
                </div>
                <div>
                  <label className="text-zinc-500 text-[10px] font-bold uppercase mb-1 block">Faixa</label>
                  <select 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none"
                    value={formData.bjjRank}
                    onChange={(e) => setFormData(prev => ({ ...prev, bjjRank: e.target.value as any }))}
                  >
                    {ranks.filter(r => r.modality === Modality.JIU_JITSU).length > 0 ? (
                      ranks.filter(r => r.modality === Modality.JIU_JITSU).sort((a,b) => a.order - b.order).map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                    ) : (
                      BJJ_RANKS.map(r => <option key={r} value={r}>{r}</option>)
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-500 text-[10px] font-bold uppercase mb-1 block">Graus</label>
                  <input 
                    type="number" 
                    min="0" max={ranks.find(r => r.name === formData.bjjRank && r.modality === Modality.JIU_JITSU)?.maxDegrees || 4}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none"
                    value={formData.bjjDegrees}
                    onChange={(e) => setFormData(prev => ({ ...prev, bjjDegrees: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            )}

            {formData.modalities?.includes(Modality.MUAY_THAI) && (
              <div className="p-4 bg-red-500/5 dark:bg-red-500/10 rounded-2xl border border-red-500/10 dark:border-red-500/20">
                <p className="text-red-400 text-[10px] font-black uppercase mb-2">Graduação Muay Thai</p>
                <div>
                  <label className="text-zinc-500 text-[10px] font-bold uppercase mb-1 block">Prajied (Cor)</label>
                  <select 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none"
                    value={formData.muayThaiRank}
                    onChange={(e) => setFormData(prev => ({ ...prev, muayThaiRank: e.target.value as any }))}
                  >
                    {ranks.filter(r => r.modality === Modality.MUAY_THAI).length > 0 ? (
                      ranks.filter(r => r.modality === Modality.MUAY_THAI).sort((a,b) => a.order - b.order).map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                    ) : (
                      MUAY_THAI_RANKS.map(r => <option key={r} value={r}>{r}</option>)
                    )}
                  </select>
                </div>
              </div>
            )}

            {formData.modalities?.includes(Modality.MMA) && (
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/10 dark:border-emerald-500/20">
                <p className="text-emerald-400 text-[10px] font-black uppercase mb-2">Graduação MMA</p>
                <div>
                  <label className="text-zinc-500 text-[10px] font-bold uppercase mb-1 block">Categoria</label>
                  <select 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none"
                    value={formData.mmaRank}
                    onChange={(e) => setFormData(prev => ({ ...prev, mmaRank: e.target.value as any }))}
                  >
                    {ranks.filter(r => r.modality === Modality.MMA).length > 0 ? (
                      ranks.filter(r => r.modality === Modality.MMA).sort((a,b) => a.order - b.order).map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                    ) : (
                      MMA_RANKS.map(r => <option key={r} value={r}>{r}</option>)
                    )}
                  </select>
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button 
                type="button"
                onClick={() => setIsStudentFormOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20"
              >
                Salvar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  const StudentDetail = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return null;

    const handleTogglePayment = async (paymentId: string) => {
      try {
        const payment = student.payments.find(p => p.id === paymentId);
        if (!payment) return;

        const isPaid = payment.status === 'paid';
        const updatedPayments = student.payments.map(p => 
          p.id === paymentId 
            ? { ...p, status: isPaid ? 'pending' : 'paid', paymentDate: isPaid ? undefined : new Date().toISOString() } 
            : p
        );
        await updateDoc(doc(db, 'students', student.id), { payments: updatedPayments });

        // If it was just paid, create a transaction
        if (!isPaid) {
          await addDoc(collection(db, 'transactions'), {
            description: `Mensalidade ${payment.month}/${payment.year} - ${student.name}`,
            amount: payment.amount,
            type: 'income',
            date: new Date().toISOString(),
            category: 'Mensalidade',
            studentId: student.id
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `students/${student.id}`);
      }
    };

    const handleDeletePayment = async (paymentId: string) => {
      try {
        const updatedPayments = student.payments.filter(p => p.id !== paymentId);
        await updateDoc(doc(db, 'students', student.id), { payments: updatedPayments });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `students/${student.id}`);
      }
    };

    const handleAddGraduation = async (newGrad: Graduation) => {
      try {
        const updatedStudentData: any = {
          graduationHistory: [newGrad, ...student.graduationHistory]
        };
        
        // Find rank in dynamic ranks first
        const rankObj = ranks.find(r => r.name === newGrad.rank);
        const modality = rankObj ? rankObj.modality : (
          BJJ_RANKS.includes(newGrad.rank) ? Modality.JIU_JITSU :
          MUAY_THAI_RANKS.includes(newGrad.rank) ? Modality.MUAY_THAI :
          Modality.MMA
        );
        
        if (modality === Modality.JIU_JITSU) {
          updatedStudentData.bjjRank = newGrad.rank;
          updatedStudentData.bjjDegrees = newGrad.degree || 0;
        } else if (modality === Modality.MUAY_THAI) {
          updatedStudentData.muayThaiRank = newGrad.rank;
        } else if (modality === Modality.MMA) {
          updatedStudentData.mmaRank = newGrad.rank;
        }

        await updateDoc(doc(db, 'students', student.id), updatedStudentData);
        setIsGraduationModalOpen(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `students/${student.id}`);
      }
    };

    const handleGeneratePayments = async () => {
      const currentMonth = format(new Date(), 'MMMM', { locale: ptBR });
      const currentYear = new Date().getFullYear();
      
      const newPayments: MonthlyPayment[] = student.modalities.map(mod => ({
        id: Math.random().toString(36).substr(2, 9),
        month: currentMonth,
        year: currentYear,
        amount: student.monthlyFees[mod] || 0,
        status: 'pending',
        dueDate: format(new Date(currentYear, new Date().getMonth(), student.paymentDay), 'yyyy-MM-dd'),
        modality: mod
      }));

      const filteredNewPayments = newPayments.filter(np => 
        !student.payments.some(p => p.month === np.month && p.year === np.year && p.modality === np.modality)
      );

      if (filteredNewPayments.length === 0) return;

      try {
        await updateDoc(doc(db, 'students', student.id), {
          payments: [...filteredNewPayments, ...student.payments]
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `students/${student.id}`);
      }
    };

    return (
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Profile Header */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-b-[3rem] border-b border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
          <div className={cn(
            "w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-3xl shadow-xl",
            student.modalities.includes(Modality.JIU_JITSU) && student.modalities.length === 1 ? "bg-blue-600 shadow-blue-500/20" :
            student.modalities.includes(Modality.MUAY_THAI) && student.modalities.length === 1 ? "bg-red-600 shadow-red-500/20" :
            student.modalities.includes(Modality.MMA) && student.modalities.length === 1 ? "bg-emerald-600 shadow-emerald-500/20" :
            "bg-gradient-to-br from-blue-600 via-red-600 to-emerald-600"
          )}>
            {student.name.charAt(0)}
          </div>
          <h2 className="text-zinc-900 dark:text-white text-2xl font-bold mb-1">{student.name}</h2>
          <div className="flex justify-center gap-2 mb-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
              student.category === 'Adult' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-pink-500/10 text-pink-500 border-pink-500/20"
            )}>
              {student.category === 'Adult' ? 'Adulto' : 'Kids'}
            </span>
            <div className="relative">
              <select
                value={student.status}
                onChange={async (e) => {
                  try {
                    await updateDoc(doc(db, 'students', student.id), { status: e.target.value });
                  } catch (error) {
                    handleFirestoreError(error, OperationType.UPDATE, `students/${student.id}`);
                  }
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border appearance-none cursor-pointer text-center pr-8",
                  student.status === 'Ativo' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                  student.status === 'Inativo' ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" :
                  "bg-orange-500/10 text-orange-500 border-orange-500/20"
                )}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Lesionado">Lesionado</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 mb-4">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm uppercase tracking-widest font-bold">Desde {format(parseISO(student.entryDate), 'MMMM yyyy', { locale: ptBR })}</p>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs">
              <Cake className="w-3 h-3" />
              <span>{format(parseISO(student.birthDate), 'dd/MM/yyyy')} ({differenceInYears(new Date(), parseISO(student.birthDate))} anos)</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {Object.entries(student.monthlyFees).map(([mod, fee]) => (
              <div key={mod} className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-black uppercase",
                  mod === Modality.JIU_JITSU ? "text-blue-600 dark:text-blue-400" : mod === Modality.MUAY_THAI ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                )}>{mod}</span>
                <span className="text-zinc-900 dark:text-white text-xs font-bold">R$ {fee}</span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-6 px-4">
            <a 
              href={`https://wa.me/${student.phone}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <button 
              onClick={() => {
                setEditingStudent(student);
                setIsStudentFormOpen(true);
              }}
              className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold text-sm border border-zinc-200 dark:border-zinc-700 shadow-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
            <button 
              onClick={async () => {
                try {
                  await deleteDoc(doc(db, 'students', student.id));
                  setCurrentScreen('students');
                } catch (error) {
                  handleFirestoreError(error, OperationType.DELETE, `students/${student.id}`);
                }
              }}
              className="flex items-center gap-2 bg-red-600/10 dark:bg-red-600/20 text-red-500 dark:text-red-400 px-4 py-2 rounded-xl font-bold text-sm border border-red-500/20 dark:border-red-500/30 hover:bg-red-600/20 dark:hover:bg-red-600/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </div>

        {/* Graduation Section */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h3 className="text-zinc-900 dark:text-white font-bold mb-4">Graduação Atual</h3>
          <div className="space-y-4">
            {student.modalities.includes(Modality.JIU_JITSU) && (
              <div className="p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/30 rounded-2xl">
                <p className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase mb-2">Jiu-Jitsu (BJJ)</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-6 w-16 rounded border border-zinc-200 dark:border-zinc-700",
                      student.bjjRank === 'Branca' ? "bg-white dark:bg-zinc-100" :
                      student.bjjRank === 'Azul' ? "bg-blue-600" :
                      student.bjjRank === 'Roxa' ? "bg-purple-600" :
                      student.bjjRank === 'Marrom' ? "bg-amber-900" :
                      student.bjjRank === 'Preta' ? "bg-zinc-950" :
                      "bg-zinc-100 dark:bg-zinc-900"
                    )} />
                    <span className="text-zinc-900 dark:text-white font-bold">{student.bjjRank}</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(ranks.find(r => r.name === student.bjjRank && r.modality === Modality.JIU_JITSU)?.maxDegrees || 4)].map((_, i) => (
                      <div key={i} className={cn(
                        "w-2 h-6 rounded-sm",
                        i < student.bjjDegrees ? "bg-blue-600 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"
                      )} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {student.modalities.includes(Modality.MUAY_THAI) && (
              <div className="p-4 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/30 rounded-2xl">
                <p className="text-red-500 dark:text-red-400 text-xs font-bold uppercase mb-2">Muay Thai (Prajied)</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-600" />
                    <span className="text-zinc-900 dark:text-white font-bold">{student.muayThaiRank}</span>
                  </div>
                </div>
              </div>
            )}
            {student.modalities.includes(Modality.MMA) && (
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl">
                <p className="text-emerald-400 text-xs font-bold uppercase mb-2">MMA (Categoria)</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-600" />
                    <span className="text-zinc-900 dark:text-white font-bold">{student.mmaRank}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Graduation History */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h3 className="text-zinc-900 dark:text-white font-bold mb-4">Histórico de Graduações</h3>
          <div className="space-y-3">
            {student.graduationHistory.length > 0 ? (
              student.graduationHistory.map((grad, idx) => (
                <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-900 dark:text-white text-sm font-bold">{grad.rank} {grad.degree ? `(${grad.degree}º Grau)` : ''}</span>
                    <span className="text-zinc-500 dark:text-zinc-500 text-[10px]">{format(parseISO(grad.date), 'dd/MM/yyyy')}</span>
                  </div>
                  {grad.notes && <p className="text-zinc-500 dark:text-zinc-400 text-xs italic">{grad.notes}</p>}
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-xs text-center py-4 italic">Nenhum registro histórico.</p>
            )}
            <button 
              onClick={() => setIsGraduationModalOpen(true)}
              className="w-full py-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-500 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Registrar Graduação
            </button>
          </div>
        </div>

        {/* Financial Section */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-zinc-900 dark:text-white font-bold">Financeiro</h3>
              <div className="flex flex-col gap-1 mt-1">
                {Object.entries(student.monthlyFees).map(([mod, fee]) => (
                  <div key={mod} className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                    <span className={cn(
                      mod === Modality.JIU_JITSU ? "text-blue-600 dark:text-blue-400" : mod === Modality.MUAY_THAI ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>{mod}:</span>
                    <span className="text-zinc-900 dark:text-white">R$ {(fee as number)?.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 text-[10px] font-bold uppercase border-t border-zinc-100 dark:border-zinc-800 pt-1 mt-1">
                  <CreditCard className="w-3 h-3" />
                  <span>Total: R$ {(Object.values(student.monthlyFees) as number[]).reduce((sum, fee) => sum + (fee || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 text-xs block mb-2">Vence dia {student.paymentDay}</span>
              <button 
                onClick={handleGeneratePayments}
                className="bg-blue-600/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border border-blue-500/20 hover:bg-blue-600/20 transition-colors"
              >
                Gerar Mensalidades
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {student.payments.map(payment => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-10 rounded-full",
                    payment.modality === Modality.JIU_JITSU ? "bg-blue-600" : 
                    payment.modality === Modality.MUAY_THAI ? "bg-red-600" : 
                    "bg-emerald-600"
                  )} />
                  <div>
                    <p className="text-zinc-900 dark:text-white text-sm font-medium">{payment.month} {payment.year}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold">{payment.modality} • R$ {payment.amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleTogglePayment(payment.id)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                      payment.status === 'paid' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" : "bg-red-500/10 text-red-600 dark:text-red-500"
                    )}
                  >
                    {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                  </button>
                  <div className="flex gap-1">
                    <select 
                      onChange={(e) => {
                        const method = paymentMethods.find(m => m.id === e.target.value);
                        generateWhatsAppMessage(student, payment, method);
                      }}
                      className="text-[10px] p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="">WhatsApp (Sem método)</option>
                      {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button 
                      onClick={() => generatePaymentPDF(student, payment)}
                      className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
                      title="Gerar PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeletePayment(payment.id)}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {isGraduationModalOpen && (
            <GraduationModal 
              student={student} 
              onClose={() => setIsGraduationModalOpen(false)} 
              onSave={handleAddGraduation}
            />
          )}
        </AnimatePresence>
      </div>
    );
  };

  const InventoryScreen = () => {
    const [filterSupplier, setFilterSupplier] = useState<string>('all');
    
    const filteredOrders = filterSupplier === 'all' 
      ? purchaseOrders 
      : purchaseOrders.filter(o => o.supplierId === filterSupplier);

    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Estoque & Pedidos</h1>
        </div>

        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-6">
          <button
            onClick={() => setInventoryTab('stock')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              inventoryTab === 'stock' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <Package className="w-4 h-4" />
            Estoque Atual
          </button>
          <button
            onClick={() => setInventoryTab('orders')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              inventoryTab === 'orders' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            Pedidos de Compra
          </button>
        </div>

          {inventoryTab === 'stock' && (
            <div className="grid gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center shadow-sm">
                  <div>
                    <h3 className="text-zinc-900 dark:text-white font-bold">{product.name}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Estoque: {product.stock} / Mín: {product.minStock}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingPurchaseOrder(null);
                      setIsPurchaseOrderFormOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Novo Pedido
                  </button>
                </div>
              ))}
            </div>
          )}

          {inventoryTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <select
                  value={filterSupplier}
                  onChange={e => setFilterSupplier(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto shadow-sm"
                >
                  <option value="all">Todos os Fornecedores</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setEditingPurchaseOrder(null);
                    setIsPurchaseOrderFormOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shadow-sm"
                >
                  <Plus size={18} />
                  Novo Pedido
                </button>
              </div>
              
              {filteredOrders.length === 0 ? (
                <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                  Nenhum pedido de compra encontrado.
                </div>
              ) : (
                filteredOrders.map(order => {
                  const supplier = suppliers.find(s => s.id === order.supplierId);
                  const product = products.find(p => p.id === order.productId);
                  const progress = order.totalValue ? Math.min(100, Math.round(((order.amountPaid || 0) / order.totalValue) * 100)) : 0;
                  
                  return (
                    <div key={order.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-zinc-900 dark:text-white font-bold">{product?.name || 'Produto Desconhecido'}</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Fornecedor: {supplier?.name || 'Desconhecido'}</p>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Data: {order.createdAt ? format(parseISO(order.createdAt), 'dd/MM/yyyy') : '-'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingPurchaseOrder(order);
                              setIsPurchaseOrderFormOpen(true);
                            }}
                            className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
                                handleDeletePurchaseOrder(order.id);
                              }
                            }}
                            className="p-2 bg-zinc-100 dark:bg-zinc-800 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Quantidade</p>
                          <p className="text-zinc-900 dark:text-white font-medium">{order.quantity}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Status</p>
                          <p className="text-zinc-900 dark:text-white font-medium capitalize">
                            {order.status === 'pending' ? 'Pendente' : order.status === 'ordered' ? 'Encomendado' : 'Recebido'}
                          </p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Valor Total</p>
                          <p className="text-zinc-900 dark:text-white font-medium">
                            {order.totalValue ? `R$ ${order.totalValue.toFixed(2)}` : '-'}
                          </p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Vencimento</p>
                          <p className="text-zinc-900 dark:text-white font-medium">
                            {order.dueDate ? format(parseISO(order.dueDate), 'dd/MM/yyyy') : '-'}
                          </p>
                        </div>
                      </div>

                      {order.totalValue && order.totalValue > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-zinc-500 dark:text-zinc-400">Progresso do Pagamento</span>
                            <span className="text-zinc-900 dark:text-white font-bold">{progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs mt-2">
                            <span className="text-zinc-500 dark:text-zinc-400">Pago: R$ {(order.amountPaid || 0).toFixed(2)}</span>
                            <span className="text-zinc-500 dark:text-zinc-400">Restante: R$ {(order.totalValue - (order.amountPaid || 0)).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
      </div>
    );
  };

  const PurchaseOrderForm = () => {
    const [formData, setFormData] = useState<Partial<PurchaseOrder>>(
      editingPurchaseOrder || {
        supplierId: '',
        productId: '',
        quantity: 1,
        status: 'pending',
        createdAt: new Date().toISOString(),
        totalValue: 0,
        dueDate: '',
        amountPaid: 0
      }
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingPurchaseOrder) {
        handleUpdatePurchaseOrder(formData as PurchaseOrder);
      } else {
        handleAddPurchaseOrder(formData as Omit<PurchaseOrder, 'id'>);
      }
      setIsPurchaseOrderFormOpen(false);
      setEditingPurchaseOrder(null);
    };

    return (
      <div className="fixed inset-0 bg-zinc-900/50 dark:bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {editingPurchaseOrder ? 'Editar Pedido' : 'Novo Pedido de Compra'}
            </h2>
            <button 
              onClick={() => {
                setIsPurchaseOrderFormOpen(false);
                setEditingPurchaseOrder(null);
              }}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Fornecedor</label>
              <select
                required
                value={formData.supplierId}
                onChange={e => setFormData({...formData, supplierId: e.target.value})}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um fornecedor</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Produto</label>
              <select
                required
                value={formData.productId}
                onChange={e => setFormData({...formData, productId: e.target.value})}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um produto</option>
                {products.filter(p => p.supplierId === formData.supplierId).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Quantidade</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Valor Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalValue ?? ''}
                  onChange={e => setFormData({...formData, totalValue: Number(e.target.value)})}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Vencimento</label>
                <input
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Valor Pago (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amountPaid ?? ''}
                  onChange={e => setFormData({...formData, amountPaid: Number(e.target.value)})}
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Status</label>
              <select
                required
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pendente</option>
                <option value="ordered">Encomendado</option>
                <option value="received">Recebido</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-6"
            >
              {editingPurchaseOrder ? 'Salvar Alterações' : 'Criar Pedido'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  };

  const ProductForm = () => {
    const [supplierSearch, setSupplierSearch] = useState('');
    const [formData, setFormData] = useState<Omit<Product, 'id'>>(
      editingProduct ? { ...editingProduct } : {
        name: '',
        supplierId: suppliers[0]?.id || '',
        costPrice: 0,
        salePrice: 0,
        stock: 0,
        minStock: 0,
        size: '',
        category: 'Equipamento',
        active: true,
        variations: [],
        useGlobalPricing: false,
        globalCostPrice: 0,
        globalSalePrice: 0
      }
    );

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      let dataToSubmit = { ...formData };
      if (formData.useGlobalPricing) {
        dataToSubmit.variations = formData.variations?.map(v => ({
          ...v,
          costPrice: formData.globalCostPrice || 0,
          salePrice: formData.globalSalePrice || 0
        }));
      } else {
        // If not global, use the first variation's price as the main product price
        const firstVariation = formData.variations?.[0];
        if (firstVariation) {
          dataToSubmit.costPrice = firstVariation.costPrice;
          dataToSubmit.salePrice = firstVariation.salePrice;
        }
      }
      if (editingProduct) {
        await handleUpdateProduct(editingProduct.id, dataToSubmit);
      } else {
        await handleAddProduct(dataToSubmit);
      }
      setIsProductFormOpen(false);
    };

    const filteredSuppliers = suppliers.filter(s => 
      s.name.toLowerCase().includes(supplierSearch.toLowerCase())
    );

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsProductFormOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-zinc-900 dark:text-white text-xl font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 uppercase">{formData.active ? 'Ativo' : 'Inativo'}</span>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, active: !formData.active })}
                className={cn(
                  "w-10 h-6 rounded-full transition-all relative",
                  formData.active ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  formData.active ? "right-1" : "left-1"
                )} />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Nome do Produto</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="Ex: Kimono A2"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Categoria</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="Equipamento">Equipamento</option>
                <option value="Vestuário">Vestuário</option>
                <option value="Suplemento">Suplemento</option>
                <option value="Acessório">Acessório</option>
                <option value="Educação">Educação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase mb-2 cursor-pointer">
                <input type="checkbox" checked={formData.useGlobalPricing} onChange={e => setFormData({ ...formData, useGlobalPricing: e.target.checked })} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                Usar Preços Globais
              </label>
              {formData.useGlobalPricing && (
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Custo Global" value={formData.globalCostPrice || ''} onChange={e => setFormData({ ...formData, globalCostPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white" />
                  <input type="number" placeholder="Venda Global" value={formData.globalSalePrice || ''} onChange={e => setFormData({ ...formData, globalSalePrice: parseFloat(e.target.value) || 0 })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white" />
                </div>
              )}
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Variações</label>
              <div className="space-y-2">
                {formData.variations?.map((v, index) => (
                  <div key={index} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-zinc-500 text-[10px] font-bold uppercase">Tamanho</label>
                        <input type="text" placeholder="Tam" value={v.size} onChange={e => {
                          const newVariations = [...(formData.variations || [])];
                          newVariations[index].size = e.target.value;
                          setFormData({ ...formData, variations: newVariations });
                        }} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] font-bold uppercase">Cor</label>
                        <input type="text" placeholder="Cor" value={v.color} onChange={e => {
                          const newVariations = [...(formData.variations || [])];
                          newVariations[index].color = e.target.value;
                          setFormData({ ...formData, variations: newVariations });
                        }} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-zinc-500 text-[10px] font-bold uppercase">Estoque</label>
                        <input type="number" placeholder="Qtd" value={isNaN(v.stock) || v.stock === 0 ? '' : v.stock} onChange={e => {
                          const newVariations = [...(formData.variations || [])];
                          newVariations[index].stock = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setFormData({ ...formData, variations: newVariations });
                        }} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[10px] font-bold uppercase">Est. Mín</label>
                        <input type="number" placeholder="Mín" value={isNaN(v.minStock) || v.minStock === 0 ? '' : v.minStock} onChange={e => {
                          const newVariations = [...(formData.variations || [])];
                          newVariations[index].minStock = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setFormData({ ...formData, variations: newVariations });
                        }} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm" />
                      </div>
                    </div>
                    {!formData.useGlobalPricing && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-zinc-500 text-[10px] font-bold uppercase">Custo</label>
                          <input type="number" placeholder="R$ 0,00" value={isNaN(v.costPrice) || v.costPrice === 0 ? '' : v.costPrice} onChange={e => {
                            const newVariations = [...(formData.variations || [])];
                            newVariations[index].costPrice = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setFormData({ ...formData, variations: newVariations });
                          }} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm" />
                        </div>
                        <div>
                          <label className="text-zinc-500 text-[10px] font-bold uppercase">Venda</label>
                          <input type="number" placeholder="R$ 0,00" value={isNaN(v.salePrice) || v.salePrice === 0 ? '' : v.salePrice} onChange={e => {
                            const newVariations = [...(formData.variations || [])];
                            newVariations[index].salePrice = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setFormData({ ...formData, variations: newVariations });
                          }} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm" />
                        </div>
                      </div>
                    )}
                    <button type="button" onClick={() => {
                      const newVariations = [...(formData.variations || [])];
                      newVariations[index].isValidated = !newVariations[index].isValidated;
                      setFormData({ ...formData, variations: newVariations });
                    }} className={`w-full p-2 rounded-lg text-xs font-bold ${v.isValidated ? 'bg-green-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'}`}>
                      {v.isValidated ? 'Variação Validada' : 'Validar Variação'}
                    </button>
                    <button type="button" onClick={() => {
                      const newVariations = formData.variations?.filter((_, i) => i !== index);
                      setFormData({ ...formData, variations: newVariations });
                    }} className="w-full p-2 bg-red-500 text-white rounded-lg text-xs font-bold">Remover Variação</button>
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setFormData({ ...formData, variations: [...(formData.variations || []), { id: Date.now().toString(), size: '', color: '', stock: 0, minStock: 0, costPrice: 0, salePrice: 0 }] });
                }} className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm rounded-xl">Adicionar Variação</button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Preço Custo</label>
                  <input 
                    required={formData.useGlobalPricing}
                    type="number" 
                    value={isNaN(formData.costPrice) || formData.costPrice === 0 ? '' : formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Preço Venda</label>
                  <input 
                    required={formData.useGlobalPricing}
                    type="number" 
                    value={isNaN(formData.salePrice) || formData.salePrice === 0 ? '' : formData.salePrice}
                    onChange={e => setFormData({ ...formData, salePrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase mb-2 cursor-pointer">
                  <input type="checkbox" checked={formData.useGlobalPricing} onChange={e => setFormData({ ...formData, useGlobalPricing: e.target.checked })} className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                  Usar Preços Globais
                </label>
                {formData.useGlobalPricing && (
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Custo Global" value={formData.globalCostPrice || ''} onChange={e => setFormData({ ...formData, globalCostPrice: parseFloat(e.target.value) || 0 })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white" />
                    <input type="number" placeholder="Venda Global" value={formData.globalSalePrice || ''} onChange={e => setFormData({ ...formData, globalSalePrice: parseFloat(e.target.value) || 0 })} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Fornecedor</label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text"
                    placeholder="Filtrar fornecedores..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <select 
                  value={formData.supplierId}
                  onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="">Selecione um fornecedor</option>
                  {filteredSuppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all mt-4"
            >
              {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  };

  const SupplierForm = () => {
    const [formData, setFormData] = useState<Omit<Supplier, 'id'>>(
      editingSupplier ? { ...editingSupplier } : {
        name: '',
        cnpj: '',
        contact: ''
      }
    );

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingSupplier) {
        await handleUpdateSupplier(editingSupplier.id, formData);
      } else {
        await handleAddSupplier(formData);
      }
      setIsSupplierFormOpen(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSupplierFormOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
          <h3 className="text-zinc-900 dark:text-white text-xl font-bold mb-6">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Nome / Razão Social</label>
              <input 
                required
                autoFocus
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">CNPJ / CPF</label>
              <input 
                type="text" 
                value={formData.cnpj}
                onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Contato (Email/Tel)</label>
              <input 
                type="text" 
                value={formData.contact}
                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all mt-4"
            >
              {editingSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  };

  const PartnerForm = () => {
    const [formData, setFormData] = useState<Omit<Partner, 'id'>>(
      editingPartner ? { ...editingPartner } : {
        name: '',
        type: 'Colaborador',
        contact: '',
        active: true
      }
    );

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingPartner) {
        await handleUpdatePartner(editingPartner.id, formData);
      } else {
        await handleAddPartner(formData);
      }
      setIsPartnerFormOpen(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsPartnerFormOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
          <h3 className="text-zinc-900 dark:text-white text-xl font-bold mb-6">{editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Nome / Empresa</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Tipo</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="Patrocinador">Patrocinador</option>
                <option value="Colaborador">Colaborador</option>
                <option value="Cliente">Cliente</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Contato</label>
              <input 
                required
                type="text" 
                value={formData.contact}
                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all mt-4"
            >
              {editingPartner ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  };

  const TransactionForm = () => {
    const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
      type: 'income',
      category: 'Mensalidade',
      description: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd')
    });

    const [linkType, setLinkType] = useState<'student' | 'partner'>('student');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const availableCategories = useMemo(() => {
      const dbCategories = categories.filter(c => c.type === formData.type).map(c => c.name);
      const defaultCategories = formData.type === 'expense' ? EXPENSE_CATEGORIES : ['Mensalidade', 'Venda', 'Outros'];
      return Array.from(new Set([...defaultCategories, ...dbCategories]));
    }, [categories, formData.type]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await handleAddTransaction(formData);
      setIsTransactionFormOpen(false);
    };

    const handleQuickAddCategory = async () => {
      if (!newCategoryName.trim()) return;
      await handleAddCategory({ name: newCategoryName.trim(), type: formData.type });
      setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
      setNewCategoryName('');
      setIsAddingCategory(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsTransactionFormOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl"
        >
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-zinc-900 dark:text-white text-xl font-bold">Nova Transação</h3>
            <button 
              onClick={() => setIsTransactionFormOpen(false)}
              className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income' })}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                  formData.type === 'income' ? "bg-emerald-600 text-white" : "text-zinc-500"
                )}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                  formData.type === 'expense' ? "bg-red-600 text-white" : "text-zinc-500"
                )}
              >
                Saída
              </button>
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Descrição</label>
              <input 
                required
                type="text" 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Valor</label>
                <input 
                  required
                  type="number" 
                  value={isNaN(formData.amount) || formData.amount === 0 ? '' : formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Data</label>
                <input 
                  required
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Categoria</label>
              <div className="flex gap-2">
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all appearance-none"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isAddingCategory && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex gap-2"
              >
                <input 
                  type="text" 
                  placeholder="Nova categoria..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                />
                <button 
                  type="button"
                  onClick={handleQuickAddCategory}
                  className="px-4 bg-blue-600 text-white rounded-xl font-bold text-xs"
                >
                  Adicionar
                </button>
              </motion.div>
            )}

            {formData.type === 'income' && (formData.category === 'Mensalidade' || formData.category === 'Venda') && (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType('student');
                      setFormData({ ...formData, partnerId: undefined });
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                      linkType === 'student' ? "bg-blue-600 text-white" : "text-zinc-500"
                    )}
                  >
                    Aluno
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkType('partner');
                      setFormData({ ...formData, studentId: undefined });
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                      linkType === 'partner' ? "bg-orange-600 text-white" : "text-zinc-500"
                    )}
                  >
                    Parceiro
                  </button>
                </div>

                {linkType === 'student' ? (
                  <div>
                    <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Selecionar Aluno</label>
                    <select 
                      value={formData.studentId || ''}
                      onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="">Selecione um aluno...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Selecionar Parceiro</label>
                    <select 
                      value={formData.partnerId || ''}
                      onChange={e => setFormData({ ...formData, partnerId: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="">Selecione um parceiro...</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit"
              className={cn(
                "w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-4",
                formData.type === 'income' ? "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-500" : "bg-red-600 shadow-red-600/20 hover:bg-red-500"
              )}
            >
              Confirmar Transação
            </button>
          </form>
        </motion.div>
      </div>
    );
  };
  const GraduationModal = ({ student, onClose, onSave }: { student: Student, onClose: () => void, onSave: (grad: Graduation) => void }) => {
    const [rank, setRank] = useState('');
    const [degree, setDegree] = useState(0);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');
    const [modality, setModality] = useState<Modality>(student.modalities[0] || Modality.JIU_JITSU);

    const availableRanks = ranks.filter(r => r.modality === modality).length > 0 
      ? ranks.filter(r => r.modality === modality).sort((a,b) => a.order - b.order)
      : (modality === Modality.JIU_JITSU ? BJJ_RANKS : modality === Modality.MUAY_THAI ? MUAY_THAI_RANKS : MMA_RANKS).map((r, i) => ({ id: r, name: r, order: i, modality }));

    const selectedRankObj = ranks.find(r => r.name === rank && r.modality === modality);
    const maxDegrees = selectedRankObj?.maxDegrees || (modality === Modality.JIU_JITSU ? 4 : 0);

    const handleSubmit = () => {
      if (!rank) return;
      onSave({
        date,
        rank,
        degree: modality === Modality.JIU_JITSU ? degree : undefined,
        notes
      });
    };

    return (
      <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl"
        >
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
          <h3 className="text-zinc-900 dark:text-white text-xl font-bold mb-6">Registrar Graduação</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Modalidade</label>
              <div className="flex gap-2">
                {student.modalities.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setModality(m);
                      setRank('');
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border",
                      modality === m 
                        ? (m === Modality.JIU_JITSU ? "bg-blue-600 border-blue-500 text-white" : m === Modality.MUAY_THAI ? "bg-red-600 border-red-500 text-white" : "bg-emerald-600 border-emerald-500 text-white")
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">
                  {modality === Modality.MUAY_THAI ? 'Novo Prajied' : modality === Modality.MMA ? 'Nova Categoria' : 'Nova Graduação'}
                </label>
                <select 
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {availableRanks.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {modality === Modality.JIU_JITSU && (
                <div>
                  <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Grau (0-{maxDegrees})</label>
                  <input 
                    type="number" 
                    min="0" max={maxDegrees}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none"
                    value={degree}
                    onChange={(e) => setDegree(parseInt(e.target.value))}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Data</label>
              <input 
                type="date" 
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-bold uppercase mb-2 block">Observações Técnicas</label>
              <textarea 
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none h-24 resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Melhorou a guarda, bom desempenho no sparring..."
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!rank}
                className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const ProductsList = () => {
    console.log('Products list rendering, products count:', products.length);
    return (
    <div className="space-y-4 pb-20">
      {products.map(product => (
        <div key={product.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-zinc-900 dark:text-white font-bold">{product.name}</h4>
                <span className={cn(
                  "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                  product.active ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"
                )}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Fornecedor: {suppliers.find(s => s.id === product.supplierId)?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-900 dark:text-white font-bold">R$ {product.salePrice.toFixed(2)}</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-[10px]">Estoque: {product.stock}</p>
              <button 
                onClick={() => handleDeleteProduct(product.id)}
                className="text-red-500 hover:text-red-700 text-xs font-bold mt-2"
              >
                Excluir
              </button>
            </div>
          </div>
          <button 
            onClick={() => { setEditingProduct(product); setIsProductFormOpen(true); }}
            className="w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold"
          >
            Editar
          </button>
        </div>
      ))}
      {products.length === 0 && <p className="text-center text-zinc-500 dark:text-zinc-400">Nenhum produto cadastrado.</p>}
      
      <button 
        onClick={() => { setEditingProduct(null); setIsProductFormOpen(true); }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
  };

  const OrdersList = () => (
    <div className="space-y-4">
      <h3 className="text-zinc-900 dark:text-white font-bold">Pedidos</h3>
      {orders.map(order => (
        <div key={order.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-zinc-900 dark:text-white font-bold">{products.find(p => p.id === order.productId)?.name}</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">Aluno: {students.find(s => s.id === order.studentId)?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-900 dark:text-white font-bold">Qtd: {order.quantity}</p>
              <p className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                order.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"
              )}>
                {order.status}
              </p>
            </div>
          </div>
        </div>
      ))}
      {orders.length === 0 && <p className="text-center text-zinc-500 dark:text-zinc-400">Nenhum pedido cadastrado.</p>}
    </div>
  );

  const SuppliersList = () => (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateTo('registration-center')} className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-900 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Fornecedores</h1>
        </div>
      </div>

      <div className="space-y-4">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-zinc-900 dark:text-white font-bold">{supplier.name}</h4>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">{supplier.cnpj || 'Sem CNPJ/CPF'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingSupplier(supplier);
                    setIsSupplierFormOpen(true);
                  }}
                  className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteSupplier(supplier.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">{supplier.contact || 'Sem contato'}</span>
              <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase">
                <Package className="w-3 h-3" />
                <span>{products.filter(p => p.supplierId === supplier.id).length} Produtos</span>
              </div>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && <p className="text-center text-zinc-500 dark:text-zinc-400">Nenhum fornecedor cadastrado.</p>}
      </div>

      <button 
        onClick={() => {
          setEditingSupplier(null);
          setIsSupplierFormOpen(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all z-40"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );

  const Store = ({
    view, setView,
    expandedSales, setExpandedSales,
    saleType, setSaleType,
    selectedProduct, setSelectedProduct,
    selectedVariation, setSelectedVariation,
    selectedBuyerType, setSelectedBuyerType,
    selectedBuyerId, setSelectedBuyerId,
    buyerName, setBuyerName,
    quantity, setQuantity,
    discount, setDiscount,
    saleItems, setSaleItems,
    editingSaleId, setEditingSaleId,
    saleNumber, setSaleNumber,
    isAutomaticSaleNumber, setIsAutomaticSaleNumber,
    payerName, setPayerName
  }: any) => {
    const handleAddItem = () => {
      
      const product = products.find(p => p.id === selectedProduct);
      if (!product) return;

      let unitPrice = product.salePrice;
      let variationId = undefined;

      if (selectedVariation) {
        const variation = product.variations?.find(v => v.id === selectedVariation);
        if (variation && !product.useGlobalPricing) {
          unitPrice = variation.salePrice;
        }
        variationId = variation?.id;
      } else if (product.useGlobalPricing && product.globalSalePrice) {
        unitPrice = product.globalSalePrice;
      }

      const newItem: SaleItem = {
        id: Date.now().toString(),
        productId: selectedProduct,
        variationId: variationId || null,
        buyerId: selectedBuyerId,
        buyerType: selectedBuyerType,
        buyerName: selectedBuyerType === 'client' ? buyerName : 
                   selectedBuyerType === 'partner' ? partners.find(p => p.id === selectedBuyerId)?.name :
                   selectedBuyerType === 'teacher' ? teachers.find(t => t.id === selectedBuyerId)?.name :
                   selectedBuyerType === 'student' ? students.find(s => s.id === selectedBuyerId)?.name :
                   undefined,
        quantity,
        unitPrice,
        discount: parseFloat(discount) || 0,
        totalPrice: (unitPrice * quantity) - (parseFloat(discount) || 0),
        status: 'pending'
      };

      setSaleItems([...saleItems, newItem]);
      
      // Reset some fields
      if (view === 'group') {
        setSelectedBuyerId('');
        setBuyerName('');
      }
      setQuantity(1);
      setDiscount('0');
    };

    const handleFinalizeSale = async () => {
      if (saleItems.length === 0) return;

      const totalAmount = saleItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
      const totalDiscount = saleItems.reduce((acc, item) => acc + item.discount, 0);
      const finalAmount = totalAmount - totalDiscount;

      const newSale: Omit<Sale, 'id'> = {
        saleNumber: saleNumber,
        type: view === 'simple' ? 'simple' : 'group',
        items: saleItems,
        totalAmount,
        totalDiscount,
        finalAmount,
        createdAt: editingSaleId ? sales.find(s => s.id === editingSaleId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        status: 'pending',
        stockAction: 'deduct',
        payerName: payerName || ''
      };

      try {
        if (editingSaleId) {
          await handleUpdateSale(editingSaleId, { ...newSale, id: editingSaleId });
          // Note: We are not automatically reverting previous stock actions here for simplicity in this prototype.
        } else {
          await handleAddSale(newSale);

          // Always deduct stock and create purchase order for remainder
          for (const item of saleItems) {
            const product = products.find(p => p.id === item.productId);
            if (!product) continue;

            let availableStock = 0;
            let variationId = item.variationId;

            if (variationId && product.variations) {
              const variation = product.variations.find(v => v.id === variationId);
              availableStock = variation?.stock || 0;
            } else {
              availableStock = product.stock || 0;
            }

            const quantityToDeduct = Math.min(item.quantity, availableStock);
            const quantityToOrder = item.quantity - quantityToDeduct;

            // Deduct from stock
            if (quantityToDeduct > 0) {
              if (variationId && product.variations) {
                const updatedVariations = product.variations.map(v =>
                  v.id === variationId ? { ...v, stock: v.stock - quantityToDeduct } : v
                );
                await handleUpdateProduct(product.id, { variations: updatedVariations });
              } else {
                await handleUpdateProduct(product.id, { stock: product.stock - quantityToDeduct });
              }
            }

            // Create purchase order for remainder
            if (quantityToOrder > 0) {
              const newPurchaseOrder: Omit<PurchaseOrder, 'id'> = {
                supplierId: product.supplierId || '',
                productId: product.id,
                variationId: variationId,
                quantity: quantityToOrder,
                status: 'pending',
                createdAt: new Date().toISOString(),
              };
              await handleAddPurchaseOrder(newPurchaseOrder);
            }
          }
        }

        setSaleItems([]);
        setEditingSaleId(null);
        setSaleNumber(`VEN-${Math.floor(Math.random() * 10000)}`);
        setPayerName('');
        alert(editingSaleId ? 'Venda atualizada com sucesso!' : 'Venda finalizada com sucesso!');
      } catch (error) {
        console.error("Error finalizing sale:", error);
        alert('Erro ao finalizar venda. Tente novamente.');
      }
    };

    return (
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white"></h1>
        </div>

        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={() => setView('simple')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              view === 'simple' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            Venda Simples
          </button>
          <button 
            onClick={() => setView('group')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              view === 'group' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <Users className="w-4 h-4" />
            Venda Grupo
          </button>
          <button 
            onClick={() => setView('history')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              view === 'history' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            )}
          >
            <FileText className="w-4 h-4" />
            Histórico
          </button>
        </div>

        {(view === 'simple' || view === 'group') && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {editingSaleId ? 'Editar Venda' : (view === 'simple' ? 'Nova Venda Simples' : 'Nova Venda em Grupo')}
                </h3>
                {editingSaleId && (
                  <button
                    onClick={() => {
                      setEditingSaleId(null);
                      setSaleItems([]);
                      setSaleNumber(`VEN-${Math.floor(Math.random() * 10000)}`);
                      setPayerName('');
                      setView('history');
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-bold"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase block">Número da Venda</label>
                    <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAutomaticSaleNumber}
                        onChange={() => {
                          if (isAutomaticSaleNumber) {
                            setIsAutomaticSaleNumber(false);
                          } else {
                            setIsAutomaticSaleNumber(true);
                            setSaleNumber(`VEN-${Math.floor(Math.random() * 10000)}`);
                          }
                        }}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      Automático
                    </label>
                  </div>
                  <input 
                    type="text" 
                    value={saleNumber} 
                    onChange={e => {
                      if (!isAutomaticSaleNumber) {
                        setSaleNumber(e.target.value);
                      }
                    }}
                    readOnly={isAutomaticSaleNumber}
                    className={`w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white ${isAutomaticSaleNumber ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Tipo de Comprador</label>
                  <select 
                    value={selectedBuyerType} 
                    onChange={e => {
                      setSelectedBuyerType(e.target.value as any);
                      setSelectedBuyerId('');
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white"
                  >
                    <option value="student">Aluno</option>
                    <option value="partner">Parceiro</option>
                    <option value="teacher">Professor</option>
                    <option value="client">Cliente Avulso</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Comprador</label>
                  {selectedBuyerType === 'student' && (
                    <select value={selectedBuyerId} onChange={e => setSelectedBuyerId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white">
                      <option value="">Selecione um aluno</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                  {selectedBuyerType === 'partner' && (
                    <select value={selectedBuyerId} onChange={e => setSelectedBuyerId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white">
                      <option value="">Selecione um parceiro</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  {selectedBuyerType === 'teacher' && (
                    <select value={selectedBuyerId} onChange={e => setSelectedBuyerId(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white">
                      <option value="">Selecione um professor</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                  {selectedBuyerType === 'client' && (
                    <input 
                      type="text" 
                      placeholder="Nome do cliente" 
                      value={buyerName} 
                      onChange={e => setBuyerName(e.target.value)} 
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Produto</label>
                  <select 
                    value={selectedProduct} 
                    onChange={e => {
                      setSelectedProduct(e.target.value);
                      setSelectedVariation('');
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white"
                  >
                    <option value="">Selecione um produto</option>
                    {products.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {selectedProduct && products.find(p => p.id === selectedProduct)?.variations && products.find(p => p.id === selectedProduct)!.variations!.length > 0 && (
                  <div>
                    <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Variação</label>
                    <select 
                      value={selectedVariation} 
                      onChange={e => setSelectedVariation(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white"
                    >
                      <option value="">Selecione uma variação</option>
                      {products.find(p => p.id === selectedProduct)?.variations?.map(v => (
                        <option key={v.id} value={v.id}>{v.size} - {v.color}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Quantidade</label>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity} 
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)} 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Desconto (R$)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={discount} 
                    onChange={e => setDiscount(e.target.value)} 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <button 
                onClick={handleAddItem}
                disabled={!selectedProduct || (selectedBuyerType !== 'client' && !selectedBuyerId) || (selectedBuyerType === 'client' && !buyerName)}
                className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Adicionar à Lista
              </button>
            </div>

            {saleItems.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Lista de Produtos</h3>
                <div className="space-y-2">
                  {saleItems.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    const variation = product?.variations?.find(v => v.id === item.variationId);
                    
                    let buyerDisplayName = item.buyerName;
                    if (item.buyerType === 'student') buyerDisplayName = students.find(s => s.id === item.buyerId)?.name;
                    if (item.buyerType === 'partner') buyerDisplayName = partners.find(p => p.id === item.buyerId)?.name;
                    if (item.buyerType === 'teacher') buyerDisplayName = teachers.find(t => t.id === item.buyerId)?.name;

                    return (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white">{product?.name} {variation ? `(${variation.size} - ${variation.color})` : ''}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Para: {buyerDisplayName} ({item.buyerType})</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-zinc-900 dark:text-white">{item.quantity}x R$ {item.unitPrice}</p>
                            {item.discount > 0 && <p className="text-xs text-red-500">- R$ {item.discount} desc.</p>}
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Total: R$ {item.totalPrice}</p>
                          </div>
                          <button
                            onClick={() => setSaleItems(saleItems.filter(i => i.id !== item.id))}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remover item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-zinc-500 dark:text-zinc-400 font-bold uppercase">Total da Venda</span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                      R$ {saleItems.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2)}
                    </span>
                  </div>


                  <button 
                    onClick={handleFinalizeSale}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    {editingSaleId ? 'Atualizar Venda' : 'Finalizar Venda'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            {sales.map(sale => {
              const isExpanded = expandedSales.includes(sale.id);
              return (
                <div key={sale.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpandedSales(prev => isExpanded ? prev.filter(id => id !== sale.id) : [...prev, sale.id])}>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                      </button>
                      <div>
                        <h4 className="text-zinc-900 dark:text-white font-bold">{sale.saleNumber}</h4>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs">{format(parseISO(sale.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                        {sale.payerName && (
                          <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
                            <span className="font-semibold">Pago por:</span> {sale.payerName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold">R$ {sale.finalAmount.toFixed(2)}</p>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                          sale.type === 'simple' ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                        )}>
                          {sale.type === 'simple' ? 'Venda Simples' : 'Venda Grupo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingSaleId(sale.id);
                            setView(sale.type);
                            setSaleItems(sale.items);
                            setSaleNumber(sale.saleNumber);
                            setPayerName(sale.payerName || '');
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar Venda"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteSale(sale);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Excluir Venda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      {sale.items.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const paid = item.status === 'paid';
                        return (
                          <div key={item.id} className={cn(
                            "flex justify-between items-center text-sm p-3 rounded-lg border",
                            paid ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                          )}>
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={paid} 
                                onChange={() => {
                                  const newStatus = paid ? 'pending' : 'paid';
                                  const updatedItems = sale.items.map(i => i.id === item.id ? { ...i, status: newStatus } : i);
                                  handleUpdateSale(sale.id, { items: updatedItems });
                                }}
                                className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="flex-1">
                                <p className={cn("font-bold", paid ? "text-zinc-500 dark:text-zinc-400 line-through" : "text-zinc-900 dark:text-white")}>
                                  {item.buyerName || 'Sem nome'}
                                </p>
                                <p className={cn("text-xs", paid ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-500 dark:text-zinc-400")}>
                                  {item.quantity}x {product?.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn("font-bold", paid ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-white")}>
                                R$ {item.totalPrice.toFixed(2)}
                              </p>
                              {!paid && <p className="text-xs text-orange-500 font-bold">Pendente</p>}
                            </div>
                          </div>
                        );
                      })}
                      {sale.type === 'group' && (
                        <button
                          onClick={() => generateGroupSalePDF(sale)}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-bold"
                        >
                          <FileText className="w-4 h-4" />
                          Exportar PDF
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {sales.length === 0 && <p className="text-center text-zinc-500 dark:text-zinc-400">Nenhum histórico de vendas.</p>}
          </div>
        )}
      </div>
    );
  };

  const generateGroupSalePDF = (sale: Sale) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Venda em Grupo - ${sale.saleNumber}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Data: ${format(parseISO(sale.createdAt), 'dd/MM/yyyy')}`, 14, 30);
    doc.text(`Total: R$ ${sale.finalAmount.toFixed(2)}`, 14, 36);

    const tableColumn = ["Comprador", "Produto", "Qtd", "Status", "Valor"];
    const tableRows: any[] = [];

    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      tableRows.push([
        item.buyerName || 'N/A',
        product?.name || 'N/A',
        item.quantity,
        item.status === 'paid' ? '✅ Pago' : '❌ Pendente',
        `R$ ${item.totalPrice.toFixed(2)}`
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
    });

    doc.save(`venda_grupo_${sale.saleNumber}.pdf`);
  };

  const generatePDF = (filteredTransactions: Transaction[]) => {
    const doc = new jsPDF();
    const tableColumn = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];
    const tableRows: any[] = [];

    filteredTransactions.forEach(t => {
      const transactionData = [
        format(parseISO(t.date), 'dd/MM/yyyy'),
        t.description,
        t.category,
        t.type === 'income' ? 'Entrada' : 'Saída',
        `R$ ${t.amount.toLocaleString()}`
      ];
      tableRows.push(transactionData);
    });

    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    doc.setFontSize(18);
    doc.text("Relatório Financeiro - DojoManager", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período: ${format(parseISO(reportFilters.startDate), 'dd/MM/yyyy')} até ${format(parseISO(reportFilters.endDate), 'dd/MM/yyyy')}`, 14, 30);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [39, 39, 42] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Entradas: R$ ${totalIncome.toLocaleString()}`, 14, finalY + 10);
    doc.text(`Total Saídas: R$ ${totalExpense.toLocaleString()}`, 14, finalY + 17);
    doc.setFontSize(14);
    doc.text(`Balanço Final: R$ ${(totalIncome - totalExpense).toLocaleString()}`, 14, finalY + 27);

    doc.save(`relatorio_financeiro_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const generateTeacherClassReport = (teacherId: string, startDate: Date, endDate: Date) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const logs = teacherClassLogs
      .filter(l => l.teacherId === teacherId && l.date >= format(startDate, 'yyyy-MM-dd') && l.date <= format(endDate, 'yyyy-MM-dd'))
      .sort((a, b) => a.date.localeCompare(b.date));

    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(39, 39, 42);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.academyName || "DojoManager", 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("DEMONSTRATIVO DE AULAS", 14, 32);
    
    // Teacher Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Professor: ${teacher.name}`, 14, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Período: ${format(startDate, 'dd/MM/yyyy')} até ${format(endDate, 'dd/MM/yyyy')}`, 14, 62);
    
    // Table
    const tableColumn = ["Data", "Dia da Semana", "Modalidade", "Qtd Aulas", "Valor Unit.", "Subtotal"];
    const tableRows = logs.map(log => [
      format(parseISO(log.date), 'dd/MM/yyyy'),
      format(parseISO(log.date), 'EEEE', { locale: ptBR }),
      log.modality,
      log.classCount,
      `R$ ${log.rate.toLocaleString()}`,
      `R$ ${(log.classCount * log.rate).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'striped',
      headStyles: { fillColor: [39, 39, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 70 },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    
    // Total
    const totalAmount = logs.reduce((sum, l) => sum + (l.classCount * l.rate), 0);
    const totalClasses = logs.reduce((sum, l) => sum + l.classCount, 0);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(14, finalY + 5, 182, 25, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Total de Aulas: ${totalClasses}`, 20, finalY + 15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`VALOR TOTAL: R$ ${totalAmount.toLocaleString()}`, 20, finalY + 24);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 285);
    
    doc.save(`demonstrativo_aulas_${teacher.name.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const TeacherClassControl = () => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');
    
    // Log form state
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState('');

    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

    const handleAddLog = async () => {
      if (!selectedTeacher) return;
      
      const existingLogsForDay = teacherClassLogs.filter(l => l.teacherId === selectedTeacherId && l.date === selectedDate);

      for (const modality of selectedTeacher.modalities) {
        const count = counts[modality] || 0;
        const existingLog = existingLogsForDay.find(l => l.modality === modality);

        if (count > 0) {
          const rate = selectedTeacher.modalityRates?.[modality] ?? selectedTeacher.paymentAmount;
          if (existingLog) {
            // Update
            if (existingLog.classCount !== count || existingLog.rate !== rate) {
              await handleUpdateClassLog(existingLog.id, { classCount: count, rate, notes });
            }
          } else {
            // Create
            await handleAddClassLog({
              teacherId: selectedTeacherId,
              date: selectedDate,
              modality,
              classCount: count,
              rate,
              notes
            });
          }
        } else if (existingLog) {
          // Delete
          await handleDeleteClassLog(existingLog.id);
        }
      }
      
      setIsLogFormOpen(false);
      setNotes('');
      setCounts({});
    };

    return (
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Controle de Aulas</h2>
          <div className="flex items-center gap-2">
            {selectedTeacherId && (
              <button 
                onClick={() => generateTeacherClassReport(selectedTeacherId, startOfCurrentWeek, addDays(startOfCurrentWeek, 6))}
                className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-blue-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Exportar PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <div className="w-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Professor</label>
          <select 
            value={selectedTeacherId}
            onChange={e => setSelectedTeacherId(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-red-500"
          >
            <option value="">Selecionar Professor</option>
            {teachers.filter(t => t.active).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {selectedTeacherId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <button onClick={() => setCurrentDate(subDays(currentDate, 7))} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h3 className="text-zinc-900 dark:text-white font-bold">
                {format(startOfCurrentWeek, 'dd/MM')} - {format(addDays(startOfCurrentWeek, 6), 'dd/MM')}
              </h3>
              <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-[10px] font-black uppercase text-zinc-400 py-2">{day}</div>
              ))}
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const logs = teacherClassLogs.filter(l => l.teacherId === selectedTeacherId && l.date === dateStr);
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
                
                return (
                  <div 
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      const initialCounts: Record<string, number> = {};
                      selectedTeacher?.modalities.forEach(m => {
                        const existingLog = logs.find(l => l.modality === m);
                        initialCounts[m] = existingLog ? existingLog.classCount : 0;
                      });
                      setCounts(initialCounts);
                      setNotes(logs[0]?.notes || '');
                      setIsLogFormOpen(true);
                    }}
                    className={cn(
                      "aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all relative group",
                      isToday ? "border-red-500 bg-red-500/5" : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-bold",
                      isToday ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"
                    )}>{format(day, 'd')}</span>
                    {logs.length > 0 && (
                      <div className="flex gap-0.5">
                        {logs.map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <h4 className="text-zinc-900 dark:text-white font-bold px-2 text-sm">Aulas no Período</h4>
              <div className="grid gap-3">
                {teacherClassLogs
                  .filter(l => l.teacherId === selectedTeacherId && l.date >= format(startOfCurrentWeek, 'yyyy-MM-dd') && l.date <= format(addDays(startOfCurrentWeek, 6), 'yyyy-MM-dd'))
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(log => (
                    <div key={log.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-zinc-900 dark:text-white text-sm font-bold">{log.modality} • {log.classCount} {log.classCount > 1 ? 'Aulas' : 'Aula'}</p>
                          <p className="text-zinc-500 text-[10px] uppercase font-bold">{format(parseISO(log.date), 'EEEE, dd/MM', { locale: ptBR })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-zinc-900 dark:text-white font-bold text-sm">R$ {(log.classCount * log.rate).toLocaleString()}</p>
                        <button onClick={() => handleDeleteClassLog(log.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isLogFormOpen && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl"
              >
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Registrar Aulas</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">{selectedTeacher?.name} • {format(parseISO(selectedDate), 'dd/MM/yyyy')}</p>
                    </div>
                    <button onClick={() => setIsLogFormOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Aulas por Modalidade</label>
                      <div className="grid gap-2">
                        {selectedTeacher?.modalities.map(m => (
                          <div key={m} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{m}</span>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => setCounts(prev => ({ ...prev, [m]: Math.max(0, (prev[m] || 0) - 1) }))}
                                className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-zinc-900 dark:text-white">{counts[m] || 0}</span>
                              <button 
                                onClick={() => setCounts(prev => ({ ...prev, [m]: (prev[m] || 0) + 1 }))}
                                className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-emerald-500 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-500 text-[10px] uppercase font-bold mb-1 block">Observações</label>
                      <textarea 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-red-500 h-20 resize-none"
                        placeholder="Ex: Aula extra, reposição..."
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleAddLog}
                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-400 transition-all"
                  >
                    Salvar Registro
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Finance = () => {
    const [filter, setFilter] = useState<'today' | '7days' | '30days' | 'all'>('30days');

    const filteredTransactions = useMemo(() => {
      const now = new Date();
      return transactions.filter(t => {
        const date = parseISO(t.date);
        if (filter === 'today') return isWithinInterval(date, { start: startOfDay(now), end: endOfDay(now) });
        if (filter === '7days') return isWithinInterval(date, { start: subDays(now, 7), end: now });
        if (filter === '30days') return isWithinInterval(date, { start: subDays(now, 30), end: now });
        return true;
      });
    }, [transactions, filter]);

    const generatePayments = async (silent = false) => {
      const currentMonth = format(new Date(), 'MMMM', { locale: ptBR });
      const currentYear = new Date().getFullYear();
      
      let generatedCount = 0;
      
      const promises = students.map(async (student) => {
        const newPayments: MonthlyPayment[] = student.modalities.map(mod => ({
          id: Math.random().toString(36).substr(2, 9),
          month: currentMonth,
          year: currentYear,
          amount: student.monthlyFees[mod] || 0,
          status: 'pending',
          dueDate: format(new Date(currentYear, new Date().getMonth(), student.paymentDay), 'yyyy-MM-dd'),
          modality: mod
        }));

        const filteredNewPayments = newPayments.filter(np => 
          !student.payments.some(p => p.month === np.month && p.year === np.year && p.modality === np.modality)
        );

        if (filteredNewPayments.length === 0) return;

        try {
          await updateDoc(doc(db, 'students', student.id), {
            payments: [...filteredNewPayments, ...student.payments]
          });
          generatedCount += filteredNewPayments.length;
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `students/${student.id}`);
        }
      });

      await Promise.all(promises);
      if (!silent && generatedCount > 0) {
        alert(`Mensalidades geradas com sucesso! Total: ${generatedCount}`);
      }
    };

    useEffect(() => {
      generatePayments(true);
    }, []);

    return (
      <div className="space-y-6 pb-24">
        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-1">
            {['Hoje', '7 dias', '30 dias', 'Tudo'].map((label, i) => {
              const values: ('today' | '7days' | '30days' | 'all')[] = ['today', '7days', '30days', 'all'];
              return (
                <button 
                  key={label}
                  onClick={() => setFilter(values[i])}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                    filter === values[i] ? "bg-zinc-900 dark:bg-white text-white dark:text-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="ml-2 p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-blue-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4 transition-colors">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-zinc-400 text-sm">Entradas</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-bold">R$ {filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 dark:text-zinc-400 text-sm">Saídas</span>
            <span className="text-red-500 dark:text-red-400 font-bold">R$ {filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</span>
          </div>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800/50" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-900 dark:text-white font-bold">Resultado</span>
            <span className={cn(
              "font-black text-lg",
              filteredTransactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0) >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
            )}>
              R$ {filteredTransactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0).toLocaleString()}
            </span>
          </div>
          
          <div className="pt-2 space-y-2">
            <button 
              onClick={() => navigateTo('teacher-payments')}
              className="w-full py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              Pagamentos de Professores
            </button>
            <button 
              onClick={() => generatePayments()}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Gerar Mensalidades
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="space-y-3">
          <h3 className="text-zinc-900 dark:text-white font-bold px-1">Fluxo de Caixa</h3>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(t => (
              <div key={t.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-between transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    t.type === 'income' ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400" : "bg-red-500/10 dark:bg-red-500/20 text-red-500 dark:text-red-400"
                  )}>
                    {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-zinc-900 dark:text-white text-sm font-bold">{t.description}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-tighter">{t.category} • {format(parseISO(t.date), 'dd/MM')}</p>
                      {t.studentId && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">•</span>
                          <span className="text-blue-500 dark:text-blue-400 text-[10px] font-bold uppercase">{students.find(s => s.id === t.studentId)?.name}</span>
                        </>
                      )}
                      {t.partnerId && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700 text-[10px]">•</span>
                          <span className="text-orange-500 dark:text-orange-400 text-[10px] font-bold uppercase">{partners.find(p => p.id === t.partnerId)?.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <p className={cn(
                  "font-bold",
                  t.type === 'income' ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                )}>
                  {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-zinc-500 text-sm text-center py-8 italic">Nenhuma transação encontrada.</p>
          )}
        </div>

        <button 
          onClick={() => setIsTransactionFormOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-500 active:scale-95 transition-all z-40"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const SettingsScreen = () => {
    const [academyName, setAcademyName] = useState(settings?.academyName || '');

    const handleSave = async () => {
      await handleUpdateSettings({ academyName });
      goBack();
    };

    return (
      <div className="space-y-6 pb-32">
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Informações da Academia</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Nome da Academia</label>
              <input 
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ex: CT LG Fight"
              />
            </div>
            <div className="pt-4">
              <button 
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className={cn(
        "min-h-[100dvh] font-sans selection:bg-blue-500/30 transition-colors duration-300",
        isDarkMode ? "dark bg-black text-zinc-100" : "bg-white text-zinc-900"
      )}>
        {isCropping && <LogoCropper />}
        <Header />
        
        <main className="pt-20 px-4 max-w-md mx-auto pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen + (selectedStudentId || '')}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentScreen === 'home' && (
                <Dashboard 
                  setEditingSaleId={setEditingSaleId}
                  setView={setView}
                  setSaleItems={setSaleItems}
                  setSaleNumber={setSaleNumber}
                  setPayerName={setPayerName}
                  handleDeleteSale={handleDeleteSale}
                />
              )}
              {currentScreen === 'students' && <StudentsList />}
              {currentScreen === 'partners' && <PartnersList />}
              {currentScreen === 'student-detail' && <StudentDetail />}
              {currentScreen === 'store' && <Store 
                view={view} setView={setView}
                expandedSales={expandedSales} setExpandedSales={setExpandedSales}
                saleType={saleType} setSaleType={setSaleType}
                selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
                selectedVariation={selectedVariation} setSelectedVariation={setSelectedVariation}
                selectedBuyerType={selectedBuyerType} setSelectedBuyerType={setSelectedBuyerType}
                selectedBuyerId={selectedBuyerId} setSelectedBuyerId={setSelectedBuyerId}
                buyerName={buyerName} setBuyerName={setBuyerName}
                quantity={quantity} setQuantity={setQuantity}
                discount={discount} setDiscount={setDiscount}
                saleItems={saleItems} setSaleItems={setSaleItems}
                editingSaleId={editingSaleId} setEditingSaleId={setEditingSaleId}
                saleNumber={saleNumber} setSaleNumber={setSaleNumber}
                isAutomaticSaleNumber={isAutomaticSaleNumber} setIsAutomaticSaleNumber={setIsAutomaticSaleNumber}
                payerName={payerName} setPayerName={setPayerName}
              />}
              {currentScreen === 'product-management' && <ProductsList />}
              {currentScreen === 'supplier-management' && <SuppliersList />}
              {currentScreen === 'finance' && <Finance />}
              {currentScreen === 'ranks' && <RanksManager />}
              {currentScreen === 'registration-center' && <RegistrationCenter />}
              {currentScreen === 'payment-methods' && <PaymentMethods />}
              {currentScreen === 'academy-gallery' && <AcademyGallery />}
              {currentScreen === 'categories' && <CategoriesManager />}
              {currentScreen === 'backups' && <BackupCenter />}
              {currentScreen === 'settings' && <SettingsScreen />}
              {currentScreen === 'relationships-center' && <RelationshipsCenter />}
              {currentScreen === 'teachers' && <TeachersList />}
              {currentScreen === 'teacher-payments' && <TeacherPaymentsCenter />}
              {currentScreen === 'teacher-class-control' && <TeacherClassControl />}
              {currentScreen === 'injured-students' && <InjuredStudents />}
              {currentScreen === 'inventory' && <InventoryScreen />}
            </motion.div>
          </AnimatePresence>
        </main>

        <TabBar />

        {/* Purchase Order Form Modal */}
        <AnimatePresence>
          {isPurchaseOrderFormOpen && <PurchaseOrderForm />}
        </AnimatePresence>

        {/* Student Form Modal */}
        <AnimatePresence>
          {isStudentFormOpen && <StudentForm />}
        </AnimatePresence>

        {/* Product Form Modal */}
        <AnimatePresence>
          {isProductFormOpen && <ProductForm />}
        </AnimatePresence>

        {/* Supplier Form Modal */}
        <AnimatePresence>
          {isSupplierFormOpen && <SupplierForm />}
        </AnimatePresence>

        {/* Partner Form Modal */}
        <AnimatePresence>
          {isPartnerFormOpen && <PartnerForm />}
        </AnimatePresence>

        {/* Teacher Form Modal */}
        <AnimatePresence>
          {isTeacherFormOpen && <TeacherForm />}
        </AnimatePresence>

        {/* Transaction Form Modal */}
        <AnimatePresence>
          {isTransactionFormOpen && <TransactionForm />}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {isReportModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsReportModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 sm:hidden" />
                <h3 className="text-zinc-900 dark:text-white text-xl font-bold mb-6">Relatórios Personalizados</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Período</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="date" 
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={reportFilters.startDate}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                      <input 
                        type="date" 
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        value={reportFilters.endDate}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Categoria</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      value={reportFilters.category}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="all">Todas as Categorias</option>
                      <option value="Mensalidade">Mensalidade</option>
                      <option value="Venda">Venda</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2 block">Aluno</label>
                    <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      value={reportFilters.studentId}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, studentId: e.target.value }))}
                    >
                      <option value="all">Todos os Alunos</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => setIsReportModalOpen(false)}
                      className="flex-1 py-4 rounded-2xl bg-zinc-800 text-white font-bold text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        const filtered = transactions.filter(t => {
                          const date = parseISO(t.date);
                          const start = startOfDay(parseISO(reportFilters.startDate));
                          const end = endOfDay(parseISO(reportFilters.endDate));
                          
                          const matchesDate = isWithinInterval(date, { start, end });
                          const matchesCategory = reportFilters.category === 'all' || t.category === reportFilters.category;
                          const matchesStudent = reportFilters.studentId === 'all' || t.studentId === reportFilters.studentId;
                          
                          return matchesDate && matchesCategory && matchesStudent;
                        });
                        generatePDF(filtered);
                      }}
                      className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20"
                    >
                      Gerar PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Confirmation Modal (Simplified) */}
        <div className="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-zinc-900 w-full rounded-3xl border border-zinc-800 p-6 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-2">Confirmar Exclusão?</h3>
            <p className="text-zinc-400 text-sm mb-6">Esta ação não pode ser desfeita. Todos os dados relacionados serão removidos.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-2xl bg-zinc-800 text-white font-bold">Cancelar</button>
              <button className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold">Excluir</button>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
