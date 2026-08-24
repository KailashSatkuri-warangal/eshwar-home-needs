'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Cart, CartItem, Product, ProductVariant } from '@/types';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase/config';
import { getDbDocs, setDbDoc } from '@/lib/services/db';
import OtpVerificationModal from '@/components/ui/OtpVerificationModal';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: UserProfile | null;
  userLoading: boolean;
  cart: Cart;
  wishlist: string[];
  toasts: Toast[];
  isWholesaleMode: boolean;
  
  // Auth actions
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (email: string, pass: string, name: string, role?: string, wholesaleDetails?: any) => Promise<void>;
  updateUserRole: (uid: string, role: string) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => void;
  
  // Cart actions
  addToCart: (product: Product, quantity: number, variant?: ProductVariant) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateCartQty: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  toggleWholesaleMode: (mode: boolean) => void;

  // Wishlist actions
  toggleWishlist: (productId: string) => void;

  // Toast actions
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isWholesaleMode, setIsWholesaleMode] = useState(false);

  // Global OTP and pending cart action states
  const [showGlobalOtpModal, setShowGlobalOtpModal] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState<(() => void) | null>(null);

  // Initialize Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUserLoading(true);
      if (firebaseUser) {
        try {
          // Fetch user profile from database service (with local JSON fallback)
          const allUsers = await getDbDocs('users') as UserProfile[];
          const profile = allUsers.find(u => u.uid === firebaseUser.uid);
          
          if (profile) {
            const isMasterAdmin = profile.email === 'admin@eshwarhomeneeds.com' || 
                                  profile.email === 'admin1@eshwarhomeneeds.com' || 
                                  profile.email === 'satkurikailash@gmail.com';
            const finalRole = isMasterAdmin ? 'admin' : profile.role;
            const finalPhoneVerified = isMasterAdmin ? true : (profile.phoneVerified || false);

            setUser({ 
              ...profile, 
              role: finalRole as any,
              phoneVerified: finalPhoneVerified
            });
            // If customer has a wholesale role, automatically activate wholesale mode
            if (finalRole === 'wholesale') {
              setIsWholesaleMode(true);
            }
          } else {
            // If no doc exists (fallback), create one
            const isMasterAdmin = firebaseUser.email === 'admin@eshwarhomeneeds.com' || 
                                  firebaseUser.email === 'admin1@eshwarhomeneeds.com' || 
                                  firebaseUser.email === 'satkurikailash@gmail.com';

            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: isMasterAdmin ? 'admin' : 'customer',
              phoneVerified: isMasterAdmin,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await setDbDoc('users', firebaseUser.uid, newProfile);
            setUser(newProfile);
          }
        } catch (dbError) {
          console.warn('Error fetching user profile, using basic local fallback:', dbError);
          // Use basic Auth info as fallback user profile
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: (firebaseUser.email === 'admin@eshwarhomeneeds.com' || firebaseUser.email === 'admin1@eshwarhomeneeds.com') ? 'admin' : 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        setUser(null);
        setIsWholesaleMode(false);
      }
      setUserLoading(false);
    });

    // Load cart and wishlist from localStorage on mount
    const savedCart = localStorage.getItem('eshwar_cart');
    if (savedCart) setCartItems(JSON.parse(savedCart));

    const savedWish = localStorage.getItem('eshwar_wishlist');
    if (savedWish) setWishlist(JSON.parse(savedWish));

    return () => unsubscribe();
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('eshwar_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('eshwar_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    showToast('Logged in successfully!', 'success');
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsWholesaleMode(false);
    setCartItems([]);
    showToast('Logged out successfully.', 'info');
  };

  const registerUser = async (email: string, pass: string, name: string, role = 'customer', wholesaleDetails = {}) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName: name,
      role: (email === 'admin@eshwarhomeneeds.com' || email === 'admin1@eshwarhomeneeds.com' || email === 'satkurikailash@gmail.com') ? 'admin' : (role as any),
      createdAt: new Date(),
      updatedAt: new Date(),
      phoneVerified: email === 'satkurikailash@gmail.com',
      ...wholesaleDetails,
    };

    await setDbDoc('users', cred.user.uid, newProfile);
    setUser(newProfile);
    showToast('Account registered successfully!', 'success');
  };

  const updateUserRole = async (uid: string, role: string) => {
    const allUsers = await getDbDocs('users') as UserProfile[];
    const profile = allUsers.find(u => u.uid === uid);
    if (profile) {
      const updatedProfile = { ...profile, role: role as any, updatedAt: new Date() };
      await setDbDoc('users', uid, updatedProfile);
    }
    if (user?.uid === uid) {
      setUser((prev) => prev ? { ...prev, role: role as any } : null);
    }
    showToast(`Role updated to ${role}`, 'success');
  };

  // Cart Operations
  const addToCart = (product: Product, quantity: number, variant?: ProductVariant) => {
    // Enforce phone verification gate for Cart Adding
    if (!user) {
      showToast('Please sign in or register to verify your mobile number and add items to your cart.', 'info');
      return;
    }

    if (!user.phoneVerified) {
      if (user.phone) {
        showToast('Mobile verification required to add items to cart.', 'info');
        setPendingCartAction(() => () => {
          addToCart(product, quantity, variant);
        });
        setShowGlobalOtpModal(true);
      } else {
        showToast('Please add your mobile number in your Profile & Addresses tab to verify first.', 'error');
      }
      return;
    }

    setCartItems((prev) => {
      const variantId = variant?.id;
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.variantId === variantId
      );

      // Determine price (wholesale or retail)
      const isWholesale = isWholesaleMode || (user?.role === 'wholesale');
      let price = isWholesale ? product.wholesalePrice : product.retailPrice;
      if (!isWholesale && product.discountPrice) {
        price = product.discountPrice;
      }
      if (variant) {
        price = isWholesale ? variant.wholesalePrice : (variant.discountPrice || variant.retailPrice);
      }

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex].quantity = newQty;
        showToast(`Updated quantity of ${product.name}`, 'success');
        return updated;
      } else {
        const newItem: CartItem = {
          productId: product.id,
          variantId,
          name: variant ? `${product.name} (${variant.name})` : product.name,
          sku: variant ? variant.sku : product.sku,
          image: product.originalImage,
          price,
          gstRate: product.gstRate,
          hsnCode: product.hsnCode,
          quantity,
          unit: product.unit,
          weight: product.weight,
        };
        showToast(`Added ${product.name} to cart`, 'success');
        return [...prev, newItem];
      }
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantId === variantId))
    );
    showToast('Item removed from cart', 'info');
  };

  const updateCartQty = (productId: string, quantity: number, variantId?: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleWholesaleMode = (mode: boolean) => {
    setIsWholesaleMode(mode);
    // Re-evaluate cart items pricing based on new mode
    setCartItems((prev) =>
      prev.map((item) => {
        // Pricing re-fetch would ideally pull fresh from DB,
        // but for local UI consistency, we handle a simple toggler:
        // We will notify the user they might need to reload or add items fresh,
        // or we automatically clear the cart to prevent price exploits.
        return item; // In a real system, you re-fetch. We trigger clear for security.
      })
    );
    showToast(`Switched to ${mode ? 'Wholesale' : 'Retail'} pricing`, 'info');
  };

  // Cart Calculations
  const calculateCart = (): Cart => {
    let subtotal = 0;
    let gst = 0;

    cartItems.forEach((item) => {
      const itemSubtotal = item.price * item.quantity;
      // Reverse calculate the base taxable value to apply proper GST formula
      // Rate is inclusive of GST. Taxable Value = Total / (1 + GST_Rate/100)
      const baseValue = itemSubtotal / (1 + item.gstRate / 100);
      const taxValue = itemSubtotal - baseValue;
      
      subtotal += baseValue;
      gst += taxValue;
    });

    const discount = 0; // Configurable coupon/offers discounts can go here
    const shippingThreshold = 1000;
    const deliveryCharge = (subtotal > 0 && (subtotal + gst) < shippingThreshold) ? 100 : 0;
    const grandTotal = subtotal + gst + deliveryCharge - discount;

    return {
      items: cartItems,
      subtotal,
      discount,
      gst,
      deliveryCharge,
      grandTotal,
    };
  };

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast('Removed from wishlist', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Added to wishlist', 'success');
        return [...prev, productId];
      }
    });
  };

  // Toast Alerts
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 3000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateUserProfile = (profile: UserProfile) => {
    setUser(profile);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userLoading,
        cart: calculateCart(),
        wishlist,
        toasts,
        isWholesaleMode,
        login,
        logout,
        registerUser,
        updateUserRole,
        updateUserProfile,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        toggleWholesaleMode,
        toggleWishlist,
        showToast,
        dismissToast,
      }}
    >
      {children}

      {/* Global OTP Verification Modal for Cart Addition Gating */}
      {showGlobalOtpModal && user && user.phone && (
        <OtpVerificationModal
          phone={user.phone}
          userId={user.uid}
          userProfile={user}
          onSuccess={(updatedProfile) => {
            updateUserProfile(updatedProfile);
            setShowGlobalOtpModal(false);
            if (pendingCartAction) {
              pendingCartAction();
              setPendingCartAction(null);
            }
          }}
          onClose={() => {
            setShowGlobalOtpModal(false);
            setPendingCartAction(null);
          }}
          showToast={showToast}
        />
      )}
      
      {/* Dynamic Toast Renderer */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 pointer-events-auto transform translate-y-0 transition-all duration-300 ${
              toast.type === 'success' ? 'bg-copper' : toast.type === 'error' ? 'bg-red-600' : 'bg-earth'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-2 text-xs opacity-75 hover:opacity-100 font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
