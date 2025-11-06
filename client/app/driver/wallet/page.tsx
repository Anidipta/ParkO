"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Minus, Eye, EyeOff, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true)
  const [balance, setBalance] = useState(5420)
  const [topupAmount, setTopupAmount] = useState("")
  const [showTopupModal, setShowTopupModal] = useState(false)

  const recentTransactions = [
    { id: 1, date: "Nov 2, 10:30 AM", description: "Downtown Plaza Booking", amount: -120, type: "debit" },
    { id: 2, date: "Nov 1, 2:15 PM", description: "Wallet Top-up via Card", amount: 1000, type: "credit" },
    { id: 3, date: "Oct 30, 9:45 AM", description: "Metro Station Booking", amount: -150, type: "debit" },
    { id: 4, date: "Oct 28, 6:20 PM", description: "Refund - Cancelled Booking", amount: 60, type: "credit" },
  ]

  const handleTopup = () => {
    if (topupAmount) {
      setBalance(balance + Number.parseInt(topupAmount))
      setTopupAmount("")
      setShowTopupModal(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/driver/dashboard">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Parko Wallet</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex items-start justify-between mb-12">
            <div>
              <p className="text-sm opacity-75 mb-1">Total Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">₹{showBalance ? balance.toLocaleString() : "****"}</span>
              </div>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 hover:bg-primary-foreground/20 rounded-lg transition-colors"
            >
              {showBalance ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </button>
          </div>

          <div className="flex gap-3">
            <Button size="sm" variant="secondary" className="gap-2" onClick={() => setShowTopupModal(true)}>
              <Plus className="w-4 h-4" />
              Add Money
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
            >
              <Wallet className="w-4 h-4" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* Topup Modal */}
        {showTopupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-xl font-bold text-foreground mb-4">Add Money to Wallet</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Amount (₹)</label>
                  <Input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopupAmount(String(amt))}
                      className="px-4 py-2 border border-border rounded-lg hover:border-primary transition-colors font-semibold text-foreground"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowTopupModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleTopup} disabled={!topupAmount} className="flex-1">
                    Proceed
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      txn.type === "credit" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {txn.type === "credit" ? (
                      <Plus className={`w-5 h-5 ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`} />
                    ) : (
                      <Minus className={`w-5 h-5 ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">{txn.date}</p>
                  </div>
                </div>
                <span className={`text-lg font-bold ${txn.type === "credit" ? "text-green-600" : "text-foreground"}`}>
                  {txn.type === "credit" ? "+" : "-"}₹{Math.abs(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
