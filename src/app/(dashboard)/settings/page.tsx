"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Users, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Save,
  Download,
  Upload
} from "lucide-react";

type Settings = {
  organization: {
    name: string;
    type: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  members: {
    autoApprove: boolean;
    limit: number;
    defaultRole: string;
    welcomeEmail: boolean;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    lowStock: boolean;
    paymentReminders: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactor: string;
    dataRetention: number;
  };
  appearance: {
    theme: string;
    accent: string;
  };
};

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (ignore) return;
      setSettings(
        json?.data || {
          organization: { name: "Shree Kharva Samaj Mandvi", type: "community", address: "Mandvi, Kutch, Gujarat, India", phone: "+91 1234567890", email: "info@kharvasamaj.org", website: "https://kharvasamaj.org" },
          members: { autoApprove: false, limit: 1000, defaultRole: "member", welcomeEmail: true },
          notifications: { email: true, sms: false, lowStock: true, paymentReminders: true },
          security: { sessionTimeout: 30, maxLoginAttempts: 5, twoFactor: "false", dataRetention: 2555 },
          appearance: { theme: "system", accent: "blue" },
        },
      );
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      if (!res.ok) throw new Error("Save failed");
    } catch (e) {
      alert((e as any)?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <div>Loading…</div>;
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your community organization settings and preferences.
        </p>
      </div>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" value={settings.organization.name} onChange={(e) => setSettings({ ...settings, organization: { ...settings.organization, name: e.target.value } })} placeholder="Enter organization name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgType">Organization Type</Label>
              <Select value={settings.organization.type} onValueChange={(v) => setSettings({ ...settings, organization: { ...settings.organization, type: v } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="community">Community Organization</SelectItem>
                  <SelectItem value="religious">Religious Organization</SelectItem>
                  <SelectItem value="cultural">Cultural Organization</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={settings.organization.address} onChange={(e) => setSettings({ ...settings, organization: { ...settings.organization, address: e.target.value } })} placeholder="Enter address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={settings.organization.phone} onChange={(e) => setSettings({ ...settings, organization: { ...settings.organization, phone: e.target.value } })} placeholder="Enter phone number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={settings.organization.email} onChange={(e) => setSettings({ ...settings, organization: { ...settings.organization, email: e.target.value } })} placeholder="Enter email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={settings.organization.website} onChange={(e) => setSettings({ ...settings, organization: { ...settings.organization, website: e.target.value } })} placeholder="Enter website URL" />
            </div>
          </div>
          <Button className="w-full md:w-auto" onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Member Management Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Member Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="autoApprove">Auto-approve New Members</Label>
              <Select value={String(settings.members.autoApprove)} onValueChange={(v) => setSettings({ ...settings, members: { ...settings.members, autoApprove: v === "true" } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No (Manual approval required)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberLimit">Maximum Members</Label>
              <Input id="memberLimit" type="number" value={settings.members.limit} onChange={(e) => setSettings({ ...settings, members: { ...settings.members, limit: Number(e.target.value || 0) } })} placeholder="Enter limit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultRole">Default Member Role</Label>
              <Select value={settings.members.defaultRole} onValueChange={(v) => setSettings({ ...settings, members: { ...settings.members, defaultRole: v } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="vip">VIP Member</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeEmail">Send Welcome Email</Label>
              <Select value={String(settings.members.welcomeEmail)} onValueChange={(v) => setSettings({ ...settings, members: { ...settings.members, welcomeEmail: v === "true" } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <Select value={String(settings.notifications.email)} onValueChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, email: v === "true" } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
              <Select value={String(settings.notifications.sms)} onValueChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, sms: v === "true" } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
              <Select value={String(settings.notifications.lowStock)} onValueChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, lowStock: v === "true" } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReminders">Payment Reminders</Label>
              <Select value={String(settings.notifications.paymentReminders)} onValueChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, paymentReminders: v === "true" } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input id="sessionTimeout" type="number" value={settings.security.sessionTimeout} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeout: Number(e.target.value || 0) } })} placeholder="Enter timeout" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input id="maxLoginAttempts" type="number" value={settings.security.maxLoginAttempts} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, maxLoginAttempts: Number(e.target.value || 0) } })} placeholder="Enter limit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
              <Select value={settings.security.twoFactor} onValueChange={(v) => setSettings({ ...settings, security: { ...settings.security, twoFactor: v } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Required for all users</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataRetention">Data Retention (days)</Label>
              <Input id="dataRetention" type="number" value={settings.security.dataRetention} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, dataRetention: Number(e.target.value || 0) } })} placeholder="Enter days" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </Button>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              Clear All Data
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Export your data for backup or import data from other systems. 
            Be careful with data operations as they cannot be undone.
          </p>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultTheme">Default Theme</Label>
              <Select value={settings.appearance.theme} onValueChange={(v) => setSettings({ ...settings, appearance: { ...settings.appearance, theme: v } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <Select value={settings.appearance.accent} onValueChange={(v) => setSettings({ ...settings, appearance: { ...settings.appearance, accent: v } })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
