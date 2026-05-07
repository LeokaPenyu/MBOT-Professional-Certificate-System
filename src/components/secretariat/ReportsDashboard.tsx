import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Download, Calendar, Filter, Users, Award, 
  CreditCard, ShieldCheck, ChevronRight, PieChart as PieChartIcon, 
  BarChart2, Activity, ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';
import { getApplicants } from '../../lib/storage';
import { Applicant, ApplicantStatus, CPDStatus } from '../../types';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';

export default function ReportsDashboard() {
  const [data, setData] = useState<{
    statusDistribution: any[];
    fieldDistribution: any[];
    revenueData: any[];
    registrationTrend: any[];
  }>({
    statusDistribution: [],
    fieldDistribution: [],
    revenueData: [],
    registrationTrend: []
  });

  const [dateRange, setDateRange] = useState('This Year');

  useEffect(() => {
    const applicants = getApplicants();
    
    // 1. Status Distribution
    const statusCounts = applicants.reduce((acc: any, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});
    const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 2. Field Distribution
    const fieldCounts = applicants.reduce((acc: any, a) => {
      acc[a.field] = (acc[a.field] || 0) + 1;
      return acc;
    }, {});
    const fieldDistribution = Object.entries(fieldCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 8);

    // 3. Revenue Estimation (Mocked based on status/tags)
    // - Assessment: RM 300
    // - Certification: RM 350
    // - Renewal: RM 200
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueData = months.map(month => ({
      name: month,
      assessment: Math.floor(Math.random() * 5000) + 2000,
      certification: Math.floor(Math.random() * 7000) + 3000,
      renewal: Math.floor(Math.random() * 3000) + 1000
    }));

    // 4. Registration Trend
    const registrationTrend = months.map(month => ({
      name: month,
      count: Math.floor(Math.random() * 20) + 5
    }));

    setData({
      statusDistribution,
      fieldDistribution,
      revenueData,
      registrationTrend
    });
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f472b6'];

  const exportGeneralReport = () => {
    const applicants = getApplicants();
    
    // Prepare cleaned and formatted data
    const exportData = applicants.map(a => {
      const totalCpd = a.cpdRecords?.reduce((sum, r) => sum + (r.status === CPDStatus.APPROVED ? r.hours : 0), 0) || 0;
      
      return {
        'Full Name': a.fullName,
        'ID / Passport': a.icPassport,
        'Email Address': a.email,
        'Mobile Phone': a.phone || 'N/A',
        'Current Status': a.status,
        'Technology Field': a.field,
        'Qualification': a.qualification,
        'Exp (Yrs)': a.yearsOfExperience,
        'P.Tech No.': a.pTechNumber || '-',
        'GT No.': a.gtNumber || '-',
        'Reg. Date': new Date(a.registrationDate).toLocaleDateString(),
        'CPD Hours': totalCpd,
        'Fee: Assessment': a.feesPaid?.assessment ? 'PAID' : 'PENDING',
        'Fee: Certification': a.feesPaid?.certification ? 'PAID' : 'PENDING',
        'Fee: Renewal': a.feesPaid?.renewal ? 'PAID' : 'NOT DUE'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for a "neat" look
    const wscols = [
      { wch: 25 }, // Full Name
      { wch: 15 }, // ID/Passport
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 25 }, // Status
      { wch: 30 }, // Field
      { wch: 15 }, // Qualification
      { wch: 10 }, // Experience
      { wch: 15 }, // P.Tech
      { wch: 15 }, // GT
      { wch: 15 }, // Reg Date
      { wch: 12 }, // CPD
      { wch: 15 }, // Assess Fee
      { wch: 15 }, // Cert Fee
      { wch: 15 }, // Renewal Fee
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MBOT Registry Data");
    XLSX.writeFile(workbook, `MBOT_Registry_Intelligence_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight flex items-center gap-3">
            <BarChart2 className="text-blue-600" size={28} />
            Registry Intelligence Engine
          </h1>
          <p className="text-slate-500 text-sm font-medium">Strategic insights, fiscal tracking, and demographic analytics.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition shadow-sm"
          >
            <Printer size={14} /> Print Audit
          </button>
          <button 
            onClick={exportGeneralReport}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl"
          >
            <Download size={14} /> Export Dataset
          </button>
        </div>
      </div>

      {/* Hero Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Revenue (YTD)" 
          value="RM 142,500" 
          trend="+12.4%" 
          trendUp={true} 
          icon={<CreditCard size={20} />} 
          color="blue"
        />
        <MetricCard 
          title="Avg. Approval Time" 
          value="4.2 Days" 
          trend="-0.8d" 
          trendUp={true} 
          icon={<Activity size={20} />} 
          color="green"
        />
        <MetricCard 
          title="Conversion Rate" 
          value="68.4%" 
          trend="+5.2%" 
          trendUp={true} 
          icon={<TrendingUp size={20} />} 
          color="indigo"
        />
        <MetricCard 
          title="CPD Compliance" 
          value="92.1%" 
          trend="+1.2%" 
          trendUp={true} 
          icon={<Award size={20} />} 
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Registration Trends */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-bold text-xl text-slate-900 font-display">Registration Trajectory</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Monthly New Applicant Volume</p>
            </div>
            <select className="px-4 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest outline-none transition-colors focus:ring-2 focus:ring-blue-500/10 cursor-pointer">
              <option>Last 12 Months</option>
              <option>Last Quarter</option>
            </select>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.registrationTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col h-[500px]">
          <h3 className="font-bold text-xl text-slate-900 mb-2 font-display">Registry Status</h3>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-10">Current Workforce state</p>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-black text-slate-900 leading-none">{data.statusDistribution.reduce((acc, curr) => acc + curr.value, 0)}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Entities</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-8">
            {data.statusDistribution.slice(0, 4).map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[9px] font-black uppercase text-slate-500 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Domain Distribution */}
        <div className="lg:col-span-12 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-bold text-xl text-slate-900 font-display">Technological Domain Heatmap</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Cross-sector compliance and workforce density</p>
            </div>
            <button className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
              All Fields <ChevronRight size={14} />
            </button>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.fieldDistribution} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} width={150} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue/Fiscal Report */}
        <div className="lg:col-span-12 bg-slate-900 rounded-[2.5rem] p-10 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] -mr-48 -mt-48 transition-opacity"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-xl font-bold font-display">Revenue Intelligence Matrix</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Sustenance and Fiscal Projections</p>
              </div>
              <div className="flex gap-8 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-[9px] font-black tracking-widest uppercase">Assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span className="text-[9px] font-black tracking-widest uppercase">Certification</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black tracking-widest uppercase">Renewal</span>
                </div>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueData} stackOffset="sign">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  />
                  <Bar dataKey="assessment" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="certification" stackId="a" fill="#6366f1" />
                  <Bar dataKey="renewal" stackId="a" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, trendUp, icon, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600"
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group group cursor-default">
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", colorMap[color])}>
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full",
          trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        )}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900 font-display tracking-tight">{value}</p>
      </div>
    </div>
  );
}
