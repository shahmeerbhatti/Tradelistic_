import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addProduct, aiAutofillProduct, aiCreateProduct } from '../services/api';
import ExporterHeader from '../components/ExporterHeader';
import { CATEGORY_OPTIONS, SUBCATEGORY_OPTIONS } from '../utils/categoryConstants';

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    images: [],
    category: 'others',
    subcategory: '',
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPublishing, setAiPublishing] = useState(false);

  const availableSubcategories = useMemo(() => SUBCATEGORY_OPTIONS[formData.category] || [], [formData.category]);

  useEffect(() => {
    const userType = localStorage.getItem('user_type');
    if (!userType) {
      navigate('/login');
    } else if (userType !== 'exporter') {
      setError('Only exporters can add products');
      setTimeout(() => navigate('/'), 1200);
    }
  }, [navigate]);

  useEffect(() => () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [imagePreviews]);

  const updateField = (name, value) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === 'category' ? { subcategory: '' } : {}),
    }));
    setError('');
  };

  const handleImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (formData.images.length + files.length > 4) {
      setError('You can upload up to 4 images only.');
      return;
    }

    const invalidFiles = files.filter((file) => !file.type.startsWith('image/'));
    if (invalidFiles.length) {
      setError('Please select image files only.');
      return;
    }

    setFormData((current) => ({ ...current, images: [...current.images, ...files] }));
    setImagePreviews((current) => [...current, ...files.map((file) => URL.createObjectURL(file))]);
    setAiMessage('');
    setError('');
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setFormData((current) => ({ ...current, images: current.images.filter((_, itemIndex) => itemIndex !== index) }));
    setImagePreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const runAiAutofill = async () => {
    if (!formData.images.length) {
      setError('Upload at least one product image before AI Autofill.');
      return;
    }

    setAiLoading(true);
    setError('');
    setAiMessage('');
    try {
      const payload = new FormData();
      formData.images.forEach((image, index) => payload.append(`image_${index}`, image));
      const response = await aiAutofillProduct(payload);
      const data = response.data;

      setFormData((current) => ({
        ...current,
        name: data.title || current.name,
        description: data.description || current.description,
        price: data.price || current.price,
        category: data.category || current.category,
        subcategory: data.subcategory || current.subcategory,
      }));
      const confidence = Number(data.confidence || 0);
      const warning = data.warning ? ` ${data.warning}` : '';
      const sourceLabel = String(data.source || 'AI').replace(/_/g, ' ');
      setAiMessage(`${confidence < 0.5 ? 'AI needs review.' : 'AI filled title, description, category and price.'} Source: ${sourceLabel}. Confidence ${(confidence * 100).toFixed(0)}%.${warning}`);
    } catch (err) {
      setError(err.response?.data?.error || 'AI Autofill failed. Try another image.');
    } finally {
      setAiLoading(false);
    }
  };

  const publishWithAi = async () => {
    if (!formData.images.length) {
      setError('Upload one product image first.');
      return;
    }

    setAiPublishing(true);
    setError('');
    setAiMessage('');
    try {
      const payload = new FormData();
      payload.append('image', formData.images[0]);
      const response = await aiCreateProduct(payload);
      const product = response.data.product;
      const ai = response.data.ai || {};
      const confidence = Number(ai.confidence || 0);
      setAiMessage(`AI created and published "${product.name}". Confidence ${(confidence * 100).toFixed(0)}%. Please review listing details if confidence is low.`);
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      setTimeout(() => navigate(`/product/${product.id}`), 500);
    } catch (err) {
      setError(err.response?.data?.error || 'AI product publish failed. Check API key or try another image.');
    } finally {
      setAiPublishing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!localStorage.getItem('token')) throw new Error('Please login to add a product');
      if (localStorage.getItem('user_type') !== 'exporter') throw new Error('Only exporters can add products');

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('price', formData.price);
      payload.append('category', formData.category);
      payload.append('subcategory', formData.subcategory);
      formData.images.forEach((image, index) => payload.append(`image_${index}`, image));
      if (formData.images[0]) payload.append('image', formData.images[0]);

      await addProduct(payload);
      navigate('/exporter-store');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ExporterHeader showBackButton currentPage="Add Product" />
      <main className="min-h-[calc(100dvh-72px)] bg-[#f3f7ff] px-4 py-5 dark:bg-slate-950 md:px-8 lg:px-14">
        <section className="mx-auto grid max-w-[1480px] gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <form onSubmit={handleSubmit} className="rounded-[30px] border border-blue-100 bg-white p-5 shadow-xl shadow-blue-950/5 dark:border-white/10 dark:bg-white/8 lg:p-6">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-700 dark:bg-white/10 dark:text-blue-200">Exporter listing</span>
            <h1 className="mt-3 text-[clamp(2rem,3.8vw,3.8rem)] font-black leading-none text-slate-950 dark:text-white">Add product</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-5 text-slate-500 dark:text-blue-100">Upload images, use AI Autofill, then publish a polished listing.</p>

            {error && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">{error}</div>}
            {aiMessage && <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-black text-blue-700 dark:bg-white/10 dark:text-blue-200">{aiMessage}</div>}

            <div className="mt-5 grid gap-5">
              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                Product title
                <input value={formData.name} onChange={(event) => updateField('name', event.target.value)} required className="mt-2 h-14 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 text-base font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
              </label>

              <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                Description
                <textarea value={formData.description} onChange={(event) => updateField('description', event.target.value)} required rows="5" className="mt-2 w-full rounded-2xl border border-blue-100 bg-blue-50 p-4 text-base font-semibold leading-7 text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white"></textarea>
              </label>

              <div className="grid gap-5 md:grid-cols-3">
                <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                  Price
                  <input value={formData.price} onChange={(event) => updateField('price', event.target.value)} type="number" min="0" step="0.01" required className="mt-2 h-14 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 text-base font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white" />
                </label>

                <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                  Category
                  <select value={formData.category} onChange={(event) => updateField('category', event.target.value)} className="mt-2 h-14 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 text-base font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                    {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <label className="text-sm font-black text-slate-700 dark:text-blue-100">
                  Subcategory
                  <select value={formData.subcategory} onChange={(event) => updateField('subcategory', event.target.value)} required className="mt-2 h-14 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 text-base font-bold text-slate-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                    <option value="">Select</option>
                    {availableSubcategories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-7 h-14 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-60">
              {loading ? 'Publishing product...' : 'Publish product'}
            </button>
          </form>

          <aside className="h-fit rounded-[38px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-sm font-black uppercase text-blue-700 dark:text-blue-200">Product images</span>
                <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">AI-ready upload</h2>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-blue-200">
                <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
              </span>
            </div>

            <input id="imageUpload" type="file" accept="image/*" multiple onChange={handleImages} className="hidden" disabled={formData.images.length >= 4} />
            <label htmlFor="imageUpload" className="mt-5 grid min-h-40 cursor-pointer place-items-center rounded-[28px] border-2 border-dashed border-blue-200 bg-blue-50 p-6 text-center transition hover:border-blue-400 dark:border-white/10 dark:bg-white/10">
              <span>
                <i className="fas fa-cloud-arrow-up text-4xl text-blue-500" aria-hidden="true"></i>
                <span className="mt-3 block text-sm font-black text-slate-950 dark:text-white">{formData.images.length ? `Add more images (${formData.images.length}/4)` : 'Choose 1-4 product images'}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-blue-100">AI uses image file names and image set to suggest content.</span>
              </span>
            </label>

            {imagePreviews.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={preview} className="group relative h-36 overflow-hidden rounded-3xl border border-blue-100 bg-blue-50 dark:border-white/10 dark:bg-white/10">
                    <img src={preview} alt="" className="h-full w-full object-contain p-3" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-2xl bg-white text-red-600 opacity-0 shadow-lg transition group-hover:opacity-100">
                      <i className="fas fa-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={runAiAutofill} disabled={aiLoading || !formData.images.length} className="mt-5 h-14 w-full rounded-2xl bg-slate-950 text-sm font-black text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-1 disabled:opacity-50 dark:bg-white dark:text-slate-950">
              {aiLoading ? 'AI analyzing images...' : 'AI Autofill details'}
            </button>

            <button type="button" onClick={publishWithAi} disabled={aiPublishing || !formData.images.length} className="mt-3 h-14 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 disabled:opacity-50">
              {aiPublishing ? 'AI creating live product...' : 'AI generate & publish from 1 image'}
            </button>

            <div className="mt-5 rounded-3xl bg-blue-50 p-4 text-sm font-semibold leading-6 text-slate-600 dark:bg-white/10 dark:text-blue-100">
              Upload one image, then AI can generate title, description, category, price and publish it directly to the marketplace.
            </div>
          </aside>
        </section>
      </main>
    </>
  );
};

export default AddProduct;
