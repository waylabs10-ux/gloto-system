'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getMyBusiness, saveBusinessProfile, checkSlug } from '@/lib/api';
import { BusinessProfile } from '@/types/database';
import { Loader2, Save, Store, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Partial<BusinessProfile>>({
    name: '',
    slug: '',
    primary_color: '#ea580c',
    logo_url: '',
    banner_url: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const data = await getMyBusiness();
        if (data) {
          setProfile(data);
        }
      } catch (err: any) {
        console.error(err);
        if (err.message === 'No autenticado') {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleSlugChange = async (val: string) => {
    const newSlug = val.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setProfile(p => ({ ...p, slug: newSlug }));
    
    if (newSlug.length < 3) {
      setSlugError('El slug debe tener al menos 3 caracteres');
      return;
    }
    
    try {
      const isAvailable = await checkSlug(newSlug, profile.id);
      if (!isAvailable) {
        setSlugError('Esta URL ya está en uso. Elige otra.');
      } else {
        setSlugError('');
      }
    } catch(err) {
      console.error("Error validando slug", err);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true);
      setError('');
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('business_assets')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('business_assets').getPublicUrl(filePath);
      setProfile(p => ({ ...p, logo_url: data.publicUrl }));
      setSuccess('Logo subido correctamente. Haz clic en Guardar perfil.');

    } catch (error: any) {
      setError(error.message || 'Error al subir el logo. ¿Está creado el bucket "business_assets"?');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugError) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await saveBusinessProfile(profile);
      setSuccess('¡Perfil guardado correctamente!');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Perfil de Negocio</h1>
        <p className="text-gray-500">Configura la información y apariencia de tu página de pedidos.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium text-sm">{error}</div>}
          {success && <div className="p-4 bg-green-50 text-green-700 rounded-xl font-medium text-sm">{success}</div>}

          {/* Información General */}
          <section className="space-y-4">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Información Principal</h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Negocio</label>
                <input
                  type="text"
                  required
                  value={profile.name || ''}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  placeholder="Ej. Hamburguesas Pepe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">URL Personalizada (Slug)</label>
                <div className="flex items-center">
                  <span className="px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500">
                    gloto.app/
                  </span>
                  <input
                    type="text"
                    required
                    value={profile.slug || ''}
                    onChange={e => handleSlugChange(e.target.value)}
                    className="flex-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400"
                    placeholder="burgers-pepe"
                  />
                </div>
                {slugError && <p className="text-red-500 text-xs font-medium mt-2">{slugError}</p>}
                <p className="text-xs text-gray-500 mt-2">Tus clientes usarán este enlace para ordenar.</p>
              </div>
            </div>
          </section>

          {/* Brand Identity */}
          <section className="space-y-4">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Identidad Visual</h3>
            
            <div className="grid gap-8 md:grid-cols-2 lg:items-start">
              {/* Color Picker */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Color Principal de Marca</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                    <input
                      type="color"
                      value={profile.primary_color || '#ea580c'}
                      onChange={e => setProfile({...profile, primary_color: e.target.value})}
                      className="absolute -top-2 -left-2 w-24 h-24 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={profile.primary_color || ''}
                      onChange={e => setProfile({...profile, primary_color: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Usado en botones y acentos de tu web final.</p>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Logo del Negocio</label>
                <div className="flex items-center gap-4">
                  {profile.logo_url ? (
                    <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm flex items-center justify-center">
                      <img src={profile.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-gray-200 border-dashed bg-gray-50 flex items-center justify-center text-gray-400">
                      <Store className="w-6 h-6" />
                    </div>
                  )}
                  
                  <div className="relative flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button type="button" disabled={uploadingLogo} className="w-full px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadingLogo ? 'Subiendo...' : 'Elegir Archivo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving || !!slugError}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Guardar Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
