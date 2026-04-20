import React from 'react';
import { submitIncomingPackage } from './actions';

export default function HubDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">WarekCargo Hub</h1>
          <p className="text-gray-500">Pindai / Input Barang Masuk Gudang</p>
        </div>

        <form action={submitIncomingPackage} className="space-y-6">
          <div>
            <label htmlFor="tracking_number" className="block text-sm font-semibold text-gray-700 mb-2">
              Nomor Resi 📦
            </label>
            <input
              type="text"
              name="tracking_number"
              id="tracking_number"
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Contoh: JP1234567890"
              required
            />
          </div>

          <div>
            <label htmlFor="hub_id" className="block text-sm font-semibold text-gray-700 mb-2">
              📍 Lokasi Hub
            </label>
            <select
              id="hub_id"
              name="hub_id"
              className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="JKT">Jakarta</option>
              <option value="SUB">Surabaya</option>
              <option value="MKS">Makassar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📷 Foto Bukti Kedatangan
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 transition-colors">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Unggah atau Foto</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" capture="environment" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-blue-500/30"
          >
            SImpan ke Database
          </button>
        </form>
      </div>
    </div>
  );
}
