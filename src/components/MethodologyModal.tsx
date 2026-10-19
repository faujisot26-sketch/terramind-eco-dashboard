import React, { useState } from 'react';
import { Calculator, X, Sparkles } from 'lucide-react';
import { WasteCategory } from '../types';
import { MATERIAL_CARBON_FACTORS } from '../constants';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  const [calcMaterial, setCalcMaterial] = useState<WasteCategory>('Plastic');
  const [calcQtyKg, setCalcQtyKg] = useState<number>(5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-emerald-100 overflow-hidden">
        <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/80">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-base">Carbon Audit Methodology &amp; Live Calculator</h3>
          </div>
          <button onClick={onClose} className="cursor-pointer">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600 max-h-[75vh] overflow-y-auto leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">1. Material-Specific Avoided Lifecycle Factors</h4>
            <p>Avoided emissions are derived from ISO 14040/44 life cycle assessments comparing diversion to virgin manufacturing:</p>
            <ul className="list-disc pl-5 mt-1.5 space-y-1">
              <li><strong>Plastics:</strong> 1.40 kg CO₂e / kg avoided resin synthesis and cracking.</li>
              <li><strong>Paper &amp; Cardboard:</strong> 0.95 kg CO₂e / kg avoided pulping and forest carbon loss.</li>
              <li><strong>Organic Kitchen Scraps:</strong> 0.50 kg CO₂e / kg avoided anaerobic landfill methane.</li>
              <li><strong>Glass:</strong> 0.30 kg CO₂e / kg thermal savings in cullet remelting.</li>
              <li><strong>Metals (Aluminum/Steel):</strong> 4.50 kg CO₂e / kg avoided primary smelting draw.</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm mb-1">2. Regional Grid Electricity Benchmark</h4>
            <p>
              Electricity is evaluated against a regional standard grid carbon intensity of <strong>0.82 kg CO₂e / kWh</strong> (derived from CEA National Baseline Database for India). Household energy savings are benchmarked against an active daily baseline of <strong>10.5 kWh/day</strong> for a modern residential household.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm mb-1">3. Clear Verification Hierarchy</h4>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p><strong>• Verified Log:</strong> Direct empirical quantities logged by the user (actual appliance kWh, weighed kilograms).</p>
              <p><strong>• Model Estimate:</strong> Carbon savings derived using lifecycle scientific factors and grid baselines.</p>
              <p><strong>• Gamified Achievement:</strong> Terra Eco-Score (40% waste diversion + 30% consistency + 30% quest completion).</p>
            </div>
          </div>

          {/* Interactive Live Formula Calculator */}
          <div className="pt-3 border-t border-slate-100 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
            <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Interactive Formula Tester for Competition Judges
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Test Material</label>
                <select
                  value={calcMaterial}
                  onChange={e => setCalcMaterial(e.target.value as WasteCategory)}
                  className="w-full bg-white text-xs border border-slate-200 rounded-lg p-1.5"
                >
                  <option value="Plastic">Plastic (1.40 kg/kg)</option>
                  <option value="Paper">Paper (0.95 kg/kg)</option>
                  <option value="Organic">Organic (0.50 kg/kg)</option>
                  <option value="Glass">Glass (0.30 kg/kg)</option>
                  <option value="Metal">Metal (4.50 kg/kg)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity (kg)</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={calcQtyKg}
                  onChange={e => setCalcQtyKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white text-xs border border-slate-200 rounded-lg p-1.5"
                >
                </input>
              </div>
            </div>
            <div className="p-2 bg-white rounded-xl border border-emerald-200/80 text-[11px] font-semibold text-emerald-900 flex justify-between items-center">
              <span>Avoided CO₂e Result:</span>
              <strong className="text-emerald-700 text-xs">
                {calcQtyKg} × {MATERIAL_CARBON_FACTORS[calcMaterial]} = {(calcQtyKg * MATERIAL_CARBON_FACTORS[calcMaterial]).toFixed(2)} kg CO₂e
              </strong>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};