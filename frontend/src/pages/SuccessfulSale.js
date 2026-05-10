import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SuccessfulSale = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const isCheckout = Boolean(state.fromCheckout);
  const orders = useMemo(() => {
    if (isCheckout) return state.orders || [];
    if (state.product) {
      return [{
        id: state.saleData?.sale_id || state.saleData?.order_id || 'single',
        sale_id: state.saleData?.sale_id,
        sales_id: state.saleData?.sales_id,
        product_id: state.product.id,
        product_name: state.product.name,
        quantity: state.quantity || 1,
        total_price: (Number(state.product.price || 0) * Number(state.quantity || 1)).toFixed(2),
      }];
    }
    return [];
  }, [isCheckout, state]);

  const total = useMemo(() => {
    if (state.totalAmount) return Number(state.totalAmount);
    return orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  }, [orders, state.totalAmount]);

  const receiptId = state.saleData?.order_id || state.demoPaymentId || `RCPT-${Date.now().toString().slice(-6)}`;
  const paymentMethod = state.paymentMethod || 'Stripe Demo';

  if (!orders.length) {
    return (
      <main className="grid min-h-[80dvh] place-items-center px-4">
        <div className="rounded-[32px] border border-blue-100 bg-white p-8 text-center shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8">
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">No receipt found</h1>
          <button type="button" onClick={() => navigate('/products')} className="mt-6 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white">Back to products</button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-8 dark:text-white md:px-8 lg:px-14">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[38px] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-white/8 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-blue-100 pb-7 dark:border-white/10">
            <div>
              <span className="grid h-16 w-16 place-items-center rounded-[24px] bg-blue-600 text-2xl text-white shadow-xl shadow-blue-600/20">
                <i className="fas fa-check" aria-hidden="true"></i>
              </span>
              <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.8rem)] font-black leading-none text-slate-950 dark:text-white">Payment received</h1>
              <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-blue-100">Clean demo receipt for your confirmed order.</p>
            </div>
            <div className="rounded-3xl bg-blue-50 p-5 text-right dark:bg-white/10">
              <div className="text-xs font-black uppercase text-blue-700 dark:text-blue-200">Receipt</div>
              <div className="mt-1 text-lg font-black text-slate-950 dark:text-white">{receiptId}</div>
              <div className="mt-3 text-xs font-semibold text-slate-500 dark:text-blue-100">{new Date().toLocaleString()}</div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-blue-100 py-7 dark:border-white/10 sm:grid-cols-3">
            <div className="rounded-3xl bg-blue-50 p-5 dark:bg-white/10">
              <div className="text-xs font-black uppercase text-slate-400 dark:text-blue-100">Payment</div>
              <div className="mt-2 text-lg font-black text-slate-950 dark:text-white">{paymentMethod}</div>
            </div>
            <div className="rounded-3xl bg-blue-50 p-5 dark:bg-white/10">
              <div className="text-xs font-black uppercase text-slate-400 dark:text-blue-100">Status</div>
              <div className="mt-2 text-lg font-black text-blue-700 dark:text-blue-200">Completed</div>
            </div>
            <div className="rounded-3xl bg-blue-50 p-5 dark:bg-white/10">
              <div className="text-xs font-black uppercase text-slate-400 dark:text-blue-100">Orders</div>
              <div className="mt-2 text-lg font-black text-slate-950 dark:text-white">{orders.length}</div>
            </div>
          </div>

          <div className="py-7">
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Items</h2>
            <div className="mt-4 grid gap-3">
              {orders.map((order, index) => (
                <div key={order.id || index} className="grid gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4 dark:border-white/10 dark:bg-white/10 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-black text-blue-700 dark:bg-white/10 dark:text-blue-200">#{index + 1}</span>
                  <div>
                    <h3 className="text-base font-black text-slate-950 dark:text-white">{order.product_name}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-blue-100">Quantity: {order.quantity}</p>
                  </div>
                  <div className="grid gap-2 justify-items-start sm:justify-items-end">
                    <div className="text-xl font-black text-blue-700 dark:text-blue-200">${Number(order.total_price || 0).toFixed(2)}</div>
                    {order.product_id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${order.product_id}`)}
                        className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-blue-700 shadow-sm shadow-blue-950/5 dark:bg-white/10 dark:text-blue-100"
                      >
                        <i className="fas fa-star mr-2 text-amber-400" aria-hidden="true"></i>
                        Add review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] bg-slate-950 p-6 text-white dark:bg-white dark:text-slate-950">
            <div className="flex items-center justify-between text-sm font-bold text-white/70 dark:text-slate-500">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm font-bold text-white/70 dark:text-slate-500">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="my-5 h-px bg-white/15 dark:bg-slate-200"></div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-black">Total paid</span>
              <span className="text-3xl font-black">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => window.print()} className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-4 text-sm font-black text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
              <i className="fas fa-print mr-2" aria-hidden="true"></i>
              Print receipt
            </button>
            <button type="button" onClick={() => navigate('/products')} className="rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20">
              Continue shopping
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default SuccessfulSale;
