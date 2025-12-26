import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save,
  CreditCard,
  Download,
  Trash2,
  Moon,
  Sun,
  Scale,
  Plus,
  Info,
  Check,
  X as XIcon,
  Target,
  Layers
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface TradingAccount {
  id: string;
  name: string;
  dailyStopValue: number;
  tradeStopValue: number;
  stopErrorMarginPercent: number;
}

interface TradingStrategy {
  id: string;
  name: string;
}

interface TradingAsset {
  id: string;
  name: string;
}

const Settings = () => {
  const { theme, setTheme, language, setLanguage, t } = useApp();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Trader Rules - Trading Accounts
  const [accounts, setAccounts] = useState<TradingAccount[]>([
    { id: '1', name: 'Main Account', dailyStopValue: 500, tradeStopValue: 100, stopErrorMarginPercent: 10 }
  ]);
  const [newAccount, setNewAccount] = useState<Partial<TradingAccount>>({
    name: '',
    dailyStopValue: 0,
    tradeStopValue: 0,
    stopErrorMarginPercent: 10
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Trading - Strategies and Assets
  const [strategies, setStrategies] = useState<TradingStrategy[]>([
    { id: '1', name: 'Opening Range Breakout' },
    { id: '2', name: 'Trend Pullback' },
    { id: '3', name: 'Support/Resistance Reversal' }
  ]);
  const [newStrategyName, setNewStrategyName] = useState('');

  const [assets, setAssets] = useState<TradingAsset[]>([
    { id: '1', name: 'ES' },
    { id: '2', name: 'NQ' },
    { id: '3', name: 'CL' },
    { id: '4', name: 'GC' }
  ]);
  const [newAssetName, setNewAssetName] = useState('');

  const tabs = [
    { id: "profile", label: t.settings.profile, icon: User },
    { id: "trading", label: "Trading", icon: CreditCard },
    { id: "traderRules", label: t.settings.traderRules, icon: Scale },
    { id: "appearance", label: t.settings.appearance, icon: Palette },
    { id: "notifications", label: t.settings.notifications, icon: Bell },
    { id: "privacy", label: t.settings.privacy, icon: Shield },
    { id: "data", label: t.settings.data, icon: Download },
  ];

  const handleSave = () => {
    toast({
      title: language === 'pt' ? "Configurações salvas" : language === 'es' ? "Configuración guardada" : "Settings saved",
      description: language === 'pt' ? "Suas preferências foram atualizadas." : language === 'es' ? "Tus preferencias fueron actualizadas." : "Your preferences have been updated successfully.",
    });
  };

  const handleAddAccount = () => {
    if (!newAccount.name) return;
    const account: TradingAccount = {
      id: Date.now().toString(),
      name: newAccount.name || '',
      dailyStopValue: newAccount.dailyStopValue || 0,
      tradeStopValue: newAccount.tradeStopValue || 0,
      stopErrorMarginPercent: newAccount.stopErrorMarginPercent || 10
    };
    setAccounts([...accounts, account]);
    setNewAccount({ name: '', dailyStopValue: 0, tradeStopValue: 0, stopErrorMarginPercent: 10 });
    setIsAddingAccount(false);
    toast({
      title: language === 'pt' ? "Conta adicionada" : language === 'es' ? "Cuenta agregada" : "Account added",
      description: account.name,
    });
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const handleAddStrategy = () => {
    if (!newStrategyName.trim()) return;
    const strategy: TradingStrategy = {
      id: Date.now().toString(),
      name: newStrategyName.trim()
    };
    setStrategies([...strategies, strategy]);
    setNewStrategyName('');
    toast({
      title: language === 'pt' ? "Estratégia adicionada" : language === 'es' ? "Estrategia agregada" : "Strategy added",
      description: strategy.name,
    });
  };

  const handleRemoveStrategy = (id: string) => {
    setStrategies(strategies.filter(s => s.id !== id));
  };

  const handleAddAsset = () => {
    if (!newAssetName.trim()) return;
    const asset: TradingAsset = {
      id: Date.now().toString(),
      name: newAssetName.trim().toUpperCase()
    };
    setAssets([...assets, asset]);
    setNewAssetName('');
    toast({
      title: language === 'pt' ? "Ativo adicionado" : language === 'es' ? "Activo agregado" : "Asset added",
      description: asset.name,
    });
  };

  const handleRemoveAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const languages = [
    { code: 'en' as const, label: 'English', flag: '🇺🇸' },
    { code: 'pt' as const, label: 'Português', flag: '🇧🇷' },
    { code: 'es' as const, label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.settings.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.settings.subtitle}</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-64"
          >
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="stat-card">
                  <h3 className="mb-6 text-lg font-semibold text-foreground">{t.settings.profile}</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Trader Pro"
                        className="input-trading w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue="trader@marketsync.io"
                        className="input-trading w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Timezone
                      </label>
                      <select className="input-trading w-full">
                        <option>America/New_York (EST)</option>
                        <option>America/Chicago (CST)</option>
                        <option>America/Los_Angeles (PST)</option>
                        <option>Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Base Currency
                      </label>
                      <select className="input-trading w-full">
                        <option>USD - US Dollar</option>
                        <option>EUR - Euro</option>
                        <option>GBP - British Pound</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "trading" && (
              <div className="space-y-6">
                {/* Strategies Card */}
                <div className="stat-card">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Strategies</h3>
                    </div>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Add the trading strategies you use to track your performance by strategy.
                  </p>

                  {/* Strategy List */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {strategies.map((strategy) => (
                      <div
                        key={strategy.id}
                        className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm"
                      >
                        <span className="text-foreground">{strategy.name}</span>
                        <button
                          onClick={() => handleRemoveStrategy(strategy.id)}
                          className="text-muted-foreground hover:text-loss transition-colors"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Strategy Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStrategyName}
                      onChange={(e) => setNewStrategyName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddStrategy()}
                      placeholder="Strategy name..."
                      className="input-trading flex-1"
                    />
                    <button
                      onClick={handleAddStrategy}
                      disabled={!newStrategyName.trim()}
                      className={cn(
                        "btn-primary",
                        !newStrategyName.trim() && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Assets Card */}
                <div className="stat-card">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2">
                        <Layers className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Assets</h3>
                    </div>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Add the assets/instruments you trade to track your performance by asset.
                  </p>

                  {/* Asset List */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm font-mono"
                      >
                        <span className="text-foreground">{asset.name}</span>
                        <button
                          onClick={() => handleRemoveAsset(asset.id)}
                          className="text-muted-foreground hover:text-loss transition-colors"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Asset Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddAsset()}
                      placeholder="Asset symbol (e.g., ES, NQ, CL)..."
                      className="input-trading flex-1 font-mono"
                    />
                    <button
                      onClick={handleAddAsset}
                      disabled={!newAssetName.trim()}
                      className={cn(
                        "btn-primary",
                        !newAssetName.trim() && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "traderRules" && (
              <div className="space-y-6">
                {/* Trading Accounts */}
                <div className="stat-card">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{t.settings.tradingAccounts}</h3>
                    <button
                      onClick={() => setIsAddingAccount(true)}
                      className="btn-primary text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      {t.settings.addAccount}
                    </button>
                  </div>

                  {/* Existing Accounts */}
                  <div className="space-y-4">
                    {accounts.map((account) => (
                      <div key={account.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">{account.name}</h4>
                            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">{t.settings.dailyStop}:</span>
                                <span className="ml-2 font-mono text-foreground">${account.dailyStopValue}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t.settings.tradeStop}:</span>
                                <span className="ml-2 font-mono text-foreground">${account.tradeStopValue}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t.settings.errorMargin}:</span>
                                <span className="ml-2 font-mono text-foreground">{account.stopErrorMarginPercent}%</span>
                              </div>
                            </div>
                          </div>
                          {accounts.length > 1 && (
                            <button
                              onClick={() => handleRemoveAccount(account.id)}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-loss/10 hover:text-loss"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Account Form */}
                  {isAddingAccount && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-muted-foreground">
                            {t.settings.accountName}
                          </label>
                          <input
                            type="text"
                            value={newAccount.name}
                            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                            className="input-trading w-full"
                            placeholder="My Account"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-muted-foreground">
                            {t.settings.dailyStop}
                          </label>
                          <input
                            type="number"
                            value={newAccount.dailyStopValue}
                            onChange={(e) => setNewAccount({ ...newAccount, dailyStopValue: parseFloat(e.target.value) })}
                            className="input-trading w-full font-mono"
                            placeholder="500"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-muted-foreground">
                            {t.settings.tradeStop}
                          </label>
                          <input
                            type="number"
                            value={newAccount.tradeStopValue}
                            onChange={(e) => setNewAccount({ ...newAccount, tradeStopValue: parseFloat(e.target.value) })}
                            className="input-trading w-full font-mono"
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-muted-foreground">
                            {t.settings.errorMargin} (%)
                          </label>
                          <input
                            type="number"
                            value={newAccount.stopErrorMarginPercent}
                            onChange={(e) => setNewAccount({ ...newAccount, stopErrorMarginPercent: parseFloat(e.target.value) })}
                            className="input-trading w-full font-mono"
                            placeholder="10"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button onClick={handleAddAccount} className="btn-primary">
                          <Check className="h-4 w-4" />
                          Add Account
                        </button>
                        <button 
                          onClick={() => setIsAddingAccount(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div className="stat-card">
                  <h3 className="mb-6 text-lg font-semibold text-foreground">{t.settings.theme}</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all",
                        theme === "light"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Sun className="h-8 w-8" />
                      <span className="font-medium">{t.settings.lightMode}</span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all",
                        theme === "dark"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Moon className="h-8 w-8" />
                      <span className="font-medium">{t.settings.darkMode}</span>
                    </button>
                  </div>
                </div>

                <div className="stat-card">
                  <h3 className="mb-6 text-lg font-semibold text-foreground">{t.settings.language}</h3>
                  <div className="flex gap-4">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all",
                          language === lang.code
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="font-medium">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="stat-card">
                  <h3 className="mb-6 text-lg font-semibold text-foreground">{t.settings.notifications}</h3>
                  <div className="space-y-4">
                    {[
                      { title: "Trade Reminders", description: "Get reminded about your trading journal" },
                      { title: "Streak Alerts", description: "Notifications when your streak is at risk" },
                      { title: "Weekly Summary", description: "Weekly performance summary emails" },
                      { title: "Mentor Activity", description: "Updates from your mentor's trades" },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between rounded-lg bg-secondary/30 p-4"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div className="stat-card">
                  <h3 className="mb-6 text-lg font-semibold text-foreground">{t.settings.privacy}</h3>
                  <div className="space-y-4">
                    {[
                      { title: "Hide P&L Values", description: "Show R-based results only instead of monetary values" },
                      { title: "Anonymous Profile", description: "Hide your name in mentor/student lists" },
                      { title: "Private Journal", description: "Prevent others from viewing your trades" },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between rounded-lg bg-secondary/30 p-4"
                      >
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-6">
                <div className="stat-card">
                  <h3 className="mb-6 text-lg font-semibold text-foreground">{t.settings.data}</h3>
                <div className="space-y-4">
                    <button className="flex w-full items-center justify-between rounded-lg bg-secondary/30 p-4 transition-colors hover:bg-secondary">
                      <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <p className="font-medium text-foreground">Export Data</p>
                          <p className="text-sm text-muted-foreground">Download all your trading data</p>
                        </div>
                      </div>
                    </button>
                    <button className="flex w-full items-center justify-between rounded-lg bg-loss/10 p-4 transition-colors hover:bg-loss/20">
                      <div className="flex items-center gap-3">
                        <Trash2 className="h-5 w-5 text-loss" />
                        <div className="text-left">
                          <p className="font-medium text-loss">Delete Account</p>
                          <p className="text-sm text-muted-foreground">Permanently delete your account</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              <button onClick={handleSave} className="btn-primary w-full md:w-auto">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
