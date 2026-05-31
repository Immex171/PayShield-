'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useCompany } from '../../hooks/useCompany';
import { usePayroll } from '../../hooks/usePayroll';
import { AddEmployeeForm } from '../../components/company/AddEmployeeForm';
import { FundPayrollCard } from '../../components/company/FundPayrollCard';
import { PayrollTable } from '../../components/company/PayrollTable';
import { AuditorAccessCard } from '../../components/auditor/AuditorAccessCard';
import { StatCard } from '../../components/shared/StatCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { WalletConnectButton } from '../../components/shared/WalletConnectButton';
import Link from 'next/link';
import { formatUnits } from 'viem';

type Tab = 'overview' | 'employees' | 'fund' | 'auditors';

export default function CompanyDashboard() {
  const { address, isConnected } = useAccount();
  const { companyPayrollAddress, isLoading: isLoadingCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { workerCount, vaultBalance, isLoading: isLoadingPayroll } = usePayroll(
    companyPayrollAddress
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold font-display">Connect Your Wallet</h2>
          <p className="text-white/50 text-sm">
            Connect as a company admin to create and manage your payroll.
          </p>
          <div className="flex justify-center mt-4">
            <WalletConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!companyPayrollAddress || companyPayrollAddress === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl">🏢</div>
          <h2 className="text-2xl font-bold font-display">No Payroll Found</h2>
          <p className="text-white/50 text-sm">
            Your wallet hasn&apos;t created a PayShield payroll yet. Get started now.
          </p>
          <Link href="/company/create-payroll" className="btn-primary inline-block">
            Create Payroll Contract
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'employees', label: 'Employees', icon: '👥' },
    { id: 'fund', label: 'Fund Vault', icon: '💰' },
    { id: 'auditors', label: 'Auditors', icon: '🔍' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Company Dashboard</h1>
            <p className="text-white/40 text-sm mt-1 font-mono">
              Payroll: {companyPayrollAddress?.slice(0, 12)}...{companyPayrollAddress?.slice(-8)}
            </p>
          </div>
          <span className="badge-active">🟢 Active</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Workers"
            value={workerCount ? String(workerCount) : '—'}
            icon={<span>👥</span>}
          />
          <StatCard
            label="Vault Balance"
            value={vaultBalance ? `$${parseFloat(formatUnits(vaultBalance, 6)).toLocaleString()}` : '—'}
            subValue="USDC"
            icon={<span>💰</span>}
          />
          <StatCard
            label="Total Salary"
            value="●●●●●"
            subValue="Encrypted"
            encrypted
            icon={<span>🔐</span>}
          />
          <StatCard
            label="Network"
            value="Fhenix"
            subValue="CoFHE Enabled"
            icon={<span>⛓️</span>}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Contract Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/40">Payroll Contract</span>
                  <span className="font-mono text-white/70 text-xs">{companyPayrollAddress}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/40">Admin Wallet</span>
                  <span className="font-mono text-white/70 text-xs">{address}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/40">Encryption</span>
                  <span className="badge-encrypted text-xs">FHE (euint128)</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/40">Privacy Level</span>
                  <span className="text-emerald-400 text-xs">Salary amounts never visible on-chain</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-5 border border-cyan-400/10">
              <p className="text-xs text-cyan-400/70">
                💡 Worker salary amounts are stored as <code className="bg-white/5 px-1 rounded">euint128</code> ciphertexts.
                Even block explorers cannot read the salary values. Only the designated worker can
                decrypt their own salary using FHE sealed output.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold text-white mb-5">Add New Worker</h3>
              <AddEmployeeForm
                payrollAddress={companyPayrollAddress}
                onSuccess={() => setActiveTab('overview')}
              />
            </div>
            <PayrollTable payrollAddress={companyPayrollAddress} />
          </div>
        )}

        {activeTab === 'fund' && (
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold text-white mb-5">Fund Payroll Vault</h3>
            <FundPayrollCard payrollAddress={companyPayrollAddress} />
          </div>
        )}

        {activeTab === 'auditors' && (
          <AuditorAccessCard payrollAddress={companyPayrollAddress} isCompanyAdmin />
        )}
      </div>
    </div>
  );
}
