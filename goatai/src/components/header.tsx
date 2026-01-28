"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthModal } from "@/components/auth-modal";
import { Menu, X, LogOut, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CollegeSelector } from "@/components/college-selector";
import { Search } from "lucide-react"; // Import Search component
import { useAuth } from "@/components/auth-provider";
import { signOut } from "@/lib/auth-client";

export function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { session, isLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="font-bold text-2xl text-foreground tracking-tight leading-tight">goatai</span>
              <Image
                src="/logo.png"
                alt="GOATAI Logo"
                width={56}
                height={56}
                className="h-14 w-auto object-contain flex-shrink-0 -ml-1"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="#markets"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Markets
              </Link>
              <Link
                href="/wallet"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Wallet
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="#leaderboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Leaderboard
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <CollegeSelector variant="header" />
              <ThemeToggle />
              {session?.user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <Link href="/wallet">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      Karma
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="text-sm"
                    onClick={() => setIsAuthOpen(true)}
                    disabled={isLoading}
                  >
                    Log In
                  </Button>
                  <Button className="text-sm font-semibold" onClick={() => setIsAuthOpen(true)} disabled={isLoading}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="#markets"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Markets
              </Link>
              <Link
                href="/wallet"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Wallet
              </Link>
              <Link
                href="#how-it-works"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                How it Works
              </Link>
              <Link
                href="#leaderboard"
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Leaderboard
              </Link>
              {session?.user ? (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="pt-3 border-t border-border flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setIsAuthOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLoading}
                  >
                    Log In
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setIsAuthOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLoading}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
