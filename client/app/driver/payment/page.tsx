"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Wallet, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PaymentMethod {
  id: string
  type: "card" | "wallet" | "upi"
  name: string
  details: string
  isDefault: boolean
}

export default function PaymentMethods() {
  const [activeTab, setActiveTab] = useState<"methods" | "wallet" | "history">("methods")
  const [showCardForm, setShowCardForm] = useState(false)
  const [showBalance, setShowBalance] = useState(false)
  const [walletBalance, setWalletBalance] = useState(5420)

  const paymentMethods: PaymentMethod[] = [
    {
      id: "card1",
      type: "card",
      name: "Visa Card",
      details: "**** **** **** 4242",
      isDefault: true,
    },
    {
      id: "upi1",
      type: "upi",
      name: "Google Pay",
      details: "john.doe@upi",
      isDefault: false,
    },
  ]

  const transactionHistory = [
    { id: "TXN001", date: "Nov 2, 2025", description: "Downtown Plaza Booking", amount: -120, type: "debit" },
    { id: "TXN002", date: "Nov 1, 2025", description: "Wallet Top-up", amount: 1000, type: "credit" },
    { id: "TXN003", date: "Oct 30, 2025", description: "Metro Station Booking", amount: -150, type: "debit" },
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/driver/dashboard">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Payment Methods</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          {(["methods", "wallet", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Methods Tab */}
        {activeTab === "methods" && (
          <div className="space-y-6">
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {method.type === "card" ? (
                        <CreditCard className="w-6 h-6 text-primary" />
                      ) : (
                        <Wallet className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.details}</p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>

            {!showCardForm && (
              <Button onClick={() => setShowCardForm(true)} variant="outline" className="w-full">
                + Add Payment Method
              </Button>
            )}

            {showCardForm && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-foreground">Add Card Details</h3>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Card Number</label>
                  <Input placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Expiry</label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">CVV</label>
                    <Input placeholder="***" type="password" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCardForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={() => setShowCardForm(false)} className="flex-1">
                    Add Card
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg p-8">
              <p className="text-sm opacity-75 mb-2">Wallet Balance</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">₹</span>
                  <span className="text-5xl font-bold">{showBalance ? walletBalance : "****"}</span>
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-primary-foreground/20 rounded-lg transition-colors"
                >
                  {showBalance ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            <Button className="w-full py-6">+ Add Money to Wallet</Button>

            <div>
              <h3 className="font-bold text-foreground mb-3">Recent Transactions</h3>
              <div className="space-y-2">
                {transactionHistory.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{txn.date}</p>
                    </div>
                    <span className={`font-bold ${txn.type === "credit" ? "text-green-600" : "text-foreground"}`}>
                      {txn.type === "credit" ? "+" : "-"}₹{Math.abs(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {transactionHistory.map((txn) => (
              <div
                key={txn.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{txn.description}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">{txn.date}</p>
                </div>
                <span className={`text-lg font-bold ${txn.type === "credit" ? "text-green-600" : "text-foreground"}`}>
                  {txn.type === "credit" ? "+" : "-"}₹{Math.abs(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
