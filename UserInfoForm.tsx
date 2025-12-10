import React, { useState } from 'react';
import Button from './Button';
import { User, Phone, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserInfo } from '../types';

interface UserInfoFormProps {
  onSubmit: (info: UserInfo) => void;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<UserInfo>({
    name: '',
    nativeLanguage: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Partial<UserInfo>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof UserInfo]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<UserInfo> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.nativeLanguage.trim()) newErrors.nativeLanguage = 'Native language is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s-]{8,}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid phone number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500">
      <div className="glass-strong p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/60 relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Almost There!</h2>
          <p className="text-slate-500 text-sm">Enter your details to generate your official score report and analysis.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Maria Müller"
                className={`w-full pl-11 pr-4 py-3.5 bg-white/60 backdrop-blur-sm border-2 rounded-xl outline-none transition-all placeholder:text-slate-400 focus:bg-white
                  ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs pl-1 font-medium animate-in slide-in-from-top-1">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Native Language</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Globe size={18} />
              </div>
              <select
                name="nativeLanguage"
                value={formData.nativeLanguage}
                onChange={handleChange}
                className={`w-full pl-11 pr-10 py-3.5 bg-white/60 backdrop-blur-sm border-2 rounded-xl outline-none transition-all focus:bg-white appearance-none cursor-pointer
                  ${errors.nativeLanguage ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}
                  ${!formData.nativeLanguage ? 'text-slate-400' : 'text-slate-800'}`}
              >
                <option value="" disabled>Select Language</option>
                <option value="English">English</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Tamil">Tamil</option>
                <option value="Hindi">Hindi</option>
                <option value="German">German</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Arabic">Arabic</option>
                <option value="Other">Other</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            {errors.nativeLanguage && <p className="text-red-500 text-xs pl-1 font-medium animate-in slide-in-from-top-1">{errors.nativeLanguage}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Phone Number</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
                className={`w-full pl-11 pr-4 py-3.5 bg-white/60 backdrop-blur-sm border-2 rounded-xl outline-none transition-all placeholder:text-slate-400 focus:bg-white
                  ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'}`}
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs pl-1 font-medium animate-in slide-in-from-top-1">{errors.phone}</p>}
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full justify-center shadow-lg shadow-indigo-200">
              Show My Results <ArrowRight size={20} />
            </Button>
            <p className="text-center text-[10px] text-slate-400 mt-4 px-4 leading-tight">
              By continuing, you agree to generate an AI assessment based on your session. Your data is used for result personalization.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UserInfoForm;