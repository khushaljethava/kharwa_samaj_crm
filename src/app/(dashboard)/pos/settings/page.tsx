"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Settings, 
  Receipt, 
  Calculator, 
  CreditCard, 
  Printer,
  Bell,
  Shield,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface POSSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  defaultTaxRate: number;
  defaultDiscount: number;
  currency: string;
  currencySymbol: string;
  receiptHeader: string;
  receiptFooter: string;
  autoPrint: boolean;
  requireCustomerInfo: boolean;
  allowNegativeStock: boolean;
  backupFrequency: string;
  notifications: {
    lowStock: boolean;
    newOrders: boolean;
    dailyReports: boolean;
  };
}

export default function POSSettingsPage() {
  const [settings, setSettings] = useState<POSSettings>({
    companyName: "My Company",
    companyAddress: "123 Business Street, City, State 12345",
    companyPhone: "+1 (555) 123-4567",
    companyEmail: "info@mycompany.com",
    defaultTaxRate: 18,
    defaultDiscount: 0,
    currency: "INR",
    currencySymbol: "₹",
    receiptHeader: "Thank you for your purchase!",
    receiptFooter: "Please visit again",
    autoPrint: false,
    requireCustomerInfo: false,
    allowNegativeStock: false,
    backupFrequency: "daily",
    notifications: {
      lowStock: true,
      newOrders: true,
      dailyReports: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      // In a real app, this would fetch from an API
      // For now, we'll use the default settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      // In a real app, this would save to an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully!");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function handleSettingChange(key: string, value: any) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  function handleNotificationChange(key: string, value: boolean) {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
    setHasChanges(true);
  }

  function resetToDefaults() {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings({
        companyName: "My Company",
        companyAddress: "123 Business Street, City, State 12345",
        companyPhone: "+1 (555) 123-4567",
        companyEmail: "info@mycompany.com",
        defaultTaxRate: 18,
        defaultDiscount: 0,
        currency: "INR",
        currencySymbol: "₹",
        receiptHeader: "Thank you for your purchase!",
        receiptFooter: "Please visit again",
        autoPrint: false,
        requireCustomerInfo: false,
        allowNegativeStock: false,
        backupFrequency: "daily",
        notifications: {
          lowStock: true,
          newOrders: true,
          dailyReports: false,
        },
      });
      setHasChanges(true);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/pos">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to POS
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">POS Settings</h1>
                <p className="text-gray-600">Configure your Point of Sale system</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                disabled={saving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button
                onClick={saveSettings}
                disabled={saving || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card className="p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 mb-1 block">
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => handleSettingChange("companyName", e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="companyPhone" className="text-sm font-medium text-gray-700 mb-1 block">
                    Phone Number
                  </Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone}
                    onChange={(e) => handleSettingChange("companyPhone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="companyAddress" className="text-sm font-medium text-gray-700 mb-1 block">
                    Address
                  </Label>
                  <Textarea
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => handleSettingChange("companyAddress", e.target.value)}
                    placeholder="Enter company address"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="companyEmail" className="text-sm font-medium text-gray-700 mb-1 block">
                    Email Address
                  </Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => handleSettingChange("companyEmail", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </Card>

            {/* Sales Settings */}
            <Card className="p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Sales Settings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultTaxRate" className="text-sm font-medium text-gray-700 mb-1 block">
                    Default Tax Rate (%)
                  </Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    value={settings.defaultTaxRate}
                    onChange={(e) => handleSettingChange("defaultTaxRate", Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultDiscount" className="text-sm font-medium text-gray-700 mb-1 block">
                    Default Discount (%)
                  </Label>
                  <Input
                    id="defaultDiscount"
                    type="number"
                    value={settings.defaultDiscount}
                    onChange={(e) => handleSettingChange("defaultDiscount", Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700 mb-1 block">
                    Currency
                  </Label>
                  <select
                    id="currency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={settings.currency}
                    onChange={(e) => handleSettingChange("currency", e.target.value)}
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    
                  </select>
                </div>
                <div>
                  <Label htmlFor="currencySymbol" className="text-sm font-medium text-gray-700 mb-1 block">
                    Currency Symbol
                  </Label>
                  <Input
                    id="currencySymbol"
                    value={settings.currencySymbol}
                    onChange={(e) => handleSettingChange("currencySymbol", e.target.value)}
                    placeholder="Enter currency symbol"
                  />
                </div>
              </div>
            </Card>

            {/* Receipt Settings */}
            <Card className="p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Printer className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Receipt Settings</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="receiptHeader" className="text-sm font-medium text-gray-700 mb-1 block">
                    Receipt Header
                  </Label>
                  <Textarea
                    id="receiptHeader"
                    value={settings.receiptHeader}
                    onChange={(e) => handleSettingChange("receiptHeader", e.target.value)}
                    placeholder="Enter receipt header message"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="receiptFooter" className="text-sm font-medium text-gray-700 mb-1 block">
                    Receipt Footer
                  </Label>
                  <Textarea
                    id="receiptFooter"
                    value={settings.receiptFooter}
                    onChange={(e) => handleSettingChange("receiptFooter", e.target.value)}
                    placeholder="Enter receipt footer message"
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoPrint"
                    checked={settings.autoPrint}
                    onChange={(e) => handleSettingChange("autoPrint", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoPrint" className="text-sm text-gray-700">
                    Auto-print receipts after sale
                  </Label>
                </div>
              </div>
            </Card>

            {/* System Settings */}
            <Card className="p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireCustomerInfo"
                    checked={settings.requireCustomerInfo}
                    onChange={(e) => handleSettingChange("requireCustomerInfo", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="requireCustomerInfo" className="text-sm text-gray-700">
                    Require customer information for all sales
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowNegativeStock"
                    checked={settings.allowNegativeStock}
                    onChange={(e) => handleSettingChange("allowNegativeStock", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="allowNegativeStock" className="text-sm text-gray-700">
                    Allow negative stock (backorders)
                  </Label>
                </div>
                <div>
                  <Label htmlFor="backupFrequency" className="text-sm font-medium text-gray-700 mb-1 block">
                    Backup Frequency
                  </Label>
                  <select
                    id="backupFrequency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={settings.backupFrequency}
                    onChange={(e) => handleSettingChange("backupFrequency", e.target.value)}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card className="p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Bell className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="lowStock"
                    checked={settings.notifications.lowStock}
                    onChange={(e) => handleNotificationChange("lowStock", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="lowStock" className="text-sm text-gray-700">
                    Low stock alerts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="newOrders"
                    checked={settings.notifications.newOrders}
                    onChange={(e) => handleNotificationChange("newOrders", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="newOrders" className="text-sm text-gray-700">
                    New order notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dailyReports"
                    checked={settings.notifications.dailyReports}
                    onChange={(e) => handleNotificationChange("dailyReports", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="dailyReports" className="text-sm text-gray-700">
                    Daily sales reports
                  </Label>
                </div>
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Backup</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Up to date</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Sync</span>
                  <span className="text-sm text-gray-900">2 minutes ago</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Backup Data
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Check
                </Button>
              </div>
            </Card>

            {/* Save Status */}
            {hasChanges && (
              <Card className="p-4 shadow-sm border-yellow-200 bg-yellow-50">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">You have unsaved changes</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {saving ? "Saving..." : "Save Now"}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

