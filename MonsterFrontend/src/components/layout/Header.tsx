import React, { type FormEvent, type ChangeEvent, type ReactNode, type ErrorInfo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useState, useCallback, useMemo, memo } from "react";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import type { CartItem } from "../../types/cart-types";
import { useTranslation, type Language } from "./translations";
import type { HeaderUser } from "./types";
import "./Header.css";

// Constants for better maintainability
const SEARCH_CATEGORIES = {
  all: { value: "all", label: "all" },
  men: { value: "men", label: "men" },
  women: { value: "women", label: "women" },
} as const;

// Error Boundary Component
class HeaderErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Header Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <header className="sticky top-0 z-50 bg-[#131921]">
          <div className="w-full px-2 lg:px-6 h-[60px] flex items-center justify-between max-w-screen-2xl mx-auto">
            <div className="text-white">Something went wrong with the header.</div>
          </div>
        </header>
      );
    }

    return this.props.children;
  }
}

// Memoized components for better performance
const Logo = memo(({ homeLink }: { homeLink: string }) => (
  <Link
    to={homeLink}
    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
    aria-label="MonsterMen90 Home"
  >
    <div className="flex items-center">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center mr-2 flex-shrink-0">
        <span className="text-black font-bold text-xs sm:text-sm">M90</span>
      </div>
      <div className="text-white">
        <div className="text-xs font-normal leading-none hidden sm:block whitespace-nowrap">monster</div>
        <div className="text-sm sm:text-base font-bold leading-none whitespace-nowrap">MEN90</div>
      </div>
    </div>
  </Link>
));

Logo.displayName = 'Logo';

const SearchBar = memo(({ 
  searchQuery, 
  searchCategory, 
  language, 
  onSearch, 
  onQueryChange, 
  onCategoryChange 
}: {
  searchQuery: string;
  searchCategory: string;
  language: Language;
  onSearch: (e: FormEvent<HTMLFormElement>) => void;
  onQueryChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onCategoryChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}) => {
  const { t } = useTranslation(language);

  return (
    <form onSubmit={onSearch} className="relative flex w-full min-w-0 max-w-full search-bar-container">
      <div className="relative flex w-full h-10 bg-white rounded-l-md overflow-hidden border border-gray-300 flex-shrink-0">
        <select
          value={searchCategory}
          onChange={onCategoryChange}
          title={t('searchByCategory')}
          className="h-full px-1 sm:px-2 bg-[#e7e9ec] text-sm font-medium text-[#555] focus:outline-none focus:ring-2 focus:ring-[#febd69] cursor-pointer appearance-none border-r border-gray-300 w-10 sm:w-12 header-search-select"
          aria-label={t('searchByCategory')}
        >
          {Object.values(SEARCH_CATEGORIES).map((category) => (
            <option key={category.value} value={category.value}>
              {t(category.label)}
            </option>
          ))}
        </select>

        <Input
          type="text"
          placeholder={t('searchProducts')}
          value={searchQuery}
          onChange={onQueryChange}
          className="flex-1 px-2 sm:px-3 h-full border-0 bg-white text-black placeholder:text-gray-500 focus:ring-0 focus:outline-none text-sm min-w-0"
          aria-label={t('searchProducts')}
        />
      </div>

      <button
        type="submit"
        title={t('search')}
        className="h-10 px-2 sm:px-3 bg-[#febd69] hover:bg-[#f3a847] rounded-r-md transition-colors flex items-center justify-center flex-shrink-0 w-10"
        aria-label={t('search')}
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#131921]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
});

SearchBar.displayName = 'SearchBar';

const LanguageToggle = memo(({ language, onToggle }: { language: Language; onToggle: () => void }) => {
  const { t } = useTranslation(language);
  
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center space-x-1 text-white hover:text-[#febd69] transition-all border border-transparent hover:border-white px-2 py-1 rounded-md ml-2"
      aria-label={`Switch language to ${language === 'en' ? 'Hindi' : 'English'}`}
    >
      <div 
        className="w-4 h-3 bg-gradient-to-r from-orange-500 via-white to-green-500 rounded-sm border border-gray-300" 
        aria-hidden="true"
      />
      <span className="text-xs lg:text-sm font-medium hidden md:block">
        {language === 'en' ? t('en') : t('hi')}
      </span>
    </button>
  );
});

LanguageToggle.displayName = 'LanguageToggle';

const UserAvatar = memo(({ user }: { user: HeaderUser | null }) => {
  if (!user) return null;
  
  return (
    <div className="user-avatar bg-[#febd69] rounded-full flex items-center justify-center">
      <span className="text-black font-bold text-sm">
        {user.full_name?.charAt(0) || "U"}
      </span>
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

const UserDropdown = memo(({ 
  user, 
  language, 
  onSignOut 
}: { 
  user: HeaderUser | null; 
  language: Language; 
  onSignOut: () => void; 
}) => {
  const { t } = useTranslation(language);

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            type="button" 
            className="focus:outline-none hover:opacity-80 transition-opacity text-white p-2 rounded-md flex items-center space-x-1"
            aria-label={t('helloSignIn')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div className="hidden sm:block text-left">
              <div className="text-xs">{t('helloSignIn')}</div>
              <div className="font-bold text-xs flex items-center">
                {t('accountsLists')}
                <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="p-4">
            <div className="text-center mb-4">
              <button 
                type="button" 
                className="w-full bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-2 px-4 rounded transition-colors"
                aria-label={t('signIn')}
              >
                {t('signIn')}
              </button>
            </div>
            <div className="text-center text-sm">
              <span className="text-gray-600">{t('newCustomer')} </span>
              <Link to="/signup" className="text-[#007185] hover:underline font-medium">
                {t('startHere')}
              </Link>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">{t('yourLists')}</h4>
                  <ul className="space-y-1">
                    <li>
                      <Link to="/wishlist" className="text-[#007185] hover:underline">
                        {t('createList')}
                      </Link>
                    </li>
                    <li>
                      <Link to="/buy-again" className="text-[#007185] hover:underline">
                        {t('buyAgain')}
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('yourAccount')}</h4>
                  <ul className="space-y-1">
                    <li>
                      <Link to="/account" className="text-[#007185] hover:underline">
                        {t('account')}
                      </Link>
                    </li>
                    <li>
                      <Link to="/orders" className="text-[#007185] hover:underline">
                        {t('orders')}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button" 
          className="focus:outline-none hover:opacity-80 transition-opacity text-white p-2 rounded-md flex items-center space-x-1"
          aria-label={`${t('hello')}, ${user.full_name?.split(' ')[0] || 'User'}`}
        >
          <UserAvatar user={user} />
          <div className="hidden sm:block text-left">
            <div className="text-xs">{t('hello')}, {user.full_name?.split(' ')[0] || "User"}</div>
            <div className="font-bold text-xs flex items-center">
              {t('accountsLists')}
              <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.full_name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">{t('yourProfile')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/orders">{t('yourOrders')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">{t('yourAccount')}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserDropdown.displayName = 'UserDropdown';

const CartLink = memo(({ totalQty, language }: { totalQty: number; language: Language }) => {
  const { t } = useTranslation(language);

  return (
    <Link
      to="/cart"
      className="relative flex items-center text-white hover:text-[#febd69] transition-all duration-200 p-2 rounded-md"
      aria-label={`${t('cart')} with ${totalQty} items`}
    >
      <div className="relative">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {totalQty > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-[#f08804] text-white text-xs min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full font-bold text-[10px]"
            aria-label={`${totalQty} items in cart`}
          >
            {totalQty}
          </span>
        )}
      </div>
    </Link>
  );
});

CartLink.displayName = 'CartLink';

const MobileMenu = memo(({ 
  user, 
  language, 
  isOpen, 
  onOpenChange, 
  onSignOut 
}: {
  user: HeaderUser | null;
  language: Language;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
}) => {
  const { t } = useTranslation(language);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button 
          type="button"
          title={t('menu')}
          className="lg:hidden text-white hover:text-[#febd69] p-2 rounded-md flex-shrink-0"
          aria-label={t('menu')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left">
            {user ? (
              <div className="flex items-center space-x-3">
                <UserAvatar user={user} />
                <div>
                  <div className="text-sm">{t('hello')}, {user.full_name?.split(' ')[0] || "User"}</div>
                  <div className="text-xs text-gray-600">{user.email}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm">{t('helloSignIn')}</div>
                  <div className="text-xs text-gray-600">{t('accountsLists')}</div>
                </div>
              </div>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {!user && (
            <div className="text-center">
              <button 
                type="button" 
                className="w-full bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-2 px-4 rounded transition-colors"
                aria-label={t('signIn')}
              >
                {t('signIn')}
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-3">{t('trending')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link 
                    to="/" 
                    className="hover:text-[#febd69] focus:text-[#febd69] focus:outline-none flex items-center space-x-1"
                    onClick={() => onOpenChange(false)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>{t('home')}</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/bestsellers" 
                    className="hover:text-[#febd69] focus:text-[#febd69] focus:outline-none"
                    onClick={() => onOpenChange(false)}
                  >
                    {t('bestsellers')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/new-releases" 
                    className="hover:text-[#febd69] focus:text-[#febd69] focus:outline-none"
                    onClick={() => onOpenChange(false)}
                  >
                    {t('newReleases')}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-3">{t('shopByCategory')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link 
                    to="/men" 
                    className="hover:text-[#febd69] focus:text-[#febd69] focus:outline-none"
                  >
                    {t('mensFashion')}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/women" 
                    className="hover:text-[#febd69] focus:text-[#febd69] focus:outline-none"
                  >
                    {t('womensFashion')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {user && (
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={onSignOut}
                className="w-full text-left text-sm hover:text-[#febd69] focus:text-[#febd69] focus:outline-none"
              >
                {t('signOut')}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});

MobileMenu.displayName = 'MobileMenu';

const SecondaryNav = memo(({ 
  language, 
  isAllMenuOpen, 
  onAllMenuOpenChange,
  user,
  onSignOut 
}: {
  language: Language;
  isAllMenuOpen: boolean;
  onAllMenuOpenChange: (open: boolean) => void;
  user: HeaderUser | null;
  onSignOut: () => void;
}) => {
  const { t } = useTranslation(language);

  return (
    <div className="bg-[#232f3e] border-b border-[#37475a]">
      <div className="w-full px-2 lg:px-6 h-[40px] flex items-center max-w-screen-2xl mx-auto">
        <Sheet open={isAllMenuOpen} onOpenChange={onAllMenuOpenChange}>
          <SheetTrigger asChild>
            <button 
              type="button" 
              className="flex items-center space-x-1 lg:space-x-2 text-white hover:text-[#febd69] px-2 py-1 rounded-md transition-colors focus:outline-none focus:text-[#febd69]"
              aria-label={t('all')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs lg:text-sm font-medium hidden md:block">{t('all')}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[350px] sm:w-[400px] bg-[#232f3e] text-white border-l border-[#37475a]">
            <SheetHeader>
              <SheetTitle className="text-left text-white">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <UserAvatar user={user} />
                    <div>
                      <div className="text-sm">{t('hello')}, {user.full_name?.split(' ')[0] || "User"}</div>
                      <div className="text-xs text-gray-300">{t('welcomeBack')}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm">{t('helloSignIn')}</div>
                      <div className="text-xs text-gray-300">{t('accountsLists')}</div>
                    </div>
                  </div>
                )}
              </SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {!user && (
                <div className="text-center">
                  <button 
                    type="button" 
                    className="w-full bg-[#febd69] hover:bg-[#f3a847] text-black font-bold py-3 px-4 rounded transition-colors"
                    aria-label={t('signInToAccount')}
                  >
                    {t('signInToAccount')}
                  </button>
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-4 border-b border-[#37475a] pb-2">
                    {t('trending')}
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <Link 
                        to="/" 
                        className="block hover:text-[#febd69] hover:bg-[#37475a] px-2 py-1 rounded transition-colors focus:text-[#febd69] focus:bg-[#37475a] focus:outline-none flex items-center space-x-1"
                        onClick={() => onAllMenuOpenChange(false)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>{t('home')}</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/bestsellers" 
                        className="block hover:text-[#febd69] hover:bg-[#37475a] px-2 py-1 rounded transition-colors focus:text-[#febd69] focus:bg-[#37475a] focus:outline-none"
                        onClick={() => onAllMenuOpenChange(false)}
                      >
                        {t('bestsellers')}
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/new-releases" 
                        className="block hover:text-[#febd69] hover:bg-[#37475a] px-2 py-1 rounded transition-colors focus:text-[#febd69] focus:bg-[#37475a] focus:outline-none"
                        onClick={() => onAllMenuOpenChange(false)}
                      >
                        {t('newReleases')}
                      </Link>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-4 border-b border-[#37475a] pb-2">
                    {t('shopByCategory')}
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <Link 
                        to="/men" 
                        className="block hover:text-[#febd69] hover:bg-[#37475a] px-2 py-1 rounded transition-colors focus:text-[#febd69] focus:bg-[#37475a] focus:outline-none"
                      >
                        {t('mensFashion')}
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/women" 
                        className="block hover:text-[#febd69] hover:bg-[#37475a] px-2 py-1 rounded transition-colors focus:text-[#febd69] focus:bg-[#37475a] focus:outline-none"
                      >
                        {t('womensFashion')}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              
              {user && (
                <div className="pt-4 border-t border-[#37475a]">
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full text-left text-sm hover:text-[#febd69] hover:bg-[#37475a] px-2 py-1 rounded transition-colors focus:text-[#febd69] focus:bg-[#37475a] focus:outline-none"
                  >
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <div className="hidden lg:flex items-center space-x-3 xl:space-x-6 ml-4 lg:ml-6">
          <Link
            to="/"
            className="text-white text-xs lg:text-sm font-medium hover:text-[#febd69] transition-colors px-2 py-1 rounded-md focus:outline-none focus:text-[#febd69] flex items-center space-x-1"
            title="Go to Homepage"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{t('home')}</span>
          </Link>
          <Link
            to="/today-deals"
            className="text-white text-xs lg:text-sm font-medium hover:text-[#febd69] transition-colors px-2 py-1 rounded-md focus:outline-none focus:text-[#febd69]"
          >
            {t('todaysDeals')}
          </Link>
          <Link
            to="/customer-service"
            className="text-white text-xs lg:text-sm font-medium hover:text-[#febd69] transition-colors px-2 py-1 rounded-md focus:outline-none focus:text-[#febd69]"
          >
            {t('customerService')}
          </Link>
          <Link
            to="/registry"
            className="text-white text-xs lg:text-sm font-medium hover:text-[#febd69] transition-colors px-2 py-1 rounded-md focus:outline-none focus:text-[#febd69]"
          >
            {t('registry')}
          </Link>
          <Link
            to="/gift-cards"
            className="text-white text-xs lg:text-sm font-medium hover:text-[#febd69] transition-colors px-2 py-1 rounded-md focus:outline-none focus:text-[#febd69]"
          >
            {t('giftCards')}
          </Link>
        </div>
      </div>
    </div>
  );
});

SecondaryNav.displayName = 'SecondaryNav';

// Main Header Component
export default function Header() {
  const { cart } = useCart();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [language, setLanguage] = useState<Language>("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAllMenuOpen, setIsAllMenuOpen] = useState(false);

  // Translation handled by child components

  // Memoized calculations for better performance
  const totalQty = useMemo(() => 
    cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
    [cart]
  );

  const homeLink = useMemo(() => {
    if (location.pathname.startsWith("/wholeseller")) return "/wholeseller";
    if (location.pathname.startsWith("/admin")) return "/admin";
    return "/";
  }, [location.pathname]);

  // Memoized handlers for better performance
  const handleSearch = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Implement search functionality here
    console.log("Searching for:", searchQuery, "in category:", searchCategory);
    // TODO: Implement actual search logic
  }, [searchQuery, searchCategory]);

  const handleSearchQueryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearchCategoryChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSearchCategory(e.target.value);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === "en" ? "hi" : "en");
  }, []);

  const handleMobileMenuOpenChange = useCallback((open: boolean) => {
    setIsMobileMenuOpen(open);
  }, []);

  const handleAllMenuOpenChange = useCallback((open: boolean) => {
    setIsAllMenuOpen(open);
  }, []);

  // Safe user casting
  const safeUser = useMemo(() => user as HeaderUser | null, [user]);

  return (
    <HeaderErrorBoundary>
      <>
        <header className="sticky top-0 z-50 bg-[#131921]">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-2 flex items-center max-w-screen-2xl mx-auto min-h-[64px]">
            {/* Left Section - Logo and Mobile Menu */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 header-section-fixed flex-shrink-0 ml-1 mr-4 sm:ml-2 sm:mr-5 lg:ml-3 lg:mr-7">
              <MobileMenu
                user={safeUser}
                language={language}
                isOpen={isMobileMenuOpen}
                onOpenChange={handleMobileMenuOpenChange}
                onSignOut={handleSignOut}
              />
              <Logo homeLink={homeLink} />
            </div>

            {/* Center Section - Unified Search */}
            <div className="flex-1 min-w-0 max-w-2xl mx-3 sm:mx-4 lg:mx-6 xl:mx-8 header-section">
              <SearchBar
                searchQuery={searchQuery}
                searchCategory={searchCategory}
                language={language}
                onSearch={handleSearch}
                onQueryChange={handleSearchQueryChange}
                onCategoryChange={handleSearchCategoryChange}
              />
            </div>

            {/* Right Section - Navigation and User Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 header-section-fixed flex-shrink-0 ml-3 sm:ml-4 lg:ml-6">
              <LanguageToggle
                language={language}
                onToggle={toggleLanguage}
              />

              <div className="flex items-center space-x-1 sm:space-x-2">
                <UserDropdown
                  user={safeUser}
                  language={language}
                  onSignOut={handleSignOut}
                />

                <CartLink
                  totalQty={totalQty}
                  language={language}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Secondary Navbar */}
        <SecondaryNav
          language={language}
          isAllMenuOpen={isAllMenuOpen}
          onAllMenuOpenChange={handleAllMenuOpenChange}
          user={safeUser}
          onSignOut={handleSignOut}
        />
      </>
    </HeaderErrorBoundary>
  );
}
